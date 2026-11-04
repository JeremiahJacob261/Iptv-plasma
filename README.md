# Free IPTV Player

Static recreation of freeiptvplayer.net without ads or account requirements. Serve `dist/` with any static HTTP host. No build or server dependencies are required.

Run `node check-player.cjs` to validate M3U parsing and `node --check dist/app.js` for JavaScript syntax. Downloaded originals and their provenance are recorded in `asset-manifest.json`. `mirror.py` and `complete.py` document reproduction of the original public resources (Python and BeautifulSoup required only to repeat that process).

Playback: open IPTV Player, paste a playlist URL or upload an M3U, click Watch, then select a channel. Search, group selection and favorite filtering are available. Favorites stay in local browser storage. HLS.js is bundled locally; browsers supporting native HLS use their native player.

Limitations: stream availability, provider CORS, HTTPS mixed-content rules and codec support affect playback. Forms for the original contact/newsletter services are disconnected with explicit feedback. Visual fidelity and real stream playback have not been browser-verified in this environment.

## Vercel

Project `free-iptv-player` in the connected `jeremiahxs-projects` team. Production deployment is public with Vercel SSO/password protection disabled. `prepare-vercel.py` packages original documents and JavaScript/CSS; `vercel-build.mjs` restores the archive and downloads remaining original assets with SHA-256 verification. Wikimedia assets are packaged directly because thumbnail responses differ by location. The Vercel API deployment renames `vercel-build.mjs` to `build.mjs` and `vercel-assets.json` to `assets-download.json`.

## Player networking repair

Playlists load through `/api/playlist`; `/api/stream` provides the HLS/HTTP compatibility fallback. These Node.js functions validate public network destinations and redirects, forward byte ranges, and rewrite HLS child URLs. Run `node --test tests/player.test.cjs tests/upstream.test.mjs`; DOM tests require jsdom and the downloaded playlist fixtures described in WORK_LOG.md. Actual provider availability and region restrictions still apply. Contact/newsletter destinations remain unconfigured.

## Built-in channel sources

The player loads IPTV-org's category-grouped worldwide list by default. Search the source picker for countries, categories, languages, regions, states/provinces or cities. Both `https://iptv-org.github.io/iptv/index.m3u` and `https://iptv-org.github.io/iptv/index.category.m3u` are included. Source links come from the official repository's `PLAYLISTS.md`; `scripts/update-sources.mjs` refreshes the catalog during deployment. Streams continue to load from their current upstream URLs through the playlist API. Identical feed URLs are displayed once while retaining all their categories.

## Exchange sections and admin

The existing IPTV player and channel files remain unchanged. `dist/brand.js` mounts the exchange widget below the player, loading its bundle when it approaches the viewport. Supporting Exchange sections now live at `/exchange/`, linked from the top navigation. `exchange/src` contains the source, with a Shadow DOM boundary to keep its styles from changing the player. Rebuild with `npm ci --prefix exchange` and `npm run build --prefix exchange`. The copied `exchange-base.css` is the compiled SparkExchange stylesheet; its PlasmaX-specific additions are in `exchange-overrides.css`.

Exchange requests under `/api/changenow`, `/api/stealthex`, `/api/settings`, `/api/contact` and `/api/track-visit` are routed to the existing SparkExchange service. Status and Exchange legal pages are served locally under `/status/…` and `/exchange/…`. No transaction is created by loading or testing the page.

The admin dashboard is at `/admin/`. The production username defaults to `admin`; the initial randomly generated password is stored as `PLASMAX_ADMIN_PASSWORD` in the Vercel project environment and is accessible to authorized project members. Choose a new password of at least 20 characters if rotating it. Vercel environment changes require a new deployment to take effect. `PLASMAX_ADMIN_SESSION_SECRET`, `PLASMAX_SUPABASE_URL` and `PLASMAX_SUPABASE_SERVICE_KEY` are server-only secrets; never put their values in browser code or Git. The dashboard uses signed HttpOnly cookies, same-origin checks and a database-backed login attempt limit, and fails closed if configuration is missing.

The IPTV counters record aggregate visits per browser tab and playback starts; they do not record playlist URLs or channel names. Daily counters use separate `plasmax_iptv_*` keys in the existing `app_settings` table. Preview uses a separate prefix. The counters are approximate, not unique-user or billing statistics. Admin exchange data continues to use the existing SparkExchange backend. Its original public admin endpoints need independent security remediation; protecting the new PlasmaX admin does not secure the old SparkExchange site.
