import { loadLibs, assert, assertEqual } from './helpers.mjs';

export async function run() {
  console.log('test-tunnel (URL builders)');
  const APB = await loadLibs();
  const routing = new Uint8Array([0xab, 0xcd, 0xef]);
  const tunnelId = new Uint8Array(16).fill(0x11);
  assertEqual(
    APB.tunnel.connectUrl(0, routing, tunnelId),
    'wss://cable.ua5v.com/cable/connect/abcdef/' + '11'.repeat(16),
    'connect url (Google tunnel domain id 0)'
  );
  assertEqual(
    APB.tunnel.connectUrl(1, routing, tunnelId),
    'wss://cable.auth.com/cable/connect/abcdef/' + '11'.repeat(16),
    'connect url (Apple tunnel domain id 1)'
  );
  assertEqual(APB.tunnel.newTunnelUrl(0, tunnelId), 'wss://cable.ua5v.com/cable/new/' + '11'.repeat(16), 'new tunnel url');
  assert(APB.tunnel.contactUrl(0, APB.util.utf8('contact')).startsWith('wss://cable.ua5v.com/cable/contact/'), 'contact url prefix');
  let threw = false;
  try {
    APB.tunnel.connectUrl(0, new Uint8Array(2), tunnelId);
  } catch (e) {
    threw = true;
  }
  assert(threw, 'reject wrong routing id length');
}
