# Free IPTV Player

Static recreation of freeiptvplayer.net without ads or account requirements. Serve `dist/` with any static HTTP host. No build or server dependencies are required.

Run `node check-player.cjs` to validate M3U parsing and `node --check dist/app.js` for JavaScript syntax. Downloaded originals and their provenance are recorded in `asset-manifest.json`. `mirror.py` and `complete.py` document reproduction of the original public resources (Python and BeautifulSoup required only to repeat that process).

Playback: open IPTV Player, paste a playlist URL or upload an M3U, click Watch, then select a channel. Search, group selection and favorite filtering are available. Favorites stay in local browser storage. HLS.js is bundled locally; browsers supporting native HLS use their native player.

Limitations: stream availability, provider CORS, HTTPS mixed-content rules and codec support affect playback. Forms for the original contact/newsletter services are disconnected with explicit feedback. Visual fidelity and real stream playback have not been browser-verified in this environment.
