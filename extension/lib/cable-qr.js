globalThis.APB = globalThis.APB || {};

(function (ns) {
  const PREFIX = 'FIDO:/';
  const CHUNK_SIZE = 7;
  const CHUNK_DIGITS = 17;
  const WIDTHS = [0, 3, 5, 8, 10, 13, 15, 17];
  const TRAILING = { 3: 1, 5: 2, 8: 3, 10: 4, 13: 5, 15: 6, 17: 7 };

  function bytesToDigits(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const n = Math.min(CHUNK_SIZE, bytes.length - i);
      let v = 0n;
      for (let j = 0; j < n; j++) v = v * 256n + BigInt(bytes[i + j]);
      out += v.toString().padStart(WIDTHS[n], '0');
    }
    return out;
  }

  function digitsToBytes(digits) {
    if (digits.length === 0 || !/^\d+$/.test(digits)) return null;
    const out = [];
    let rest = digits;
    while (rest.length >= CHUNK_DIGITS) {
      const v = BigInt(rest.slice(0, CHUNK_DIGITS));
      if (v >> BigInt(CHUNK_SIZE * 8) !== 0n) return null;
      for (let j = CHUNK_SIZE - 1; j >= 0; j--) {
        out.push(Number((v >> BigInt(j * 8)) & 0xffn));
      }
      rest = rest.slice(CHUNK_DIGITS);
    }
    if (rest.length > 0) {
      const n = TRAILING[rest.length];
      if (n === undefined) return null;
      const v = BigInt(rest);
      if (v >> BigInt(n * 8) !== 0n) return null;
      for (let j = n - 1; j >= 0; j--) {
        out.push(Number((v >> BigInt(j * 8)) & 0xffn));
      }
    }
    return Uint8Array.from(out);
  }

  function generateQrKey() {
    return {
      seed: ns.util.randomBytes(32),
      secret: ns.util.randomBytes(16),
    };
  }

  async function buildQrUrl(qrKey, requestType, options) {
    options = options || {};
    const d = ns.p256.privateFromSeed(qrKey.seed);
    const pub = ns.p256.publicFromPrivate(d);
    const compressed = ns.p256.compress(pub);
    const map = new Map();
    map.set(0, compressed);
    map.set(1, qrKey.secret);
    map.set(2, options.numKnownDomains === undefined ? 2 : options.numKnownDomains);
    map.set(3, options.timestamp === undefined ? Math.floor(Date.now() / 1000) : options.timestamp);
    map.set(4, options.linking === undefined ? false : options.linking);
    map.set(5, requestType);
    const cborBytes = ns.cbor.encode(map);
    return PREFIX + bytesToDigits(cborBytes);
  }

  function parseQrUrl(url) {
    if (typeof url !== 'string' || url.slice(0, PREFIX.length).toUpperCase() !== PREFIX) {
      return null;
    }
    const bytes = digitsToBytes(url.slice(PREFIX.length));
    if (!bytes) return null;
    const decoded = ns.cbor.decode(bytes);
    if (!(decoded.value instanceof Map)) return null;
    const m = decoded.value;
    const compressed = m.get(0);
    const secret = m.get(1);
    if (!(compressed instanceof Uint8Array) || compressed.length !== 33) return null;
    if (!(secret instanceof Uint8Array) || secret.length !== 16) return null;
    return {
      compressedPublicKey: compressed,
      peerIdentity: ns.p256.toUncompressed(ns.p256.decompress(compressed)),
      secret,
      numKnownDomains: m.get(2),
      timestamp: m.get(3),
      linking: m.get(4),
      requestType: m.get(5),
    };
  }

  async function tunnelIdFromSecret(secret) {
    return ns.derive.deriveValue(secret, new Uint8Array(0), ns.derive.DERIVED_TYPES.TUNNEL_ID, 16);
  }

  async function pskFromSecret(secret) {
    return ns.derive.deriveValue(secret, new Uint8Array(0), ns.derive.DERIVED_TYPES.PSK, 32);
  }

  async function eidKeyFromQrKey(qrKey) {
    const material = ns.util.concat(qrKey.seed, qrKey.secret);
    return ns.derive.deriveValue(material, new Uint8Array(0), ns.derive.DERIVED_TYPES.EID_KEY, 64);
  }

  ns.cableQr = {
    PREFIX, bytesToDigits, digitsToBytes,
    generateQrKey, buildQrUrl, parseQrUrl,
    tunnelIdFromSecret, pskFromSecret, eidKeyFromQrKey,
  };
})(globalThis.APB);
