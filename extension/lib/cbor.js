globalThis.APB = globalThis.APB || {};

(function (ns) {
  function encodeHead(major, value) {
    const m = major << 5;
    if (value < 24) return Uint8Array.of(m | value);
    if (value < 0x100) return Uint8Array.of(m | 24, value);
    if (value < 0x10000) {
      return Uint8Array.of(m | 25, value >> 8, value & 0xff);
    }
    if (value < 0x100000000) {
      return Uint8Array.of(m | 26, (value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
    }
    const hi = Math.floor(value / 0x100000000);
    const lo = value >>> 0;
    return Uint8Array.of(
      m | 27,
      (hi >>> 24) & 0xff, (hi >>> 16) & 0xff, (hi >>> 8) & 0xff, hi & 0xff,
      (lo >>> 24) & 0xff, (lo >>> 16) & 0xff, (lo >>> 8) & 0xff, lo & 0xff
    );
  }

  function encode(value) {
    if (value === null || value === undefined) return Uint8Array.of(0xf6);
    if (typeof value === 'boolean') return Uint8Array.of(value ? 0xf5 : 0xf4);
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) throw new Error('non-integer numbers not supported');
      if (value >= 0) return encodeHead(0, value);
      return encodeHead(1, -1 - value);
    }
    if (typeof value === 'bigint') {
      if (value >= 0n) return encodeHead(0, Number(value));
      return encodeHead(1, Number(-1n - value));
    }
    if (typeof value === 'string') {
      const b = ns.util.utf8(value);
      return ns.util.concat(encodeHead(3, b.length), b);
    }
    if (value instanceof Uint8Array) {
      return ns.util.concat(encodeHead(2, value.length), value);
    }
    if (Array.isArray(value)) {
      const parts = [encodeHead(4, value.length)];
      for (const v of value) parts.push(encode(v));
      return ns.util.concat(...parts);
    }
    if (value instanceof Map) {
      const parts = [encodeHead(5, value.size)];
      for (const [k, v] of value) {
        parts.push(encode(k));
        parts.push(encode(v));
      }
      return ns.util.concat(...parts);
    }
    throw new Error('unsupported CBOR value type: ' + typeof value);
  }

  function readHead(bytes, pos) {
    const ib = bytes[pos];
    const major = ib >> 5;
    const ai = ib & 31;
    if (ai < 24) return { major, value: ai, pos: pos + 1 };
    if (ai === 24) return { major, value: bytes[pos + 1], pos: pos + 2 };
    if (ai === 25) return { major, value: (bytes[pos + 1] << 8) | bytes[pos + 2], pos: pos + 3 };
    if (ai === 26) {
      const v = ((bytes[pos + 1] << 24) | (bytes[pos + 2] << 16) | (bytes[pos + 3] << 8) | bytes[pos + 4]) >>> 0;
      return { major, value: v, pos: pos + 5 };
    }
    if (ai === 27) {
      let v = 0;
      for (let i = 1; i <= 8; i++) v = v * 256 + bytes[pos + i];
      return { major, value: v, pos: pos + 9 };
    }
    throw new Error('indefinite-length items not supported (ai=' + ai + ')');
  }

  function decodeItem(bytes, pos) {
    const { major, value, pos: p } = readHead(bytes, pos);
    switch (major) {
      case 0:
        return { value, pos: p };
      case 1:
        return { value: -1 - value, pos: p };
      case 2: {
        const out = bytes.slice(p, p + value);
        if (out.length !== value) throw new Error('truncated bytestring');
        return { value: out, pos: p + value };
      }
      case 3: {
        const raw = bytes.slice(p, p + value);
        if (raw.length !== value) throw new Error('truncated textstring');
        return { value: ns.util.dec.decode(raw), pos: p + value };
      }
      case 4: {
        const arr = [];
        let q = p;
        for (let i = 0; i < value; i++) {
          const r = decodeItem(bytes, q);
          arr.push(r.value);
          q = r.pos;
        }
        return { value: arr, pos: q };
      }
      case 5: {
        const map = new Map();
        let q = p;
        for (let i = 0; i < value; i++) {
          const k = decodeItem(bytes, q);
          const v = decodeItem(bytes, k.pos);
          map.set(k.value, v.value);
          q = v.pos;
        }
        return { value: map, pos: q };
      }
      case 7:
        if (value === 20) return { value: false, pos: p };
        if (value === 21) return { value: true, pos: p };
        if (value === 22) return { value: null, pos: p };
        throw new Error('unsupported simple value ' + value);
      default:
        throw new Error('unsupported major type ' + major);
    }
  }

  function decode(bytes) {
    if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes);
    const r = decodeItem(bytes, 0);
    return { value: r.value, rest: bytes.slice(r.pos) };
  }

  ns.cbor = { encode, decode };
})(globalThis.APB);
