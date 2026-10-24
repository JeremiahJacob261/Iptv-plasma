# PlasmaX setup

Current public origin: https://free-iptv-player-sigma.vercel.app
Planned domain: plasmax.io. The domain is not purchased or attached. All internal links remain relative; the site does not redirect visitors to the planned domain.

The static build runs scripts/brand-pages.mjs after all page generators, applying the PlasmaX logo, favicon, titles, homepage entry links and player branding. Original CSS colours and type sizes are retained. New SVG logos are authored geometry; the promotional PNG is an actual screenshot of our player with clearly illustrative News/Entertainment/Kids rows, not evidence of live playback. Asset provenance is in icons/PlasmaX-PROVENANCE.json and the PNG's text metadata.

## Personal social links
Set xProfile and twitchURL in data/site-config.json to the buyer's actual HTTPS links and rebuild. Only supported X/Twitter and Twitch hostnames are linked. Do not guess account handles. Existing /x/ and /twitch/ pages support public video links in the native player; a profile itself is not a specific video. Personal follow/watch links appear on the homepage when configured.

## Advertising
Advertising is disabled and makes no network request until configured. The named Advertisement slot on the player pages stays hidden while disabled. It sits outside the video and controls.

For Google AdSense, use an approved publisher's own display unit from https://support.google.com/adsense/answer/9190028 : set advertising.enabled=true, provider=adsense, publisherId to the real ca-pub-… identifier and slotId to its real data-ad-slot. The build generates ads.txt for that configured publisher. Invalid or missing identifiers keep ads off; no sample credentials ship in production config. The script loads asynchronously near the placement. Provider approval, site verification, consent requirements and account configuration are not established by inserting code.

HilltopAds requires the actual account-specific approved snippet; it has not been connected. Do not substitute an invented script URL or publisher ID.

## Video watermark
brand.js wraps newly created IPTV videos and brands existing social media frames without replacing the video, changing its source or blocking controls. The custom Full screen button targets the branded wrapper when the browser supports element fullscreen. Native iOS video fullscreen and native video control fullscreen can leave the DOM wrapper, so the page watermark cannot be guaranteed in those modes; it is a UI overlay, not burned into broadcaster video.
