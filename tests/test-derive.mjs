import { loadLibs, assert, assertEqual } from './helpers.mjs';

export async function run() {
  console.log('test-derive (RFC 5869 test case 1, SHA-256)');
  const APB = await loadLibs();
  const ikm = new Uint8Array(22).fill(0x0b);
  const salt = APB.util.fromHex('000102030405060708090a0b0c');
  const info = APB.util.fromHex('f0f1f2f3f4f5f6f7f8f9');
  const okm = await APB.derive.hkdfSha256(ikm, salt, info, 42);
  assertEqual(
    APB.util.hex(okm),
    '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865',
    'RFC 5869 OKM matches'
  );
  const t = await APB.derive.deriveValue(new Uint8Array(16).fill(7), new Uint8Array(0), APB.derive.DERIVED_TYPES.TUNNEL_ID, 16);
  assert(t.length === 16, 'deriveValue returns requested length');
}
