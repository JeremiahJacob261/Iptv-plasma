# PlasmaX visual system

The user authorized a modern polish on 2026-10-20, with two fixed constraints: preserve the existing colours and every text font size. Earlier exact-clone instructions still govern factual copy and original imagery; the new polish instruction authorizes layout and icon refinement.

## Typography and colours

Inter is the self-hosted interface family, with Open Sans as fallback. Existing heading, body, label, control, and responsive text sizes remain declared in the original immutable Oxygen CSS and app.css. polish.css must contain no font-size or font shorthand declarations. Font weight, line height and tracking can be refined without changing the size scale.

Retain existing colours at their current roles: original neon green #00ff24 and dark purple #171422 for site branding; #202020 player background, #ffffff foreground, #e74c3c playback actions and #ffb700 favorites. Other original surface, text, border, hover and state colours remain in source CSS. No colour/background replacements in polish.css. New outlined icons inherit their role’s colour; category hover uses the original green and input search icons use existing #222 input ink.

## Shape, layout and interaction

Shared controls use 9–12px corners; player shell uses 16px (12px on mobile). Main touch targets remain at least 44px. Heroicons v2.2.0 outline is the icon family, with its solid star for selected favorites. Static SVG symbols and category icons are converted during build; the old FontAwesome browser script is removed.

Source controls remain visible in a two-column grid on desktop and one column on phones. The recommended default channels load automatically on entry, with the source controls remaining visible. An explicit playlist link, source selection or URL/file submission opens its channels directly. The player retains a channel sidebar and fluid video pane; below 700px, video precedes the channel list. Directory entries use aligned responsive grids, original flags, and outlined category glyphs. Homepage/header/footer gain consistent gaps and stronger alignment without replacing original images or copy.

Motion is limited to short 180ms control/hover feedback and loading-icon rotation. prefers-reduced-motion disables these.

## Verification

Original CSS file hashes, colours and font-size declarations are captured in .impeccable/polish-baseline/. DOM comparisons confirm unchanged computed text sizes and foreground/background colours on the homepage, player, countries, categories and languages pages. Playback and interaction checks remain required. No supported browser-control tool is available in this session; screenshot-based visual comparison is unverified.

## X native video surface

The X viewer uses the site's own native video player with HLS support and direct-to-relay fallback. Video leads; creator avatar, display name, linked username, genuine live/replay state, post text/title and publication date sit beneath it in the existing dark player palette. Quality and clip selection, Stop and Full screen controls use the existing Heroicons and control sizing. No X widgets or X website interface loads. Preserve all existing text sizes and colours. Missing or restricted media receives an explicit message, with no silent provider-UI fallback.

## Shared X and Twitch viewing layout

Both pages now use the native media player. A full-width link field and adjacent desktop Load video action lead to status feedback and a quiet outlined empty stage. On phones the action stacks below the field. The media area leads; creator identity/state, title, optional genuine category/viewer count, publication time and a separated control row follow. Quality/clip selectors stay left; playback actions sit right on wide screens and wrap on phones. Secondary availability guidance lives in a native disclosure below the viewer. Existing palette and text sizes remain fixed.

## Page-local live discovery

X and Twitch each have their own searchable channel directory and category selector, never added to global IPTV category navigation. Twitch categories come from current stream metadata; X categories are editorial groupings for featured accounts. Live notices use a moving strip with a Pause/Resume button, hover/focus pausing, and a static scrollable reduced-motion variant. Cards use actual media previews and verified state; playback stays in the native player above the directory. Status text shows check time, partial coverage and stale results accurately. Browser-local monitoring does not require site accounts.

## Large featured catalogs and Laws of UX

Each social page has a sourced 512-account catalog. Editorial featured picks appear before the manual URL field/player, with six visible initially and a clear Browse all channels route. Category shortcuts reduce the first decision set (Hick's Law); first position gives featured picks prominence (serial-position effect). The main catalog uses clearly bounded category sections (common region), with small initial groups, search and progressive disclosure. No false personalized recommendations or fabricated live labels. Original palette and type sizes remain fixed. Small creator avatars retain their natural purpose instead of being stretched into video thumbnails.

## Narrow-screen behavior

At phone widths, use 16px page gutters and 12px player padding, preserving the original text scale. The navigation drawer stays within the viewport and uses dynamic viewport height. Playback actions share a full-width row; native quality selectors receive their own row. Featured social picks remain first in a horizontally swipeable, scroll-snapping shelf; category shortcuts scroll independently and the full directory uses compact single-column rows. Never hide page overflow to conceal an oversized control. Inputs and metadata must shrink or wrap within their containers. Below 380px, IPTV directory tiles use one column.


## PlasmaX identity — 2026-10-24

PlasmaX is the standalone site identity. The planned domain is plasmax.io; it is unpurchased and unattached. The public origin remains https://free-iptv-player-sigma.vercel.app and internal navigation stays relative. This identity update preserves the existing colours and every interface text size described above.

The original authored geometric SVG logo combines a rounded mark, a P silhouette and a play triangle; the wordmark ends in the existing neon-green X. The header uses /assets/plasmax-logo.svg and favicon/app identity uses /assets/plasmax-mark.svg. The final build pass in scripts/brand-pages.mjs applies the PlasmaX identity, page titles and favicon across generated HTML pages. Homepage entry links expose Live TV, X (Twitter) and Twitch.

The replacement promotional artwork at /assets/plasmax-player-preview.png is an actual capture of the authored player UI. Its News, Entertainment and Kids rows are illustrative; the image makes no provider or live-playback claim. Authorship and screenshot provenance are recorded in icons/PlasmaX-PROVENANCE.json and the PNG metadata.

The inline video watermark pairs the geometric mark and PlasmaX text at the upper right of native IPTV, X and Twitch video. It uses the existing dark purple/white roles, a 6px corner, 85% opacity and a 20px mark. The label is noninteractive and hidden from assistive technology. dist/brand.js observes added video nodes with MutationObserver, wraps the existing IPTV video or brands the existing social media frame, and preserves the video node and source. It is a page overlay rather than a burned-in broadcast mark. Custom element fullscreen targets the branded wrapper where supported; native iOS video fullscreen can omit DOM overlays.

Personal X and Twitch account links remain empty until genuine user-supplied HTTPS links are configured. Advertising is authorized but disabled: hidden placements outside the media/controls load no ad script. AdSense awaits genuine approved publisher and slot identifiers. HilltopAds remains an alternative awaiting an actual account-specific integration snippet and selection. Do not depict these integrations as active.

### Completed identity review

The finish review disposition is **SHIP for the PlasmaX identity and inline watermark**. Evidence comprises 12 screenshots in /workspace/plasmax-review: home, IPTV player, X directory, Twitch directory, loaded X viewer and loaded Twitch viewer, each at 390×844 and 1440×1000. The reviewed layouts have no horizontal overflow, and advertising was not loaded. The implementation suite reports 55 passing tests.

Loaded X/Twitch screenshots use controlled metadata and a local test MP4; they demonstrate the native viewing UI and watermark only. They do not establish live provider availability or universal playback. Fullscreen was unavailable in headless review even with a direct request, so fullscreen overlay behavior remains unverified. This review supplements the earlier source/computed-style verification; the earlier lack of screenshot review is retained as historical context, not the status of this identity review.
