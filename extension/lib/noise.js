globalThis.APB = globalThis.APB || {};

(function (ns) {
  const PROTOCOL_NAMES = {
    NKpsk0: 'Noise_NKpsk0_P256_AESGCM_SHA256',
    KNpsk0: 'Noise_KNpsk0_P256_AESGCM_SHA256',
    NK: 'Noise_NK_P256_AESGCM_SHA256',
  };

  function toBytes(v) {
    if (v instanceof Uint8Array) return v;
    if (typeof v === 'string') return ns.util.utf8(v);
    return Uint8Array.from(v);
  }

  async function sha256(data) {
    const h = await crypto.subtle.digest('SHA-256', toBytes(data));
    return new Uint8Array(h);
  }

  async function hkdf2(ck, ikm) {
    const out = await ns.derive.hkdfSha256(toBytes(ikm), toBytes(ck), new Uint8Array(0), 64);
    return [out.slice(0, 32), out.slice(32, 64)];
  }

  class NoiseState {
    constructor(pattern) {
      const name = PROTOCOL_NAMES[pattern];
      if (!name) throw new Error('unknown pattern ' + pattern);
      this.pattern = pattern;
      this.ck = new Uint8Array(32);
      this.h = new Uint8Array(32);
      const nameBytes = ns.util.utf8(name);
      this.ck.set(nameBytes.subarray(0, 32));
      this.h.set(this.ck);
      this.key = null;
      this.n = 0;
    }

    async mixHash(data) {
      this.h = await sha256(ns.util.concat(this.h, toBytes(data)));
    }

    async mixKey(ikm) {
      const [ck, tempK] = await hkdf2(this.ck, ikm);
      this.ck = ck;
      this.key = tempK;
      this.n = 0;
    }

    async mixKeyAndHash(ikm) {
      const out = await ns.derive.hkdfSha256(toBytes(ikm), this.ck, new Uint8Array(0), 96);
      this.ck = out.slice(0, 32);
      await this.mixHash(out.slice(32, 64));
      this.key = out.slice(64, 96);
      this.n = 0;
    }

    nonce() {
      const out = new Uint8Array(12);
      new DataView(out.buffer).setUint32(0, this.n >>> 0, false);
      this.n++;
      return out;
    }

    async encryptAndHash(plaintext) {
      if (!this.key) throw new Error('no key set');
      const ct = new Uint8Array(
        await crypto.subtle.encrypt({ name: 'AES-GCM', iv: this.nonce(), additionalData: this.h }, await this.importAes(this.key), toBytes(plaintext))
      );
      await this.mixHash(ct);
      return ct;
    }

    async decryptAndHash(ciphertext) {
      if (!this.key) throw new Error('no key set');
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: this.nonce(), additionalData: this.h }, await this.importAes(this.key), toBytes(ciphertext));
      await this.mixHash(ciphertext);
      return new Uint8Array(pt);
    }

    async importAes(keyBytes) {
      if (this._aes && ns.util.equalBytes(this._aesKey, keyBytes)) return this._aes;
      this._aesKey = keyBytes;
      this._aes = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      return this._aes;
    }

    async trafficKeys() {
      return hkdf2(this.ck, new Uint8Array(0));
    }
  }

  async function importPrivateJwk(jwk) {
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  }

  async function importPublicJwk(jwk) {
    return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  }

  async function ecdh(privKey, peerPublicJwk) {
    const pub = await importPublicJwk(peerPublicJwk);
    const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, privKey, 256);
    return new Uint8Array(bits);
  }

  async function generateEphemeral() {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
    const pubJwk = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
    const d = BigInt('0x' + ns.util.b64urlDecode(jwk.d).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), ''));
    const point = ns.p256.publicFromPrivate(d);
    return { privKey: kp.privateKey, jwk, pubUncompressed: ns.p256.toUncompressed(point) };
  }

  async function initiatorNkPsk0({ psk, peerStaticUncompressed }) {
    const noise = new NoiseState('NKpsk0');
    await noise.mixHash(new Uint8Array([0]));
    await noise.mixHash(peerStaticUncompressed);
    await noise.mixKeyAndHash(psk);
    const e = await generateEphemeral();
    await noise.mixHash(e.pubUncompressed);
    await noise.mixKey(e.pubUncompressed);
    const peerPoint = ns.p256.fromUncompressed(peerStaticUncompressed);
    const es = await ecdh(e.privKey, ns.p256.toJwkPublic(peerPoint));
    await noise.mixKey(es);
    return { noise, ephemeral: e };
  }

  async function buildFirstMessage(initiator, payload) {
    const ct = await initiator.noise.encryptAndHash(payload || new Uint8Array(0));
    return ns.util.concat(initiator.ephemeral.pubUncompressed, ct);
  }

  async function responderNkPsk0({ psk, ownStaticPrivateJwk, ownStaticUncompressed }) {
    const noise = new NoiseState('NKpsk0');
    await noise.mixHash(new Uint8Array([0]));
    await noise.mixHash(ownStaticUncompressed);
    await noise.mixKeyAndHash(psk);
    const privKey = await importPrivateJwk(ownStaticPrivateJwk);
    return { noise, privKey };
  }

  async function processFirstMessage(responder, message) {
    if (message.length < 65) throw new Error('handshake message too short');
    const ePub = message.slice(0, 65);
    const ct = message.slice(65);
    const ePoint = ns.p256.fromUncompressed(ePub);
    await responder.noise.mixHash(ePub);
    await responder.noise.mixKey(ePub);
    const es = await ecdh(responder.privKey, ns.p256.toJwkPublic(ePoint));
    await responder.noise.mixKey(es);
    return responder.noise.decryptAndHash(ct);
  }

  ns.noise = {
    NoiseState, PROTOCOL_NAMES,
    initiatorNkPsk0, buildFirstMessage, responderNkPsk0, processFirstMessage,
    generateEphemeral, importPrivateJwk, importPublicJwk, ecdh,
  };
})(globalThis.APB);
