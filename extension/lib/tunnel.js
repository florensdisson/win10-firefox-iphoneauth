globalThis.APB = globalThis.APB || {};

(function (ns) {
  const ASSIGNED_DOMAINS = { 0: 'cable.ua5v.com', 1: 'cable.auth.com' };

  function decodeDomain(domainId) {
    if (Object.prototype.hasOwnProperty.call(ASSIGNED_DOMAINS, domainId)) {
      return ASSIGNED_DOMAINS[domainId];
    }
    throw new Error('unknown assigned tunnel domain id ' + domainId);
  }

  function newTunnelUrl(domainId, tunnelId) {
    return 'wss://' + decodeDomain(domainId) + '/cable/new/' + ns.util.hex(tunnelId);
  }

  function connectUrl(domainId, routingId, tunnelId) {
    if (routingId.length !== 3) throw new Error('routing id must be 3 bytes');
    if (tunnelId.length !== 16) throw new Error('tunnel id must be 16 bytes');
    return 'wss://' + decodeDomain(domainId) + '/cable/connect/' + ns.util.hex(routingId) + '/' + ns.util.hex(tunnelId);
  }

  function contactUrl(domainId, contactId) {
    return 'wss://' + decodeDomain(domainId) + '/cable/contact/' + ns.util.b64urlEncode(contactId);
  }

  class TunnelClient {
    constructor(url, handlers) {
      this.url = url;
      this.handlers = handlers || {};
      this.ws = null;
    }

    connect() {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';
      this.ws.onopen = () => this.handlers.onStatus && this.handlers.onStatus('open');
      this.ws.onmessage = (ev) => this.handlers.onMessage && this.handlers.onMessage(new Uint8Array(ev.data));
      this.ws.onerror = () => this.handlers.onStatus && this.handlers.onStatus('error');
      this.ws.onclose = (ev) => this.handlers.onStatus && this.handlers.onStatus('close', ev.code, ev.reason);
    }

    send(bytes) {
      if (!this.ws || this.ws.readyState !== 1) throw new Error('tunnel not open');
      this.ws.send(bytes);
    }

    close() {
      if (this.ws) this.ws.close();
    }
  }

  ns.tunnel = { ASSIGNED_DOMAINS, decodeDomain, newTunnelUrl, connectUrl, contactUrl, TunnelClient };
})(globalThis.APB);
