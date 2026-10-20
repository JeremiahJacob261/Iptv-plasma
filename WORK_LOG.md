# Continuity: Free IPTV Player

User asked to reproduce https://freeiptvplayer.net/ closely (original wording, fonts, images and layout), excluding ads and requiring no login. Source is /workspace/sites/free-iptv-player. Public production is https://free-iptv-player-sigma.vercel.app/ in the user's connected Vercel account.

## Hosting identities
- Vercel team: team_a5HPk0cZrx8BbJ26wuS8I26E (jeremiahxs-projects)
- Vercel project: prj_hILQ5u3catuWm2e5Ys5B5m7Oth7t (free-iptv-player)
- Original Vercel deployment: dpl_BSuxyHmUfHoHujrNP3hBiPFfe9Tw
- Initial private Sites project: appgprj_6ad74205ee348191a56a4c1093dc5be3; user later explicitly selected public Vercel hosting.

## Architecture
Original public site mirrored into dist; original assets indexed in asset-manifest.json. Original ads, auth links/gates and analytics removed. Approximately 125 HTML site pages plus RSS. Self-hosted Open Sans / ABeeZee and original artwork. Static HTML plus dist/app.js/app.css, bundled hls.min.js.

The Vercel deployment source includes source-000.part ... source-016.part (archive chunks in /tmp/iptv-vercel-upload), build.mjs (from vercel-build.mjs), assets-download.json (from vercel-assets.json), vercel.json, api/*.mjs, lib/*.mjs and updates/app.js / updates/app.css. Build extracts the original archive, fetches missing original image/font assets with SHA-256 verification, and overlays updated player code. Wikimedia flags are packaged rather than fetched because thumbnail responses differ by location. API uploads via connected Vercel tool accept base64 data; use content-addressed files {file,sha,size}. CLI token isn't configured; use the connected plugin. Never expose credentials. .vercel/project.json stores only project/team IDs.

## Player repair on 2026-10-20
User saw generic CORS error after selecting a country. Original code directly fetched playlists from iptv-org in browser, depended on AbortSignal.timeout, and caught rendering errors as CORS errors. Added same-origin api/playlist.mjs and api/stream.mjs, backed by lib/upstream.mjs. Playlist API fetches public HTTP(S) sources; relay rewrites HLS variants, segments, keys and maps, supports byte ranges, follows and validates redirects, pins validated public DNS addresses and blocks private networks. No authentication or provider credentials forwarded. Stream relay is fallback after failed direct playback; HTTP compatibility mode forces secure relay.

Client fixes: guarded scrolling; compatibility timers; separate loading/rendering errors; HLS library readiness; HTTP relay; channel-switch/Stop cleanup; one media recovery; actual upstream errors; empty/malformed file errors; large list pagination; country/category/language lookup and renamed Persian language aliases. Favorites stay in local storage. Nine DOM/backend checks pass; source parser checks pass. Actual Nigeria, US, news and English playlist API responses tested (55, 1481, 1017, 3032 channels). Full Mux sample and Nigerian ACNN master->variant->segment relay tested; ffprobe confirms H.264 1280x720 and AAC. Local API test server was started on 127.0.0.1:3998 using NODE_USE_ENV_PROXY=1 for this environment's proxy.

Browser UI and decoded playback in a real browser have not been verified: no supported browser-control tool is available. DOM tests run with jsdom installed at /tmp/iptv-tests/node_modules/jsdom. Third-party sources can remain offline/region-restricted; e.g. Channels TV source failed while ACNN and TVC manifests loaded. Do not claim all external channels work.

## Pending user information
Copied contact/newsletter forms remain disconnected and explicitly report no submission. Asked user where messages/subscriptions should go; no destination configured yet. Do not forward to original website's services or invent a destination.

## Checks
node --test tests/player.test.cjs tests/upstream.test.mjs
node check-player.cjs
DOM fixtures use real playlists downloaded into /tmp/iptv-{ng,us,news,english}.m3u.

## Latest deployment
Repair preview dpl_G5r1ueB57rUgrzEhfkX6uN1kidgL at https://free-iptv-player-5su3cgxl2-jeremiahxs-projects.vercel.app tested successfully. Preview promotion API returned 422, so same verified source was submitted as a production deployment. Record final production ID and verification after completion below.

Final production repair: dpl_2FUb3jQiMGS1i5rtFXTitxQcecw7, READY, assigned https://free-iptv-player-sigma.vercel.app/. Production JavaScript matches local repaired source. Production Nigeria/US APIs and ACNN HLS checked. Last repair source commit: c75cef1. Original source-parts are unchanged; updated app and CSS are overlays. Contact/newsletter destination still pending user answer.

## Official IPTV-org catalog (2026-10-20)
User provided index.m3u and index.category.m3u and asked to connect playlist links from the IPTV GitHub repository. Verified README.md and PLAYLISTS.md from https://github.com/iptv-org/iptv. Added scripts/update-sources.mjs to extract the actual documented URLs into dist/playlist-sources.json. Catalog currently includes 1,280 sources: 4 aggregates, 30 categories, 207 languages, 190 countries, 42 regions, 350 subdivisions and 457 cities. Zero-channel entries are excluded; city/state names may repeat in different areas. The catalog refreshes at build time, with a verified snapshot if upstream documentation cannot be fetched.

The player now defaults to https://iptv-org.github.io/iptv/index.category.m3u and auto-loads it. A searchable IPTV-org source selector exposes both supplied URLs and the rest of the official catalog. Existing country/category/language cards resolve only documented catalog entries rather than inventing URL paths. Parser deduplicates identical stream URLs and merges their category memberships; filters support multiple categories on the same feed. Custom URL and file uploads are preserved. All 12 automated checks pass, including parsing both full user-supplied playlists (>10,000 feeds), source search/switching, category retention and existing playback relay checks. Representative official country/category/language/region/state/city links returned HTTP 200.

Catalog production deployment submitted: dpl_AmZgUtoEP2kk5SaMvbLDLELgWWTN. Deployment adds updates/playlist-sources.json and scripts/update-sources.mjs to the prior source files. Record final status below.

Catalog deployment dpl_AmZgUtoEP2kk5SaMvbLDLELgWWTN is READY at the existing public Vercel URL. Production playlist APIs return HTTP 200 for both supplied aggregate URLs. Live deployed app code exercised in jsdom against the actual production API: category default loaded 11,365 unique feeds with 31 category options, official picker contained 1,280 sources, and Nigeria source search/switch loaded 54 playable feeds. These are DOM/network checks, not real browser video playback. Source commit 624c1a9.

## Playback transparency and provider restrictions (2026-10-20)
User supplied screenshot of 3ABN Kids playing inside our mobile UI and asked for access to every channel regardless of regional restrictions. Confirmed app renders a native video element, not an iframe or third-party IPTV website. The picture is the channel program; page chrome is our player UI. Do not claim the app can universally override provider access, rights/DRM/subscriptions, dead streams or regional restrictions. Current server relay runs in iad1 (US); it can provide an alternate route but may itself be refused by the provider.

Diagnosed screenshot entries using production relay: ADN TV+ master, variant and a 2.3MB segment returned HTTP 200; ffprobe showed H.264 1280x720 and AAC. 3ABN Kids main manifest returned 200 but a subsequent variant request returned upstream 403 through the relay. Thus generic 'offline/restricted/region' wording did not establish an actual geo-block; viewer-side direct streaming can work while relay-side access fails.

Added station IDs and provider-declared user-agent/referrer parsing, propagated declared headers through HLS variants/segments/keys, and kept private-network/header-injection protections. Added distinct public provider error codes/statuses for 401/403, 404/410, 429 and 451, rather than collapsing all failures to generic 502. HTML returned at a supposed HLS URL is rejected as a webpage, never embedded.

Player still tries the channel media URL directly, then relay as applicable. On failure it searches loaded feeds and the official IPTV-org full index for alternatives matching the same station ID (quality suffix ignored); max three public source URLs, with no arbitrary different-station substitution. Added visible Full screen control targeting the video element, a clickable actual media-host source label, and Now playing/stopped messages. Exact provider refusal is shown when available; no universal unblocking promise. Seventeen DOM/backend tests pass, including same-station fallback, header propagation, no-iframe assertion and full-screen targeting. Graphical browser/real mobile decoded playback remains unverified; media bytes/codecs and DOM behavior are checked.

Production deployment submitted: dpl_DB19BJPMcCdrcd7tj2sbTmkSyyVL. Verify READY and record final status below.
