const APB = globalThis.APB;

let lastQr = null;

async function handleMessage(msg, sender) {
  if (!msg || typeof msg.type !== 'string') return undefined;
  switch (msg.type) {
    case 'apb-diagnostics': {
      return APB.diagnostics.collect('background');
    }
    case 'apb-probe-result': {
      return { stored: true };
    }
    case 'apb-generate-qr': {
      const requestType = msg.requestType === 'mc' ? 'mc' : 'ga';
      const qrKey = APB.cableQr.generateQrKey();
      const url = await APB.cableQr.buildQrUrl(qrKey, requestType, {});
      const tunnelId = await APB.cableQr.tunnelIdFromSecret(qrKey.secret);
      lastQr = {
        url,
        requestType,
        tunnelIdHex: APB.util.hex(tunnelId),
        connectUrlPreview: APB.tunnel.connectUrl(0, new Uint8Array([0, 0, 0]), tunnelId),
        createdAt: new Date().toISOString(),
      };
      return lastQr;
    }
    case 'apb-last-qr': {
      return lastQr;
    }
    case 'apb-shim-decision': {
      return {
        handled: false,
        reason: 'hybrid transport blocked in pure WebExtension (no BLE); request passed through to native navigator.credentials',
      };
    }
    case 'apb-hybrid-status': {
      return {
        hybridTransport: 'technisch blockiert',
        bleAvailable: typeof navigator.bluetooth !== 'undefined',
        reason:
          'Firefox implementiert Web Bluetooth nicht (Bug 674737). Das caBLE-v2-BLE-Advert des Telefons kann von keiner Erweiterung empfangen werden; Routing-ID und Näheprüfung fehlen damit.',
      };
    }
    default:
      return undefined;
  }
}

browser.runtime.onMessage.addListener((msg, sender) => {
  return Promise.resolve(handleMessage(msg, sender));
});
