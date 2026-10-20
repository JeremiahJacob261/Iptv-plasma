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
