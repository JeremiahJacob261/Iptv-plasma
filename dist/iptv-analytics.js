'use strict';
(function () {
  let viewer;
  try { viewer = sessionStorage.getItem('plasmax-viewer'); if (!viewer) { viewer = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''); sessionStorage.setItem('plasmax-viewer', viewer); } } catch {}
  function send(event, channel) {
    const body = JSON.stringify({ event, channel, viewer });
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
  let channel = null, elapsed = 0;
  document.addEventListener('plasmax:iptv-start', event => { channel = event.detail; elapsed = 0; send('play', channel); });
  setInterval(() => {
    const video = document.querySelector('#iptv-video');
    if (!channel || !video || video.paused || video.ended || video.readyState < 3) return;
    elapsed += 5;
    if (elapsed >= 30) { elapsed = 0; send('watch', channel); }
  }, 5000);
  document.querySelector('#iptv-video')?.addEventListener('emptied', () => { channel = null; elapsed = 0; });
})();
