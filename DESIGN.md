# PlasmaX visual system

The user authorized a modern polish on 2026-10-20, initially preserving existing colours and every text font size. On 2026-10-24 the supplied purple logo and explicit matching-colour request superseded the fixed-colour constraint for this standalone website. Interface structure and every text font size remain fixed. Earlier exact-clone guidance continues where later identity and palette instructions have not superseded it.

## Typography and colours

Inter is the self-hosted interface family, with Open Sans as fallback. Existing heading, body, label, control, and responsive text sizes remain declared in the original immutable Oxygen CSS and app.css. polish.css must contain no font-size or font shorthand declarations. Font weight, line height and tracking can be refined without changing the size scale.

Current approved brand colours are logo-sampled purple #693695 for primary surfaces and playback actions, #191120 for the dark site canvas, #211929 for the player, #ffffff foreground and #cfb0ed for links, favorites and suitable brand foregrounds. Primary hover uses #55277e; the hero gradient uses #7c4aa5, #693695 and #4c236f. White text accompanies purple CTA surfaces. Semantic green status colours remain meaningful and are not brand replacements. Other original neutral colours remain in source CSS; input search icons retain existing #222 ink. Original mirrored CSS is unchanged. scripts/theme-pages.mjs emits the colour-only dist/theme.css layer after the brand generator; it changes no layout or typography declarations. polish.css retains its existing scope.

Historical palette, superseded by the supplied-logo approval on 2026-10-24: neon-green brand #00ff24, dark brand #171422, player #202020, foreground #ffffff, playback actions #e74c3c and favorites #ffb700. The dated baseline and first identity review refer to this earlier palette.

## Shape, layout and interaction

Shared controls use 9–12px corners; player shell uses 16px (12px on mobile). Main touch targets remain at least 44px. Heroicons v2.2.0 outline is the icon family, with its solid star for selected favorites. Static SVG symbols and category icons are converted during build; the old FontAwesome browser script is removed.

Source controls remain visible in a two-column grid on desktop and one column on phones. The recommended default channels load automatically on entry, with the source controls remaining visible. An explicit playlist link, source selection or URL/file submission opens its channels directly. The player retains a channel sidebar and fluid video pane; below 700px, video precedes the channel list. Directory entries use aligned responsive grids, original flags, and outlined category glyphs. Homepage/header/footer gain consistent gaps and stronger alignment without replacing original images or copy.

Motion is limited to short 180ms control/hover feedback and loading-icon rotation. prefers-reduced-motion disables these.

## Historical polish verification

At the original polish stage, original CSS file hashes, colours and font-size declarations are captured in .impeccable/polish-baseline/. DOM comparisons confirm unchanged computed text sizes and foreground/background colours on the homepage, player, countries, categories and languages pages. Playback and interaction checks remain required. No supported browser-control tool is available in this session; screenshot-based visual comparison is unverified.

## X native video surface

The X viewer uses the site's own native video player with HLS support and direct-to-relay fallback. Video leads; creator avatar, display name, linked username, genuine live/replay state, post text/title and publication date sit beneath it in the existing dark player palette. Quality and clip selection, Stop and Full screen controls use the existing Heroicons and control sizing. No X widgets or X website interface loads. Preserve all existing text sizes and use the current approved palette. Missing or restricted media receives an explicit message, with no silent provider-UI fallback.

## Shared X and Twitch viewing layout

Both pages now use the native media player. A full-width link field and adjacent desktop Load video action lead to status feedback and a quiet outlined empty stage. On phones the action stacks below the field. The media area leads; creator identity/state, title, optional genuine category/viewer count, publication time and a separated control row follow. Quality/clip selectors stay left; playback actions sit right on wide screens and wrap on phones. Secondary availability guidance lives in a native disclosure below the viewer. Existing text sizes remain fixed; the approved purple palette supersedes the original brand colours.

## Page-local live discovery

X and Twitch each have their own searchable channel directory and category selector, never added to global IPTV category navigation. Twitch categories come from current stream metadata; X categories are editorial groupings for featured accounts. Live notices use a moving strip with a Pause/Resume button, hover/focus pausing, and a static scrollable reduced-motion variant. Cards use actual media previews and verified state; playback stays in the native player above the directory. Status text shows check time, partial coverage and stale results accurately. Browser-local monitoring does not require site accounts.

## Large featured catalogs and Laws of UX

