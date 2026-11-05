'use strict';
(function(){
 const player=document.getElementById('plasma-twitch-player'),chat=document.getElementById('plasma-twitch-chat');
 const frames=[player,chat].filter(Boolean);if(!frames.length)return;
 function load(frame){if(frame.dataset.loaded)return;frame.dataset.loaded='true';const isChat=frame===chat;const url=new URL(isChat?'https://www.twitch.tv/embed/plasma1337x/chat':'https://player.twitch.tv/');url.searchParams.set('parent',location.hostname);if(isChat)url.searchParams.set('darkpopout','');else{url.searchParams.set('channel','plasma1337x');url.searchParams.set('autoplay','false');}frame.src=url.href;}
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){observer.unobserve(entry.target);load(entry.target);}}},{rootMargin:'200px'});frames.forEach(frame=>observer.observe(frame));}else frames.forEach(load);
})();
