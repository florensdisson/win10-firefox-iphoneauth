globalThis.APB = globalThis.APB || {};

(function (ns) {
  const DERIVED_TYPES = {
    EID_KEY: 1,
    TUNNEL_ID: 2,
    PSK: 3,
    PAIRED_SECRET: 4,
    IDENTITY_KEY_SEED: 5,
    PER_CONTACT_ID_SECRET: 6,
  };

  async function hkdfSha256(ikm, salt, info, lengthBytes) {
    const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info },
      key,
      lengthBytes * 8
    );
    return new Uint8Array(bits);
  }

  async function deriveValue(secret, nonce, type, lengthBytes) {
    const info = new Uint8Array(4);
    new DataView(info.buffer).setUint32(0, type, true);
    return hkdfSha256(secret, nonce, info, lengthBytes);
  }

  ns.derive = { DERIVED_TYPES, hkdfSha256, deriveValue };
})(globalThis.APB);
