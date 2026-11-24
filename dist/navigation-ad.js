'use strict';
(function () {
  if (window.plasmaNavigate || location.pathname.startsWith('/admin')) return;
  let dialog;
  let destination;

  function navigate() {
    const url = destination;
    destination = null;
    if (url) location.assign(url);
  }

  function openAd(url) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'plasma-navigation-ad';
      dialog.setAttribute('aria-label', 'Advertisement');
      dialog.innerHTML = '<div class="plasma-navigation-ad-inner"><div class="plasma-navigation-ad-header"><span>Advertisement</span><button type="button">Close and continue</button></div><iframe title="Advertisement" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
      const button = dialog.querySelector('button');
      const frame = dialog.querySelector('iframe');
      frame.src = 'https://acceptable.a-ads.com/' + (matchMedia('(max-width: 700px)').matches ? '2463138' : '2463134') + '/?size=Adaptive';
      button.addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', navigate);
      document.body.append(dialog);
    }
    destination = url;
    if (!dialog.open) {
      dialog.showModal();
      dialog.querySelector('button').focus();
    }
  }

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/navigation-ad.css';
  document.head.append(style);
  window.plasmaNavigate = openAd;
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.composedPath().find(node => node instanceof HTMLAnchorElement);
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    let target;
    try { target = new URL(link.href, location.href); } catch { return; }
    if (target.origin !== location.origin || !/^https?:$/.test(target.protocol)) return;
    if (target.pathname.startsWith('/admin') || target.pathname.startsWith('/api/')) return;
    if (target.pathname.replace(/\/+$/, '') === location.pathname.replace(/\/+$/, '') && target.search === location.search) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openAd(target.href);
  }, true);
})();
