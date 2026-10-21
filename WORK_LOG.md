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

Playback deployment dpl_DB19BJPMcCdrcd7tj2sbTmkSyyVL is READY at the existing public origin. Production app.js matches the repaired source, including Full screen and same-station fallback. Source commit 48e960f. Asked user for the exact failing channel and viewer country; screenshot alone shows a working 3ABN Kids stream and does not identify the failing station or prove geoblocking.

## Impeccable modern polish (2026-10-20)
User explicitly invoked Impeccable and requested a more modern website with Heroicons, while preserving colours and font sizes; font family may change. Replaced interface family with self-hosted variable Inter (48,256-byte WOFF2) and sourced official Heroicons v2.2.0 (MIT), including outline glyphs and solid favorite stars. Font and icon provenance/licenses are in icons/.

Added dist/polish.css as a shared layer across 125 HTML pages. Original CSS files and app.css are byte-for-byte unchanged, including every responsive font-size and colour declaration. New polish layer does not define text sizes or replace foreground/background colours. Representative before/after DOM comparisons confirm unchanged computed font sizes and text/background colours on homepage, player, countries, categories and languages. Baseline fixtures are tracked at .impeccable/polish-baseline/. Updated DESIGN.md and .impeccable/design.json reflect the newly authorized refinement and fixed constraints.

Polish includes consistent control corners/touch targets, aligned header/footer, better homepage spacing, responsive directory rows, original flags/images, Heroicons SVG symbol/category conversion, removal of old FontAwesome browser script, rounded channel rows/video frame, clearer spacing, loading rotation and reduced-motion handling. Playlist source controls now live in a native disclosure with a two-column desktop setup grid; on mobile the disclosure closes after successful loading to foreground video/channels. All controls and source metadata remain available, and player status is outside the setup grid.

Seventeen existing playback/backend tests pass plus three polish tests covering immutable CSS, representative computed size/colour equality, Heroicons and disclosure behavior. No supported browser-control tool exists in this session; visual screenshot QA is unverified. Do not claim pixel-perfect visual review.

Build now additionally uploads updates/polish.css, updates/inter-latin.woff2, updates/heroicons.json, both license files, and scripts/polish-pages.mjs. The build restores the original archive then converts static glyphs and adds /polish.css. This is important: local modified HTML is not individually uploaded. Submitted production deployment dpl_AgsX8F9xaJbKSkN6uw6UCqS4GxEN; confirm final production status below.

Polish deployment dpl_AgsX8F9xaJbKSkN6uw6UCqS4GxEN is READY at https://free-iptv-player-sigma.vercel.app/. Production homepage, player and all three directories return 200, include polish.css and omit the old FontAwesome browser script. Production app.js, polish.css and Inter WOFF2 match local source exactly. Source commit b4e1ab4. The existing full catalog/channel-loading production DOM check also runs against this release; no browser screenshots are available.

## X and Twitch embedded viewers (2026-10-20)
User authorized actual X and Twitch options in the top drawer so visitors can view public content inline without creating accounts on this website. Added /x/ and /twitch/ using the existing page shell and fixed palette/type sizes. Shared Alpine navigation data includes both links on all pages, desktop and mobile. Official X widgets support post links and profile timelines; official Twitch player supports channels and VODs with current hostname parent parameter. No credentials, scraping, or platform access bypass. Platform login/content restrictions and Twitch advertising remain controlled by each provider. Profiles may be restricted by X; failures have original-link fallback. Clear removes embedded player and stale async results cannot restore cleared content. Providers load only after submitting a link.

New scripts/social-pages.mjs installs menu options and generates pages from the player template at build. New social.js and social.css are deployment overlays. All 24 tests passed plus playlist parser check; existing palette/font-size checks still pass. Browser rendering and real provider guest playback have not been graphically verified in this session.

Production deployment dpl_F8XE2LgPK4yWhdkUPWVZoBY31dmF is READY at https://free-iptv-player-sigma.vercel.app/. Deployed source commit 59b53ff adds responsive Twitch layout (minimum 400x300 iframe viewport scaled to fit phones). Test-only commit 8f6b573 verifies resizing and observer cleanup; total 25 checks across prior regression and new embed tests. Production homepage, player, X and Twitch routes return HTTP 200; navigation entries and deployed social asset byte equality checked. Production Twitch DOM embed uses actual public hostname parent and clears correctly. These checks do not verify real graphical playback or guest access to arbitrary third-party content.

