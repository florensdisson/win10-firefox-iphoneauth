globalThis.APB = globalThis.APB || {};

(function (ns) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function utf8(s) {
    return enc.encode(s);
  }

  function concat(...parts) {
    let len = 0;
    for (const p of parts) len += p.length;
    const out = new Uint8Array(len);
    let off = 0;
    for (const p of parts) {
      out.set(p, off);
      off += p.length;
    }
    return out;
  }

  function hex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function fromHex(str) {
    if (str.length % 2) throw new Error('invalid hex length');
    const out = new Uint8Array(str.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(str.substr(i * 2, 2), 16);
    }
    return out;
  }

  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  function b64urlEncode(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
      const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
      out += B64[b0 >> 2];
      out += B64[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
      out += b1 === undefined ? '' : B64[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
      out += b2 === undefined ? '' : B64[b2 & 63];
    }
    return out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function randomBytes(n) {
    const out = new Uint8Array(n);
    crypto.getRandomValues(out);
    return out;
  }

  function equalBytes(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  ns.util = { utf8, dec, concat, hex, fromHex, b64urlEncode, b64urlDecode, randomBytes, equalBytes };
})(globalThis.APB);
