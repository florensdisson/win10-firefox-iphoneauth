window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const d = event.data;
  if (!d || d.type !== 'apb-shim-request') return;
  browser.runtime
    .sendMessage({ type: 'apb-shim-decision', id: d.id, method: d.method })
    .then((resp) => {
      window.postMessage(
        { type: 'apb-shim-response', id: d.id, handled: !!(resp && resp.handled), credential: resp && resp.credential, reason: resp && resp.reason },
        '*'
      );
    })
    .catch(() => {
      window.postMessage({ type: 'apb-shim-response', id: d.id, handled: false, reason: 'no background' }, '*');
    });
});
