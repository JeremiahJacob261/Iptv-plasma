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
  if (!document.querySelector('.plasma-aads')) {
    const ad = document.createElement('aside');
    ad.className = 'plasma-page-ad';
    ad.setAttribute('aria-label', 'Advertisement');
    const label = document.createElement('span');
    label.textContent = 'Advertisement';
    const frame = document.createElement('iframe');
    frame.title = 'Advertisement';
    frame.loading = 'eager';
    const mobile = matchMedia('(max-width: 700px)');
    const loadUnit = () => {
      const id = mobile.matches ? '2463138' : '2463134';
      if (frame.getAttribute('data-aa') === id) return;
      frame.setAttribute('data-aa', id);
      frame.src = 'https://acceptable.a-ads.com/' + id + '/?size=Adaptive';
    };
    loadUnit();
    if (mobile.addEventListener) mobile.addEventListener('change', loadUnit);
    else if (mobile.addListener) mobile.addListener(loadUnit);
    ad.append(label, frame);
    const footer = document.querySelector('#section-12-15, footer');
    if (footer) footer.before(ad);
    else document.body.append(ad);
  }
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
