'use strict';
(function () {
  function send(event, channel) {
    const body = JSON.stringify({ event, channel });
    if (navigator.sendBeacon?.('/api/iptv-event', new Blob([body], { type: 'application/json' }))) return;
    fetch('/api/iptv-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }

  try {
    if (!sessionStorage.getItem('plasmax-iptv-visit')) {
      sessionStorage.setItem('plasmax-iptv-visit', '1');
      send('visit');
    }
  } catch {
    send('visit');
  }
  document.addEventListener('plasmax:iptv-start', event => send('play', event.detail));
})();
