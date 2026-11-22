import { useEffect, useState } from "react";

interface Location {
    location: [number, number];
    city: string | null;
    country: string;
    countryCode: string;
    count: number;
}

interface Country {
    country: string;
    countryCode: string;
    visitorCount: number;
}

interface VisitorData {
    markers: Location[];
    countries: Country[];
}

const countFormat = new Intl.NumberFormat();

export default function VisitorMap() {
    const [data, setData] = useState<VisitorData>();
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [request, setRequest] = useState(0);
    const [selected, setSelected] = useState<string>();
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            try {
                const response = await fetch("/api/admin/visitors", { signal: controller.signal });
                if (!response.ok) throw new Error("Visitor data unavailable");
                const result = await response.json();
                if (!result.success || !Array.isArray(result.data?.countries) || !Array.isArray(result.data?.markers)) {
                    throw new Error("Invalid visitor data");
                }
                setData(result.data);
                setStatus("ready");
            } catch {
                if (!controller.signal.aborted) setStatus("error");
            }
        }
        void load();
        return () => controller.abort();
    }, [request]);

    const countries = (data?.countries ?? []).filter(country => country.visitorCount > 0)
        .sort((a, b) => b.visitorCount - a.visitorCount);
    const locations = (data?.markers ?? []).filter(marker => {
        if (!Array.isArray(marker.location) || !Number.isFinite(marker.count) || marker.count <= 0) return false;
        const [lat, lon] = marker.location;
        return lat >= -66 && lat <= 84 && lon >= -180 && lon <= 180;
    });
    const topCount = Math.max(1, ...countries.map(country => country.visitorCount));
    const activeCountry = countries.find(country => country.countryCode === selected);
    const topCountries = countries.slice(0, 5);
    const displayedCountries = expanded ? countries : topCountries;
    const hasSelectedLocations = locations.some(location => location.countryCode === selected);

    return (
        <div className="visitor-geography">
            <figure className="visitor-map">
                <svg viewBox="0 0 720 300" role="img" aria-label={activeCountry ? `Visitor locations in ${activeCountry.country}` : "Worldwide visitor locations"}>
                    <image href="/assets/visitor-world-map.svg" width="720" height="300" />
                    {locations.map(({ location: [lat, lon], count, city, country, countryCode }, index) => {
                        const isHighlighted = !activeCountry || selected === countryCode;
                        return (
                            <circle key={index} cx={360 + lon * 2} cy={168 - lat * 2}
                                r={5 + Math.min(7, Math.sqrt(count))}
                                className={isHighlighted ? "visitor-map-dot" : "visitor-map-dot-muted"}>
                                <title>{city ? `${city}, ${country}` : country} · {countFormat.format(count)} visitors</title>
                            </circle>
                        );
                    })}
                </svg>
                <figcaption>
                    {activeCountry ? activeCountry.country : "Worldwide"}
                    {status === "ready" && countries.length > 0 && (
                        <span>{activeCountry ? `${countFormat.format(activeCountry.visitorCount)} visitors` : `${countFormat.format(countries.length)} countries`}</span>
                    )}
                </figcaption>
            </figure>

            {activeCountry && !hasSelectedLocations && <p className="visitor-map-status">No map coordinates available for this country.</p>}
            {status === "loading" && <p className="visitor-map-status" role="status">Loading visitor locations…</p>}
            {status === "error" && (
                <p className="visitor-map-status" role="status">Visitor locations couldn’t load.{" "}
                    <button type="button" onClick={() => { setStatus("loading"); setRequest(request + 1); }}>Try again</button>
                </p>
            )}
            {status === "ready" && countries.length === 0 && <p className="visitor-map-status">No country data recorded yet.</p>}
            {status === "ready" && countries.length > 0 && (
                <>
                    <h3 className="visitor-map-heading">Visitors by country</h3>
                    <ol className="visitor-country-list">
                        {displayedCountries.map(country => (
                            <li key={country.countryCode}>
                                <button type="button" className="visitor-country"
                                    aria-pressed={selected === country.countryCode}
                                    onClick={() => setSelected(selected === country.countryCode ? undefined : country.countryCode)}>
                                    <span className="visitor-country-name">{country.country}</span>
                                    <strong>{countFormat.format(country.visitorCount)}</strong>
                                    <span className="visitor-country-bar" aria-hidden="true">
                                        <span style={{ width: `${country.visitorCount / topCount * 100}%` }} />
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ol>
                    {countries.length > 5 && (
                        <button type="button" className="visitor-map-more" aria-expanded={expanded}
                            onClick={() => {
                                if (expanded && activeCountry && !topCountries.includes(activeCountry)) setSelected(undefined);
                                setExpanded(!expanded);
                            }}>
                            {expanded ? "Show top five" : `Show all ${countFormat.format(countries.length)} countries`}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
