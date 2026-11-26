import { loadLibs, assert, assertEqual } from './helpers.mjs';

export async function run() {
  console.log('test-noise (Noise_NKpsk0_P256_AESGCM_SHA256, both roles)');
  const APB = await loadLibs();

  const seed = APB.util.randomBytes(32);
  const d = APB.p256.privateFromSeed(seed);
  const pub = APB.p256.publicFromPrivate(d);
  const desktopUncompressed = APB.p256.toUncompressed(pub);
  const desktopJwk = APB.p256.toJwkPrivate(d, pub);
  const psk = APB.util.randomBytes(32);
  const payload = APB.util.utf8('CTAP2 getAssertion placeholder');

  const initiator = await APB.noise.initiatorNkPsk0({ psk, peerStaticUncompressed: desktopUncompressed });
  const msg1 = await APB.noise.buildFirstMessage(initiator, payload);
  assert(msg1.length > 65, 'first message carries ephemeral key + ciphertext');

  const responder = await APB.noise.responderNkPsk0({ psk, ownStaticPrivateJwk: desktopJwk, ownStaticUncompressed: desktopUncompressed });
  const decrypted = await APB.noise.processFirstMessage(responder, msg1);
  assert(APB.util.equalBytes(decrypted, payload), 'responder decrypts initiator payload');

  const [k1i, k2i] = await initiator.noise.trafficKeys();
  const [k1r, k2r] = await responder.noise.trafficKeys();
  assert(APB.util.equalBytes(k1i, k1r) && APB.util.equalBytes(k2i, k2r), 'both roles derive identical traffic keys');

  const wrongPsk = APB.util.randomBytes(32);
  const badResponder = await APB.noise.responderNkPsk0({ psk: wrongPsk, ownStaticPrivateJwk: desktopJwk, ownStaticUncompressed: desktopUncompressed });
  let rejected = false;
  try {
    await APB.noise.processFirstMessage(badResponder, msg1);
  } catch (e) {
    rejected = true;
  }
  assert(rejected, 'wrong PSK fails AEAD decryption');

  const ct = await initiator.noise.encryptAndHash(APB.util.utf8('post-handshake message'));
  const pt = await responder.noise.decryptAndHash(ct);
  assertEqual(APB.util.dec.decode(pt), 'post-handshake message', 'post-handshake AEAD roundtrip');
}
