'use strict';
(()=>{
 const feed=document.getElementById('plasma-x-feed');if(!feed)return;
 const status=document.getElementById('x-feed-status'),retry=document.getElementById('x-feed-retry'),posts=document.getElementById('x-feed-posts');let busy=false;
 function el(tag,text){const node=document.createElement(tag);if(text)node.textContent=text;return node;}
 function image(url,alt){try{const u=new URL(url);if(u.protocol!=='https:'||u.hostname!=='pbs.twimg.com')return null;const img=el('img');img.src=u.href;img.alt=alt;img.loading='lazy';img.decoding='async';return img;}catch{return null;}}
 async function load(){if(busy)return;busy=true;retry.hidden=true;status.textContent='Loading posts from X…';try{
  const r=await fetch('/api/x-feed',{signal:AbortSignal.timeout(16000)});if(!r.ok)throw Error();const data=await r.json();if(!data.posts?.length)throw Error();const fragment=document.createDocumentFragment();
  for(const post of data.posts){const card=el('article');card.className='x-post';const header=el('div');header.className='x-post-header';const avatar=image(post.avatar,'');if(avatar)header.append(avatar);const author=el('div');author.append(el('strong',post.name),el('span','@'+post.username));header.append(author);card.append(header,el('p',post.text));for(const url of post.photos){const photo=image(url,'Photo from @'+post.username);if(photo){photo.className='x-post-photo';card.append(photo);}}
  const link=el('a',post.hasVideo?'Watch video on X':'View post on X');link.href='https://x.com/plasma1337x/status/'+encodeURIComponent(post.id);link.target='_blank';link.rel='noopener noreferrer';const date=new Date(post.date);if(!Number.isNaN(date.valueOf()))card.append(el('time',date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})));card.append(link);fragment.append(card);}
  posts.replaceChildren(fragment);status.textContent=data.stale?'Saved posts · X is temporarily unavailable':'Posts from @plasma1337x · X may show a limited selection';
 }catch{status.textContent='X is not sharing this timeline right now. Please try again shortly.';retry.hidden=false;}finally{busy=false;}}
 retry.addEventListener('click',load);
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load();}},{rootMargin:'200px'});observer.observe(feed);}else load();
})();
