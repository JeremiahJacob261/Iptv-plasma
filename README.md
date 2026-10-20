# Free IPTV Player

Static recreation of freeiptvplayer.net without ads or account requirements. Serve `dist/` with any static HTTP host. No build or server dependencies are required.

Run `node check-player.cjs` to validate M3U parsing and `node --check dist/app.js` for JavaScript syntax. Downloaded originals and their provenance are recorded in `asset-manifest.json`. `mirror.py` and `complete.py` document reproduction of the original public resources (Python and BeautifulSoup required only to repeat that process).

Playback: open IPTV Player, paste a playlist URL or upload an M3U, click Watch, then select a channel. Search, group selection and favorite filtering are available. Favorites stay in local browser storage. HLS.js is bundled locally; browsers supporting native HLS use their native player.

Limitations: stream availability, provider CORS, HTTPS mixed-content rules and codec support affect playback. Forms for the original contact/newsletter services are disconnected with explicit feedback. Visual fidelity and real stream playback have not been browser-verified in this environment.

## Vercel

Project `free-iptv-player` in the connected `jeremiahxs-projects` team. Production deployment is public with Vercel SSO/password protection disabled. `prepare-vercel.py` packages original documents and JavaScript/CSS; `vercel-build.mjs` restores the archive and downloads remaining original assets with SHA-256 verification. Wikimedia assets are packaged directly because thumbnail responses differ by location. The Vercel API deployment renames `vercel-build.mjs` to `build.mjs` and `vercel-assets.json` to `assets-download.json`.

## Player networking repair

Playlists load through `/api/playlist`; `/api/stream` provides the HLS/HTTP compatibility fallback. These Node.js functions validate public network destinations and redirects, forward byte ranges, and rewrite HLS child URLs. Run `node --test tests/player.test.cjs tests/upstream.test.mjs`; DOM tests require jsdom and the downloaded playlist fixtures described in WORK_LOG.md. Actual provider availability and region restrictions still apply. Contact/newsletter destinations remain unconfigured.
