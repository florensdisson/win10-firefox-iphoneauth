globalThis.APB = globalThis.APB || {};

(function (ns) {
  const p = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
  const a = p - 3n;
  const b = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
  const n = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
  const G = {
    x: 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296n,
    y: 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5n,
  };

  function mod(v, m) {
    const r = v % m;
    return r >= 0n ? r : r + m;
  }

  function invert(v, m) {
    let [old_r, r] = [mod(v, m), m];
    let [old_s, s] = [1n, 0n];
    while (r !== 0n) {
      const q = old_r / r;
      [old_r, r] = [r, old_r - q * r];
      [old_s, s] = [s, old_s - q * s];
    }
    if (old_r !== 1n) throw new Error('not invertible');
    return mod(old_s, m);
  }

  function pointAdd(P, Q) {
    if (P === null) return Q;
    if (Q === null) return P;
    if (P.x === Q.x) {
      if (mod(P.y + Q.y, p) === 0n) return null;
      const lambda = mod((3n * P.x * P.x + a) * invert(2n * P.y, p), p);
      const x = mod(lambda * lambda - 2n * P.x, p);
      const y = mod(lambda * (P.x - x) - P.y, p);
      return { x, y };
    }
    const lambda = mod((Q.y - P.y) * invert(Q.x - P.x, p), p);
    const x = mod(lambda * lambda - P.x - Q.x, p);
    const y = mod(lambda * (P.x - x) - P.y, p);
    return { x, y };
  }

  function pointMul(k, P) {
    let result = null;
    let addend = P;
    k = mod(k, n);
    while (k > 0n) {
      if (k & 1n) result = pointAdd(result, addend);
      addend = pointAdd(addend, addend);
      k >>= 1n;
    }
    return result;
  }

  function pad32(v) {
    let h = v.toString(16);
    if (h.length > 64) throw new Error('value too large for P-256 field');
    return h.padStart(64, '0');
  }

  function privateFromSeed(seed) {
    if (seed.length !== 32) throw new Error('seed must be 32 bytes');
    let d = 0n;
    for (const byte of seed) d = d * 256n + BigInt(byte);
    d = mod(d, n);
    if (d === 0n) d = 1n;
    return d;
  }

  function publicFromPrivate(d) {
    return pointMul(d, G);
  }

  function compress(P) {
    const out = new Uint8Array(33);
    out[0] = (P.y & 1n) === 0n ? 0x02 : 0x03;
    out.set(hexToBytes(pad32(P.x)), 1);
    return out;
  }

  function decompress(bytes) {
    if (bytes.length !== 33 || (bytes[0] !== 0x02 && bytes[0] !== 0x03)) {
      throw new Error('invalid compressed P-256 point');
    }
    const x = bytesToHex(bytes.slice(1));
    const xBig = BigInt('0x' + x);
    const ySq = mod(xBig * xBig * xBig + a * xBig + b, p);
    let y = modPow(ySq, (p + 1n) / 4n, p);
    if ((y & 1n) !== BigInt(bytes[0] & 1)) y = p - y;
    if (mod(y * y, p) !== ySq) throw new Error('point not on curve');
    return { x: xBig, y };
  }

  function modPow(base, exp, m) {
    let result = 1n;
    base = mod(base, m);
    while (exp > 0n) {
      if (exp & 1n) result = mod(result * base, m);
      base = mod(base * base, m);
      exp >>= 1n;
    }
    return result;
  }

  function hexToBytes(h) {
    const out = new Uint8Array(h.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  function fromUncompressed(bytes) {
    if (bytes.length !== 65 || bytes[0] !== 0x04) throw new Error('invalid uncompressed P-256 point');
    const x = BigInt('0x' + bytesToHex(bytes.slice(1, 33)));
    const y = BigInt('0x' + bytesToHex(bytes.slice(33, 65)));
    const ySq = mod(x * x * x + a * x + b, p);
    if (mod(y * y, p) !== ySq) throw new Error('point not on curve');
    return { x, y };
  }

  function toUncompressed(P) {
    const out = new Uint8Array(65);
    out[0] = 0x04;
    out.set(hexToBytes(pad32(P.x)), 1);
    out.set(hexToBytes(pad32(P.y)), 33);
    return out;
  }

  function toJwkPublic(P) {
    return {
      kty: 'EC',
      crv: 'P-256',
      x: ns.util.b64urlEncode(hexToBytes(pad32(P.x))),
      y: ns.util.b64urlEncode(hexToBytes(pad32(P.y))),
    };
  }

  function toJwkPrivate(d, P) {
    return Object.assign(toJwkPublic(P), {
      d: ns.util.b64urlEncode(hexToBytes(pad32(d))),
    });
  }

  ns.p256 = {
    p, n, G,
    pointAdd, pointMul, privateFromSeed, publicFromPrivate,
    compress, decompress, fromUncompressed, toUncompressed, toJwkPublic, toJwkPrivate, pad32,
  };
})(globalThis.APB);