## X live-video support (2026-10-20)
User requested live X video support. Confirmed X's live widgets.js exposes createBroadcast and X's publish.twitter.com/oembed returns a twitter-broadcast embed for /i/broadcasts/ID. The official broadcast SDK currently embeds https://studio.x.com/embed/broadcast/ID; its player entry returned HTTP 200. This establishes the supported integration, not availability or decoded playback of any particular live show.

Added parsing for x.com/twitter.com/i/broadcasts/ID, official widgets.createBroadcast with do-not-track and responsive width, full-screen permissions and explicit replay/availability messaging. Standard live-video post embeds remain supported; /status/ID/video/1 and canonical /i/web/status/ID now parse correctly. Spaces links receive a specific audio-room explanation; Spaces are outside this live-video request. No platform access restrictions bypassed. X page labels/help now describe live broadcasts and replays; palette and font sizes unchanged.

All 28 automated DOM/backend/polish checks passed, plus parser verification. New checks cover direct broadcast links on supported hosts, live-post URL variants, full screen, failed embeds, malformed links and clearing stale results. Real graphical guest playback remains unverified. Asked user optionally for their exact live link; no link received yet.

X live-video deployment dpl_7MNB7wf8Rz83ZpkwZWUmeNYBwiXp is READY on the existing public Vercel origin. Source commit 63c3d2b. Anonymous /x/ returned HTTP 200 with live-video help, production social.js matched local bytes, and deployed DOM/code dispatched a broadcast through a mocked official SDK with fullscreen and Clear behavior verified. Actual X broadcast player endpoint returned HTTP 200 separately; real video decode/guest playback remains unverified without graphical browser and a supplied active stream link.

## Native X media player (2026-10-21)
User requested our own player for X media, with Impeccable presentation of title/name/username instead of mirroring X UI. Removed X widget rendering. X inputs resolve via new api/x-media.mjs + lib/x-media.mjs, reading anonymous public syndication JSON for posts and the public studio.x.com embed page's JSON data for broadcasts (JSON decoding only, never executing provider scripts). No guest tokens, cookies, API credentials or access-control bypass. Public payload includes broadcast videoUrl and creator metadata. Public availability and undocumented payload changes can still limit resolution.

New x-player.js renders native video + existing hls.js, direct-to-relay fallback, safe text-only metadata, avatar/display name/@handle/date, real live/replay state, multi-video selection, quality selection, Stop, native media controls and Full screen. Clear aborts requests and destroys video/HLS; stale requests cannot restore content. X widgets never load, including for text-only posts. Profiles require a specific video link, because a profile does not identify playable media. Protected/unavailable sources show explicit errors. Existing Twitch functionality retained. Colours/text sizes stay fixed; layout follows incumbent player styling.

31 automated DOM/backend/regression/polish tests pass plus parser check. Anonymous real source checks resolved Jocelyn Laidlaw's public two-video post and SpaceX SN10 replay metadata. MP4 byte range returned 206 video/mp4 (262,144 bytes); public replay master and variant returned 200 HLS. No supported graphical browser tool is available; visual/native decoded playback remains unverified. Build uploads additional x-player.js, api/x-media.mjs and lib/x-media.mjs. Original source archive is no longer in /tmp after environment reset; reuse source chunk digests from the existing Vercel deployment file tree.

Native X production deployment dpl_8PmpP9qtfm5VoUu82aCJqFf1v9y6 is READY at the public Vercel origin, source commit 670d750; test-only commit fcc0aed adds native HLS lifecycle coverage (32 checks total). Existing archive chunks were reused by SHA without size fields; API accepts that, so no need to re-download/re-upload old archive parts. Vercel file-content tool truncates binary data, so do not use its truncated response to infer sizes or reconstruct files.

Production assets match local native-player source. Anonymous production resolver returned two videos and real creator details for the public Laidlaw post, and one HLS replay with SpaceX details for SN10. Production stream relay returned MP4 HTTP 206 with 262,144 bytes, and replay master plus variant HTTP 200. Live production page/code/real resolver exercised in jsdom: native video source, creator metadata, no X iframe and Clear verified. Harness needs Node AbortController assigned to jsdom when forwarding fetch to Node; native browser AbortController is unaffected. No graphical browser playback or screenshot review was performed.
