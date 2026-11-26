const APB = globalThis.APB;

APB.probeState = { last: null };

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'apb-run-probe') {
    APB.diagnostics
      .collect('page')
      .then((d) => {
        APB.probeState.last = d;
        browser.runtime.sendMessage({ type: 'apb-probe-result', data: d }).catch(() => {});
        sendResponse({ diagnostics: d });
      })
      .catch((e) => sendResponse({ error: String(e) }));
    return true;
  }
  return false;
});
