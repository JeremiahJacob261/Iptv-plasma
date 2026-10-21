# Featured account catalog

`featured-catalog.json` contains 512 distinct usernames for X and 512 for Twitch. Catalog membership and live availability are separate.

X identifiers are sourced from Wikidata's public P2002 statements, across seven editorial topic groups. Selection favors widely documented organizations, balances categories, prefers separate organizations, and retains the original eight featured accounts. Alternate official brand handles are distinct accounts; source entity URLs are included per record. Wikidata is CC0. An identifier may subsequently be renamed, restricted or removed, so live checks can report unavailable.

Twitch candidates are sourced from public popular-live results and Wikidata P5797 statements. Every selected Twitch username was returned by Twitch's anonymous `users(logins:)` profile lookup when the snapshot was created. No account cookies, OAuth or playback credentials were used to collect the catalog. Public occupation metadata and current stream topics inform editorial categories; a live stream's current game/topic is also shown separately when available.

`featured-provenance.json` records the source URLs and UX references. `scripts/build-featured-catalog.py` builds the snapshot from primary-source exports in `/tmp/featured-sources`; acquiring fresh source exports is a deliberate manual refresh, never a thousand-account deployment-time crawl.

The entire catalog is queued for monitoring, not reported as simultaneously verified. Featured picks refresh first, then bounded batches rotate while the page is visible. Coverage, unchecked accounts, last-seen live states, and provider failures are visible. Current availability depends on public provider data.
