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

type VisitorPeriod = "daily" | "weekly" | "all-time";
const visitorPeriods: { id: VisitorPeriod; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "all-time", label: "All time" },
];

const countFormat = new Intl.NumberFormat();
const locationName = ({ city, country }: Location) => city ? `${city}, ${country}` : country;
const visitorCount = (count: number) => `${countFormat.format(count)} ${count === 1 ? "visitor" : "visitors"}`;
const mapX = (longitude: number) => 360 + longitude * 2;
const mapY = (latitude: number) => 168 - latitude * 2;

export default function VisitorMap() {
    const [data, setData] = useState<VisitorData>();
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [request, setRequest] = useState(0);
    const [selected, setSelected] = useState<string>();
    const [expanded, setExpanded] = useState(false);
    const [activeDot, setActiveDot] = useState<number>();
    const [period, setPeriod] = useState<VisitorPeriod>("daily");

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setStatus("loading");
            try {
                const response = await fetch(`/api/admin/visitors?period=${period}`, { signal: controller.signal });
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
    }, [request, period]);

    const selectPeriod = (next: VisitorPeriod) => {
        if (next === period) return;
        setPeriod(next);
        setData(undefined);
        setStatus("loading");
        setSelected(undefined);
        setExpanded(false);
        setActiveDot(undefined);
    };

    const countries = (data?.countries ?? []).filter(country => country.visitorCount > 0)
        .sort((a, b) => b.visitorCount - a.visitorCount);
    const locations = (data?.markers ?? []).filter(marker => {
        if (!Array.isArray(marker.location) || !Number.isFinite(marker.count) || marker.count <= 0) return false;
        const [lat, lon] = marker.location;
        return lat >= -66 && lat <= 84 && lon >= -180 && lon <= 180;
    });
    const tooltipLocation = activeDot === undefined ? undefined : locations[activeDot];
    const tooltipY = tooltipLocation ? mapY(tooltipLocation.location[0]) / 3 : 0;
    const topCount = Math.max(1, ...countries.map(country => country.visitorCount));
    const activeCountry = countries.find(country => country.countryCode === selected);
    const topCountries = countries.slice(0, 5);
    const displayedCountries = expanded ? countries : topCountries;
    const selectedLocations = locations.filter(location => location.countryCode === selected)
        .sort((a, b) => b.count - a.count);

    return (
        <div className="visitor-geography">
            <div className="visitor-geography-toolbar">
                <h3 className="visitor-map-heading">Visitor locations</h3>
                <div className="visitor-period-controls" role="group" aria-label="Visitor date range">
                    {visitorPeriods.map(option => (
                        <button key={option.id} type="button" aria-pressed={period === option.id}
                            onClick={() => selectPeriod(option.id)}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <figure className="visitor-map">
                <div className="visitor-map-stage" onPointerDown={() => setActiveDot(undefined)}>
                    <svg viewBox="0 0 720 300" role="group" aria-label={activeCountry ? `Visitor locations in ${activeCountry.country}` : "Worldwide visitor locations"}>
                        <image href="/assets/visitor-world-map.svg" width="720" height="300" />
                        {locations.map((marker, index) => {
                            const { location: [lat, lon], count, countryCode } = marker;
                            const isActive = activeDot === index;
                            const className = !activeCountry || selected === countryCode ? "visitor-map-dot" : "visitor-map-dot-muted";
                            return (
                                <circle key={index} cx={mapX(lon)} cy={mapY(lat)}
                                    r={3.5 + Math.min(3, Math.sqrt(count) * .5)}
                                    className={`${className} visitor-map-marker${isActive ? " is-active" : ""}`}
                                    tabIndex={0} role="img" aria-label={`${locationName(marker)}, ${visitorCount(count)}`}
                                    onPointerEnter={event => { if (event.pointerType !== "touch") setActiveDot(index); }}
                                    onPointerLeave={event => {
                                        const root = event.currentTarget.getRootNode() as ShadowRoot | Document;
                                        if (event.pointerType !== "touch" && root.activeElement !== event.currentTarget) {
                                            setActiveDot(current => current === index ? undefined : current);
                                        }
                                    }}
                                    onPointerDown={event => { event.stopPropagation(); setActiveDot(index); }}
                                    onFocus={() => setActiveDot(index)}
                                    onBlur={() => setActiveDot(current => current === index ? undefined : current)}
                                    onKeyDown={event => { if (event.key === "Escape") setActiveDot(undefined); }}
                                />
                            );
                        })}
                    </svg>
                    {tooltipLocation && (
                        <div className="visitor-map-tooltip" role="tooltip" data-below={tooltipY < 45}
                            style={{ left: `clamp(min(50%, 85px), ${mapX(tooltipLocation.location[1]) / 7.2}%, max(50%, 100% - 85px))`, top: `${tooltipY}%` }}>
                            <strong>{locationName(tooltipLocation)}</strong>
                            <span>{visitorCount(tooltipLocation.count)}</span>
                        </div>
                    )}
                </div>
                <figcaption>
                    {activeCountry ? activeCountry.country : "Worldwide"}
                    {status === "ready" && countries.length > 0 && (
                        <span>{activeCountry ? `${countFormat.format(activeCountry.visitorCount)} visitors` : `${countFormat.format(countries.length)} countries`}</span>
                    )}
                </figcaption>
            </figure>

            {activeCountry && (
                <section className="visitor-location-detail" key={activeCountry.countryCode} aria-label={`Locations in ${activeCountry.country}`}>
                    <div className="visitor-location-header">
                        <h3>Mapped locations</h3>
                        <button type="button" onClick={() => setSelected(undefined)}>Worldwide view</button>
                    </div>
                    {selectedLocations.length === 0 ? (
                        <p className="visitor-map-status">No map coordinates available for this country.</p>
                    ) : (
                        <>
                            <LocationCounts locations={selectedLocations.slice(0, 4)} />
                            {selectedLocations.length > 4 && (
                                <details className="visitor-location-more">
                                    <summary>Show {countFormat.format(selectedLocations.length - 4)} more locations</summary>
                                    <LocationCounts locations={selectedLocations.slice(4)} />
                                </details>
                            )}
                            <p className="visitor-location-note">Counts cover the locations shown on the map.</p>
                        </>
                    )}
                </section>
            )}
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

function LocationCounts({ locations }: { locations: Location[] }) {
    return (
        <ul className="visitor-location-counts">
            {locations.map(({ city, count, location }, index) => (
                <li key={`${location.join(",")}-${index}`}>
                    <span>{city || "City unknown"}</span>
                    <strong>{countFormat.format(count)} <span>{count === 1 ? "visitor" : "visitors"}</span></strong>
                </li>
            ))}
        </ul>
    );
}
