globalThis.APB = globalThis.APB || {};

(function (ns) {
  async function safe(fn) {
    try {
      return await fn();
    } catch (e) {
      return 'error: ' + (e && e.message ? e.message : String(e));
    }
  }

  async function collect(envLabel) {
    const d = { env: envLabel, timestamp: new Date().toISOString() };
    d.userAgent = navigator.userAgent;
    d.publicKeyCredential = typeof PublicKeyCredential !== 'undefined' ? 'yes' : 'no';
    d.credentialsContainer = typeof navigator.credentials !== 'undefined' ? 'yes' : 'no';
    d.clientCapabilities = await safe(async () => {
      if (typeof PublicKeyCredential === 'undefined' || !PublicKeyCredential.getClientCapabilities) return 'missing';
      const caps = await PublicKeyCredential.getClientCapabilities();
      return caps;
    });
    d.isUserVerifyingPlatformAuthenticator = await safe(async () => {
      if (!navigator.credentials || !navigator.credentials.isUserVerifyingPlatformAuthenticator) return 'missing';
      return await navigator.credentials.isUserVerifyingPlatformAuthenticator();
    });
    d.webBluetooth = typeof navigator.bluetooth !== 'undefined' ? 'yes' : 'no (not implemented in this Firefox)';
    d.webSocket = typeof WebSocket !== 'undefined' ? 'yes' : 'no';
    d.webCryptoSubtle = !!(crypto && crypto.subtle) ? 'yes' : 'no';
    d.webCryptoEcdhP256 = await safe(async () => {
      const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
      return kp ? 'yes' : 'no';
    });
    d.webCryptoHkdf = await safe(async () => {
      const k = await crypto.subtle.importKey('raw', new Uint8Array(32), { name: 'HKDF' }, false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(1), info: new Uint8Array(1) }, k, 256);
      return bits.byteLength === 32 ? 'yes' : 'no';
    });
    d.webCryptoAesGcm = await safe(async () => {
      const k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
      return k ? 'yes' : 'no';
    });
    d.credentialsGetType = typeof navigator.credentials !== 'undefined' ? typeof navigator.credentials.get : 'missing';
    d.conditionalMediationSupported = await safe(async () => {
      if (typeof PublicKeyCredential === 'undefined' || !PublicKeyCredential.isConditionalMediationAvailable) return 'missing';
      return await PublicKeyCredential.isConditionalMediationAvailable();
    });
    if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getBrowserInfo) {
      d.browserInfo = await safe(() => browser.runtime.getBrowserInfo());
    }
    return d;
  }

  ns.diagnostics = { collect };
})(globalThis.APB);
