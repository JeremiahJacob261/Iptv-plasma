'use strict';
(function () {
  if (location.pathname.startsWith('/admin')) return;

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/navigation-ad.css';
  document.head.append(style);

  // The player page owns its responsive banner and places it immediately below
  // the video. Never add a second unit there.
  if (document.querySelector('.plasma-aads')) return;

  const ad = document.createElement('aside');
  ad.className = 'plasma-page-ad';
  ad.setAttribute('aria-label', 'Advertisement');
  const label = document.createElement('span');
  label.textContent = 'Advertisement';
  const frame = document.createElement('iframe');
  frame.title = 'Advertisement';
  frame.loading = 'eager';
  frame.style.border = '0';

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

  const player = document.querySelector('#watch-player');
  const article = document.querySelector('article');
  const content = document.querySelector('#plasmax-exchange-page, #plasmax-exchange-status, main, [role="main"], .ct-inner-content');
  const footer = document.querySelector('#section-12-15, footer');

  if (player) player.after(ad);
  else if (article) {
    const paragraphs = [...article.querySelectorAll('p')].filter(p => p.textContent.trim().length > 100);
    if (paragraphs.length >= 4) paragraphs[3].after(ad);
    else article.after(ad);
  } else if (content) content.after(ad);
  else if (footer) footer.before(ad);
  else document.body.append(ad);
})();
