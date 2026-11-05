'use strict';
(function(){const frame=document.getElementById('plasma-twitch-player');if(!frame)return;function load(){const url=new URL('https://player.twitch.tv/');url.searchParams.set('channel','plasma1337x');url.searchParams.set('parent',location.hostname);url.searchParams.set('autoplay','false');frame.src=url.href;}load();})();