Each social page has a sourced 512-account catalog. Editorial featured picks appear before the manual URL field/player, with six visible initially and a clear Browse all channels route. Category shortcuts reduce the first decision set (Hick's Law); first position gives featured picks prominence (serial-position effect). The main catalog uses clearly bounded category sections (common region), with small initial groups, search and progressive disclosure. No false personalized recommendations or fabricated live labels. Original type sizes remain fixed; use the approved purple palette for brand roles. Small creator avatars retain their natural purpose instead of being stretched into video thumbnails.

## Narrow-screen behavior

At phone widths, use 16px page gutters and 12px player padding, preserving the original text scale. The navigation drawer stays within the viewport and uses dynamic viewport height. Playback actions share a full-width row; native quality selectors receive their own row. Featured social picks remain first in a horizontally swipeable, scroll-snapping shelf; category shortcuts scroll independently and the full directory uses compact single-column rows. Never hide page overflow to conceal an oversized control. Inputs and metadata must shrink or wrap within their containers. Below 380px, IPTV directory tiles use one column.


## First PlasmaX identity — 2026-10-24 (historical)

PlasmaX is the standalone site identity. The planned domain is plasmax.io; it is unpurchased and unattached. The public origin remains https://free-iptv-player-sigma.vercel.app and internal navigation stays relative. This first identity update preserved the then-existing colours and every interface text size. The later supplied-logo approval below supersedes its geometric mark and palette.

The first, now-retired authored geometric SVG logo combined a rounded mark, a P silhouette and a play triangle; the wordmark ends in the existing neon-green X. The header uses /assets/plasmax-logo.svg and favicon/app identity uses /assets/plasmax-mark.svg. The final build pass in scripts/brand-pages.mjs applies the PlasmaX identity, page titles and favicon across generated HTML pages. Homepage entry links expose Live TV, X (Twitter) and Twitch.

The replacement promotional artwork at /assets/plasmax-player-preview.png is an actual capture of the authored player UI. Its News, Entertainment and Kids rows are illustrative; the image makes no provider or live-playback claim. Authorship and screenshot provenance are recorded in icons/PlasmaX-PROVENANCE.json and the PNG metadata.

The inline video watermark pairs the geometric mark and PlasmaX text at the lower right of native IPTV, X and Twitch video, above the native control area. It uses the existing dark purple/white roles, a 6px corner, 85% opacity and a 28px mark. The logo is noninteractive and hidden from assistive technology. dist/brand.js observes added video nodes with MutationObserver, wraps the existing IPTV video or brands the existing social media frame, and preserves the video node and source. It is a page overlay rather than a burned-in broadcast mark. Custom element fullscreen targets the branded wrapper where supported; native iOS video fullscreen can omit DOM overlays.

Personal X and Twitch account links remain empty until genuine user-supplied HTTPS links are configured. Advertising is authorized but disabled: hidden placements outside the media/controls load no ad script. AdSense awaits genuine approved publisher and slot identifiers. HilltopAds remains an alternative awaiting an actual account-specific integration snippet and selection. Do not depict these integrations as active.

### Completed identity review

The first finish review disposition was **SHIP for the PlasmaX identity and inline watermark**. Evidence comprises 12 screenshots in /workspace/plasmax-review: home, IPTV player, X directory, Twitch directory, loaded X viewer and loaded Twitch viewer, each at 390×844 and 1440×1000. The reviewed layouts have no horizontal overflow, and advertising was not loaded. The implementation suite reports 55 passing tests.

Loaded X/Twitch screenshots use controlled metadata and a local test MP4; they demonstrate the native viewing UI and watermark only. They do not establish live provider availability or universal playback. Fullscreen was unavailable in headless review even with a direct request, so fullscreen overlay behavior remains unverified. This review supplements the earlier source/computed-style verification; the earlier lack of screenshot review is retained as historical context, not the status of this identity review.


## Approved supplied-logo identity — 2026-10-24

The actual PlasmaX mark is the user-supplied 1000066920.jpg: a purple crescent with three flame wisps. Transparent preparation with image_gen preserves the supplied artwork; WebP delivery is embedded within the existing SVG logo/mark files. A white chip gives the purple mark contrast on dark surfaces. Header/footer, favicon and native-player watermark use this supplied mark; the geometric P is retired. The artwork preparation and delivery provenance remain in icons/PlasmaX-PROVENANCE.json. The promotional player screenshot was recaptured with the purple theme and still uses illustrative rows without a provider/playback claim.

This is a colour and identity change only. Keep interface structure, section order, controls, geometry, spacing, responsive behavior, font families and all text sizes unchanged. The current palette is recorded under Typography and colours above. Personal account URLs, publisher/slot identifiers and advertising activation remain pending; the public origin and planned-domain status are unchanged.

### Supplied-logo finish review

Reviewer purple_logo_review disposition: **SHIP**. Ten screenshots in /workspace/plasmax-purple-review cover home, IPTV player, X, Twitch and categories at 390×844 and 1440×1000. Chromium comparisons with the theme enabled and disabled found identical geometry and computed font sizes, with no horizontal overflow. Sampled CTA foreground/background contrast meets 4.5:1. The parent-reported implementation suite has 56 passing tests. This review verifies the supplied artwork, purple palette and retained layout; the earlier provider-playback and fullscreen limitations continue to apply, and advertising remains disabled.


## Official account links — 2026-10-25
User supplied twitter.com/plasma1337x and twitch.tv/plasma1337x. Homepage Follow on X and Watch on Twitch actions now link to these HTTPS profiles in new tabs with noopener/noreferrer. Existing native X/Twitch viewer routes and editorial directories remain available. This config change does not establish account live status or alter media resolution. Advertising remains disabled pending real publisher setup.


## Video watermark placement — 2026-11-01
The PlasmaX logo appears by itself in the lower-right corner of each inline native IPTV, X and Twitch player, offset above native controls. The overlay remains noninteractive and preserves the media node. Element fullscreen uses its own offset; native iOS/video fullscreen can exclude DOM overlays.

## Landing-page organization — 2026-11-01
The landing page presents the existing heading and description first, followed by the primary Watch Now action. Live TV, X, Twitch, and the supplied profile links form a quieter secondary group. The unchanged longer introductory copy is available through a native, keyboard-operable About the player disclosure. Features, FAQ, footer links and other site pages are retained. The homepage-only landing.css uses the existing purple palette and type scale. The static build runs landing-polish.mjs after branding and theme generation so these changes survive deployment.

## Exchange below the IPTV player — 2026-11-03

The existing IPTV player and channel directory lead the page; the actual SparkExchange sections follow as a subordinate PlasmaX Exchange area. The exchange widget is followed by how it works, video, speed test, features, FAQ, contact, CTA and the exchange footer. The area uses PlasmaX branding and purple/lavender accents on dark surfaces, with white and muted text.

The exchange bundle loads near the section or immediately for supported section hashes; the speed test loads separately as it approaches the viewport. An open Shadow DOM and its own stylesheet isolate exchange styling from the player. In-area links scroll to their sections and respect reduced-motion preferences; footer links reach the exchange legal pages, support and the supplied X profile.

The available review images in /workspace/plasmax-below-review show desktop and mobile player, exchange preview and footer views. Visual inspection of the exchange preview and mobile footer confirms the displayed branding and layout only; these images do not establish successful swaps, provider availability, or end-to-end navigation and playback behavior.

## Exchange information page — 2026-11-04
The exchange widget stays in its existing position below the IPTV player. The guide, video, features, FAQ, contact, CTA and Exchange footer move to `/exchange/`. A prominent Exchange link in the existing header and mobile menu opens that page. Widget help links target its guide and video anchors; Start Exchange returns to the original widget at `/#exchange`. The page inherits the established PlasmaX palette, components and responsive layout. The player and channel controls remain unchanged.

## Exchange and IPTV page polish — 2026-11-04

This update supersedes the preceding note's Exchange-page widget and CTA placement. `/exchange/` now begins with a copy of the working exchange widget alongside a short introduction; the original widget below the IPTV player remains available. Keep the established supplied purple logo, purple actions, lavender links and dark surfaces. Clear headings, plain explanations and separated information sections replace decorative glow, gradient text, repeated cards and unsupported promotional claims. The desktop introduction and form stack on smaller screens.

The widget shows each selected currency's network beside its ticker, readable amounts and the live estimated quote. Currency loading, quote failures and validation states remain explicit; an outdated or failed estimate cannot enable submission. Guide and video links reach their sections. The primary Start Exchange and closing Back to exchange actions stay at this page's `#exchange`; shared navigation on other pages targets `/exchange/#exchange`. Keep legal, support and viewing links pointed at their actual destinations.

The new `/iptv/` promotional page uses the same identity, an actual player preview, concise directory/playlist/favourites explanations and links to the X and Twitch viewers. Its primary Open IPTV player action opens `/`. Availability copy states that channels depend on the broadcaster and location.

Browser verification covered live currency loading, quote estimates and provider guide playback. Transaction creation and contact submission were tested with mocked responses; no real exchange transaction or support email was sent. Those checks establish the interface behavior, not completed swaps or email delivery.

## Direct IPTV entry — 2026-11-04
The user removed the standalone IPTV promotional page. IPTV navigation and the Exchange-page IPTV action open the existing player at `/` directly. Both `/iptv` and `/iptv/` redirect to the player. The player and channel files remain unchanged.

## Official account embeds — 2026-11-05
The X and Twitch links in the top navigation now open `/x-feed/` and `/twitch-feed/` on PlasmaX. The X page uses the standard X timeline embed for `plasma1337x`, isolated from the main origin. The Twitch page uses the official channel player for `plasma1337x`, with the current hostname supplied as its required parent and autoplay disabled. Each page has a reload action. The separate native X/Twitch viewing tools remain on Categories. Display, offline status and access restrictions are controlled by each provider; the experimental public-feed reader is removed.

## Edge-to-edge social frames — 2026-11-05
The official account embed pages now use minimal HTML with the provider iframe filling the available viewport, including dynamic mobile viewport height. PlasmaX header/footer, margins, side padding, borders and rounded frames are removed from those two pages. The top navigation elsewhere still opens them, and browser Back returns to the previous page. X retains its standard provider embed and availability restrictions; Twitch retains its required current-host parent parameter.

## Twitch stream and chat — 2026-11-05
The account Twitch page shows the official player and chat side by side on wide screens and stacked below 800px. Both use the current hostname as their required parent. They initialize once near the viewport, without autoplay or polling. Existing navigation, footer and document scrolling remain available; the embed area has no side gutters. Twitch controls offline state and chat login requirements.

## Direct social profile links — 2026-11-06
At the user's request, `/x-feed/` and `/twitch-feed/` now show the respective brand logo and a direct link to the plasma1337x profile. No social frames, timeline fetching, provider scripts, or chat load on these pages. Shared navigation and footer remain. The separate native viewing tools remain available under Categories.
