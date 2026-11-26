function i18n() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = browser.i18n.getMessage(el.getAttribute('data-i18n')) || el.getAttribute('data-i18n');
  });
}

function renderStatus(obj) {
  const tbody = document.querySelector('#status tbody');
  tbody.textContent = '';
  for (const [k, v] of Object.entries(obj)) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = k;
    const td2 = document.createElement('td');
    td2.textContent = typeof v === 'object' ? JSON.stringify(v) : String(v);
    tr.append(td1, td2);
    tbody.append(tr);
  }
}

async function runDiagnostics() {
  const bg = await browser.runtime.sendMessage({ type: 'apb-diagnostics' });
  renderStatus(bg);
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  if (tabs.length) {
    try {
      const page = await browser.tabs.sendMessage(tabs[0].id, { type: 'apb-run-probe' });
      if (page && page.diagnostics) {
        const h = document.createElement('h2');
        h.textContent = browser.i18n.getMessage('envPage');
        document.querySelector('#status').before(h);
        renderStatus(page.diagnostics);
      }
    } catch (e) {
      renderStatus({ pageProbe: 'unavailable: ' + e.message });
    }
  }
  const hybrid = await browser.runtime.sendMessage({ type: 'apb-hybrid-status' });
  renderStatus({ hybridTransport: hybrid.hybridTransport, bleAvailable: String(hybrid.bleAvailable) });
}

async function generateQr() {
  const qr = await browser.runtime.sendMessage({ type: 'apb-generate-qr', requestType: 'ga' });
  const out = document.getElementById('qr-out');
  out.textContent = '';
  const qrObj = new QRCode(out, { text: qr.url, width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M });
  document.getElementById('qr-text').textContent =
    qr.url.slice(0, 96) + '…\ntunnel-id: ' + qr.tunnelIdHex + '\nconnect-url (routing 000000): ' + qr.connectUrlPreview;
}

document.getElementById('btn-diagnose').addEventListener('click', runDiagnostics);
document.getElementById('btn-qr').addEventListener('click', generateQr);
i18n();
runDiagnostics();
