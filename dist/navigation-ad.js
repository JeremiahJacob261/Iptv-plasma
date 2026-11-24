'use strict';
(function () {
  if (location.pathname.startsWith('/admin')) return;
  if (document.documentElement.dataset.plasmaAdsMounted === 'true') return;
  document.documentElement.dataset.plasmaAdsMounted = 'true';

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = '/navigation-ad.css';
  document.head.append(style);

  const adCount = document.querySelectorAll('.plasma-aads, .plasma-page-ad').length;
  const adsNeeded = Math.max(0, 2 - adCount);
  if (!adsNeeded) return;

  const mobile = matchMedia('(max-width: 700px)');
  function createAd(index) {
    const ad = document.createElement('aside');
    ad.className = 'plasma-page-ad' + (index === 2 ? ' plasma-page-ad--secondary' : '');
    ad.setAttribute('aria-label', 'Advertisement');
    const label = document.createElement('span');
    label.textContent = 'Advertisement';
    const frame = document.createElement('iframe');
    frame.title = 'Advertisement';
    frame.loading = 'eager';
    frame.style.border = '0';
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
    return ad;
  }

  function insertAfter(anchor, element) {
    if (anchor?.parentNode) anchor.after(element);
    else document.body.append(element);
  }

  function getAnchors(content, article) {
    const longParagraphs = [...(article || content).querySelectorAll('p')]
      .filter(p => p.textContent.trim().length > 100);

    if (longParagraphs.length >= 8) return [longParagraphs[3], longParagraphs[7]];
    if (longParagraphs.length >= 4) return [longParagraphs[3], article || content];
    if (longParagraphs.length >= 2) return [longParagraphs[0], longParagraphs[Math.floor(longParagraphs.length / 2)]];

    const sections = [...(content || document).querySelectorAll('section')]
      .filter(section => !section.closest('footer') && !section.classList.contains('plasma-page-ad'));
    if (sections.length >= 3) return [sections[Math.floor((sections.length - 1) / 3)], sections[Math.floor((sections.length - 1) * 2 / 3)]];
    if (sections.length === 2) return sections;

    const blocks = [...(content || document.body).children]
      .filter(node => !['SCRIPT', 'STYLE'].includes(node.tagName) && !node.classList.contains('plasma-page-ad'));
    if (blocks.length >= 2) return [blocks[0], blocks[Math.floor((blocks.length - 1) / 2)]];
    if (blocks.length === 1) return [blocks[0], content || blocks[0]];
    return [article || content || document.body, content || article || document.body];
  }

  function placeOnDocument(ads) {
    const existingPlayerAd = document.querySelector('.plasma-aads');
    const player = document.querySelector('#watch-player');
    const sources = document.querySelector('.playlist-setup');
    if (player) {
      if (existingPlayerAd) {
        insertAfter(sources || player, ads[0]);
      } else {
        insertAfter(player, ads[0]);
        if (ads[1]) insertAfter(sources || document.querySelector('#plasmax-exchange-sections') || player, ads[1]);
      }
      return;
    }

    const article = document.querySelector('article');
    const content = document.querySelector('main, [role="main"], .ct-inner-content');
    const footer = document.querySelector('#section-12-15, footer');
    const anchors = getAnchors(content || article, article);
    insertAfter(anchors[0], ads[0]);
    if (ads[1]) {
      if (anchors[1] && anchors[1] !== anchors[0]) insertAfter(anchors[1], ads[1]);
      else if (footer) footer.before(ads[1]);
      else insertAfter(content || article || document.body, ads[1]);
    }
  }

  function placeInShadowRoot(host, ads) {
    const root = host.shadowRoot;
    if (!root) return false;
    if (root.querySelector('.plasma-page-ad')) return true;
    const main = root.querySelector('main') || root.querySelector('[role="main"]');
    if (!main || !main.children.length) return false;

    const shadowStyle = document.createElement('style');
    shadowStyle.textContent = '.plasma-page-ad{box-sizing:border-box;width:100%;max-width:1200px;margin:24px auto;padding:14px 16px 20px;background:#15111b;color:#d0c4d8;text-align:center;font:12px/1.4 Arial,sans-serif}.plasma-page-ad span{display:block;margin-bottom:8px}.plasma-page-ad iframe{display:block;width:100%;height:250px;border:0;margin:auto}@media(max-width:700px){.plasma-page-ad{padding:12px 12px 18px}.plasma-page-ad iframe{height:150px}}';
    root.append(shadowStyle);

    const article = main.querySelector('article');
    const anchors = getAnchors(main, article);
    const first = anchors[0];
    insertAfter(first, ads[0]);
    if (anchors[1] && anchors[1] !== first) insertAfter(anchors[1], ads[1]);
    else {
      const pageFooter = root.querySelector('footer');
      if (pageFooter) pageFooter.before(ads[1]);
      else main.append(ads[1]);
    }
    return true;
  }

  const customHost = document.querySelector('#plasmax-exchange-page, #plasmax-exchange-status, #plasmax-exchange-legal');
  if (customHost) {
    const ads = Array.from({ length: adsNeeded }, (_, index) => createAd(index + 1));
    let attempts = 0;
    const mount = () => {
      if (placeInShadowRoot(customHost, ads)) return;
      if (++attempts < 60) setTimeout(mount, 100);
      else placeOnDocument(ads);
    };
    mount();
  } else {
    placeOnDocument(Array.from({ length: adsNeeded }, (_, index) => createAd(index + 1)));
  }
})();
