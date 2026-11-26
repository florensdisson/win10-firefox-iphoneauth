import { loadLibs, assert, assertEqual } from './helpers.mjs';

export async function run() {
  console.log('test-cable-qr');
  const APB = await loadLibs();

  for (let len of [1, 7, 8, 13, 100, 255]) {
    const bytes = APB.util.randomBytes(len);
    const digits = APB.cableQr.bytesToDigits(bytes);
    const back = APB.cableQr.digitsToBytes(digits);
    assert(back && APB.util.equalBytes(back, bytes), 'digits roundtrip len=' + len);
  }
  assertEqual(APB.cableQr.digitsToBytes('0000000000000000000000000000001'), null, 'reject overflowing chunk');
  assertEqual(APB.cableQr.digitsToBytes('12'), null, 'reject bad trailing width');

  const seed = APB.util.randomBytes(32);
  const secret = APB.util.randomBytes(16);
  const qrKey = { seed, secret };
  const url = await APB.cableQr.buildQrUrl(qrKey, 'ga', { numKnownDomains: 2, timestamp: 1760000000, linking: false });
  assert(url.startsWith('FIDO:/'), 'QR url prefix FIDO:/');
  assert(/^FIDO:\/\d+$/.test(url), 'QR url is prefix + decimal digits only');

  const parsed = APB.cableQr.parseQrUrl(url);
  assert(parsed !== null, 'parse own QR url');
  assertEqual(parsed.requestType, 'ga', 'request type roundtrip');
  assertEqual(parsed.numKnownDomains, 2, 'num known domains roundtrip');
  assertEqual(parsed.timestamp, 1760000000, 'timestamp roundtrip');
  assertEqual(parsed.linking, false, 'linking roundtrip');
  assert(APB.util.equalBytes(parsed.secret, secret), 'secret roundtrip');

  const d = APB.p256.privateFromSeed(seed);
  const expectedCompressed = APB.p256.compress(APB.p256.publicFromPrivate(d));
  assert(APB.util.equalBytes(parsed.compressedPublicKey, expectedCompressed), 'compressed key matches seed-derived P-256 key');
  const peerPoint = APB.p256.fromUncompressed(parsed.peerIdentity);
  assert(APB.util.equalBytes(APB.p256.toUncompressed(peerPoint), parsed.peerIdentity), 'peer identity decompress/recompress stable');

  assertEqual(APB.cableQr.parseQrUrl('https://example.com'), null, 'reject non-FIDO url');
  assertEqual(APB.cableQr.parseQrUrl('FIDO:/xyz'), null, 'reject non-digit payload');

  const tunnelId = await APB.cableQr.tunnelIdFromSecret(secret);
  assert(tunnelId.length === 16, 'tunnel id 16 bytes');
  const psk = await APB.cableQr.pskFromSecret(secret);
  assert(psk.length === 32, 'psk 32 bytes');
  const eidKey = await APB.cableQr.eidKeyFromQrKey(qrKey);
  assert(eidKey.length === 64, 'eid key 64 bytes');
}
