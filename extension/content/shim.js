(function () {
  if (!navigator.credentials) return;
  const originalGet = navigator.credentials.get.bind(navigator.credentials);
  const originalCreate = navigator.credentials.create.bind(navigator.credentials);
  let counter = 0;

  function serializeOptions(options) {
    return JSON.parse(
      JSON.stringify(options, (key, value) => {
        if (value instanceof ArrayBuffer) return { __b64: b64url(new Uint8Array(value)) };
        if (ArrayBuffer.isView(value)) {
          return { __b64: b64url(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) };
        }
        return value;
      })
    );
  }

  function b64url(bytes) {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function wrap(method, original) {
    return function (options) {
      if (!options || !options.publicKey) return original(options);
      const id = ++counter;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          cleanup();
          original(options).then(resolve, reject);
        }, 3000);
        function onMessage(event) {
          if (event.source !== window) return;
          const d = event.data;
          if (!d || d.type !== 'apb-shim-response' || d.id !== id) return;
          cleanup();
          if (d.handled) resolve(d.credential);
          else original(options).then(resolve, reject);
        }
        function cleanup() {
          clearTimeout(timer);
          window.removeEventListener('message', onMessage);
        }
        window.addEventListener('message', onMessage);
        window.postMessage({ type: 'apb-shim-request', id, method, options: serializeOptions(options) }, '*');
      });
    };
  }

  try {
    Object.defineProperty(navigator.credentials, 'get', { value: wrap('get', originalGet), configurable: true });
    Object.defineProperty(navigator.credentials, 'create', { value: wrap('create', originalCreate), configurable: true });
  } catch (e) {
    console.warn('[apb] shim installation failed', e);
  }
})();
