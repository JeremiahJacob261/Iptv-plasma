# Free IPTV Player visual system

The user authorized a modern polish on 2026-10-20, with two fixed constraints: preserve the existing colours and every text font size. Earlier exact-clone instructions still govern factual copy and original imagery; the new polish instruction authorizes layout and icon refinement.

## Typography and colours

Inter is the self-hosted interface family, with Open Sans as fallback. Existing heading, body, label, control, and responsive text sizes remain declared in the original immutable Oxygen CSS and app.css. polish.css must contain no font-size or font shorthand declarations. Font weight, line height and tracking can be refined without changing the size scale.

Retain existing colours at their current roles: original neon green #00ff24 and dark purple #171422 for site branding; #202020 player background, #ffffff foreground, #e74c3c playback actions and #ffb700 favorites. Other original surface, text, border, hover and state colours remain in source CSS. No colour/background replacements in polish.css. New outlined icons inherit their role’s colour; category hover uses the original green and input search icons use existing #222 input ink.

## Shape, layout and interaction

Shared controls use 9–12px corners; player shell uses 16px (12px on mobile). Main touch targets remain at least 44px. Heroicons v2.2.0 outline is the icon family, with its solid star for selected favorites. Static SVG symbols and category icons are converted during build; the old FontAwesome browser script is removed.

Source controls use a two-column grid at desktop widths and a native disclosure that closes after successful loading on mobile. The player retains a channel sidebar and fluid video pane; below 700px, video precedes the channel list. Directory entries use aligned responsive grids, original flags, and outlined category glyphs. Homepage/header/footer gain consistent gaps and stronger alignment without replacing original images or copy.

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
