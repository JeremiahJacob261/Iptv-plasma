(() => {
  const escapeText = value => String(value ?? '');
  const postHref = slug => `/precious-metals/blog/${encodeURIComponent(slug)}`;
  const dateText = value => {
    if (!value) return 'PlasmaX';
    const date = new Date(value);
    return Number.isFinite(date.valueOf()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date) : 'PlasmaX';
  };
  const excerpt = text => {
    const plain = escapeText(text).replace(/\s+/g, ' ').trim();
    return plain.length > 180 ? `${plain.slice(0, 177)}…` : plain;
  };
  function card(post) {
    const link = document.createElement('a');
    link.className = 'pm-post-card';
    link.href = postHref(post.slug);
    if (post.featuredImage && /^https:\/\//i.test(post.featuredImage)) {
      const image = document.createElement('img'); image.className = 'pm-post-image'; image.src = post.featuredImage; image.alt = ''; image.loading = 'lazy'; link.append(image);
    }
    const body = document.createElement('div'); body.className = 'pm-post-content';
    const date = document.createElement('span'); date.className = 'pm-post-date'; date.textContent = dateText(post.publishedAt);
    const title = document.createElement('h3'); title.textContent = escapeText(post.title);
    const summary = document.createElement('p'); summary.textContent = excerpt(post.content);
    body.append(date, title, summary); link.append(body); return link;
  }
  async function loadList() {
    const container = document.querySelector('#pm-post-list');
    if (!container) return;
    try {
      const response = await fetch('/api/precious-blog', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Articles could not be loaded.');
      container.replaceChildren();
      if (!data.posts?.length) { const empty = document.createElement('p'); empty.className = 'pm-post-empty'; empty.textContent = 'New metals articles will appear here.'; container.append(empty); return; }
      (container.classList.contains('pm-post-grid-wide') ? data.posts : data.posts.slice(0, 3)).forEach(post => container.append(card(post)));
    } catch {
      container.replaceChildren(); const error = document.createElement('p'); error.className = 'pm-post-empty'; error.textContent = 'Articles are temporarily unavailable. Please check back soon.'; container.append(error);
    }
  }
  async function loadArticle() {
    const container = document.querySelector('#pm-article');
    if (!container) return;
    const slug = location.pathname.split('/').filter(Boolean).at(-1);
    try {
      const response = await fetch(`/api/precious-blog?slug=${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || !data.post) throw new Error(data.error || 'Article not found.');
      const post = data.post; container.replaceChildren();
      const date = document.createElement('p'); date.className = 'pm-article-meta'; date.textContent = `PlasmaX · ${dateText(post.publishedAt)}`;
      const title = document.createElement('h1'); title.textContent = post.title;
      container.append(date, title);
      if (post.featuredImage && /^https:\/\//i.test(post.featuredImage)) { const image = document.createElement('img'); image.className = 'pm-article-image'; image.src = post.featuredImage; image.alt = ''; image.loading = 'eager'; container.append(image); }
      const content = document.createElement('div'); content.className = 'pm-article-content';
      String(post.content || '').split(/\n\s*\n/).filter(Boolean).forEach(chunk => { const paragraph = document.createElement('p'); paragraph.textContent = chunk; content.append(paragraph); });
      container.append(content);
      document.title = `${post.title} | PlasmaX`;
    } catch (error) { container.innerHTML = ''; const notice = document.createElement('p'); notice.className = 'pm-article-error'; notice.textContent = error.message || 'This article could not be found.'; container.append(notice); }
  }
  if (document.querySelector('#pm-article')) void loadArticle(); else void loadList();
})();
