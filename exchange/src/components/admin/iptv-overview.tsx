import { useEffect, useState } from "react";

interface IptvMetrics {
    visits: number;
    plays: number;
    channelCount: number;
    days: number;
    daily: { date: string; visits: number; plays: number }[];
    channels: { id: string; name: string; plays: number; viewers: number; watchSeconds: number; score: number }[];
}

const number = new Intl.NumberFormat();
const shortDay = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
const dateLabel = (date: string) => shortDay.format(new Date(date + "T00:00:00Z"));

export default function IptvOverview({ refresh, onUnauthorized }: { refresh: number; onUnauthorized: () => void }) {
    const [range, setRange] = useState(30);
    const [metric, setMetric] = useState<"plays" | "visits">("plays");
    const [data, setData] = useState<IptvMetrics>();
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        setError(false);
        async function load() {
            try {
                const response = await fetch(`/api/admin/iptv-analytics?days=${range}`, { signal: controller.signal });
                if (response.status === 401) return onUnauthorized();
                if (!response.ok) throw new Error("Analytics unavailable");
                setData(await response.json());
            } catch {
                if (!controller.signal.aborted) setError(true);
            }
        }
        void load();
        return () => controller.abort();
    }, [range, refresh, onUnauthorized]);

    const report = data?.days === range ? data : undefined;
    const peak = Math.max(1, ...(report?.daily.map(day => day[metric]) ?? []));
    const peakChannel = Math.max(1, ...(report?.channels.map(channel => channel.score) ?? []));

    return (
        <section aria-labelledby="iptv-title">
            <div className="admin-section-head">
                <div><h1 id="iptv-title">IPTV analytics</h1><p>See how often people use the player and which channels they start.</p></div>
                <div className="admin-segments" role="group" aria-label="Date range">
                    {[7, 30].map(days => <button type="button" key={days} aria-pressed={range === days} onClick={() => setRange(days)}>{days} days</button>)}
                </div>
            </div>
            {error && <p className="admin-notice" role="status">IPTV analytics couldn’t load. Use Refresh to try again.</p>}
            {!error && !report && <p className="admin-notice" role="status">Loading IPTV analytics…</p>}
            {report && <>
                <dl className="admin-totals">
                    <div><dt>Player visits</dt><dd>{number.format(report.visits)}</dd></div>
                    <div><dt>Playback starts</dt><dd>{number.format(report.plays)}</dd></div>
                    <div><dt>Public channels played</dt><dd>{number.format(report.channelCount)}</dd></div>
                </dl>
                <div className="admin-report-grid">
                    <section className="admin-panel">
                        <div className="admin-panel-head">
                            <h2>Daily activity</h2>
                            <div className="admin-segments" role="group" aria-label="Activity metric">
                                <button type="button" aria-pressed={metric === "plays"} onClick={() => setMetric("plays")}>Starts</button>
                                <button type="button" aria-pressed={metric === "visits"} onClick={() => setMetric("visits")}>Visits</button>
                            </div>
                        </div>
                        <div className="admin-chart" role="group" aria-label={metric === "plays" ? "Playback starts by day" : "Player visits by day"}>
                            {report.daily.map(day => (
                                <div className="admin-chart-day" key={day.date} tabIndex={0}
                                    aria-label={`${dateLabel(day.date)}: ${number.format(day[metric])}`}>
                                    <span className="admin-chart-bar" style={{ height: `max(2px, ${day[metric] / peak * 100}%)` }} />
                                    <span className="admin-chart-label" aria-hidden="true">{dateLabel(day.date)} · {number.format(day[metric])}</span>
                                </div>
                            ))}
                        </div>
                        <div className="admin-chart-dates"><span>{dateLabel(report.daily[0].date)}</span><span>{dateLabel(report.daily.at(-1)!.date)} UTC</span></div>
                    </section>
                    <section className="admin-panel">
                        <div className="admin-panel-head"><h2>Top channels</h2><span>Popularity score</span></div>
                        {report.channels.length ? (
                            <ol className="admin-channel-rank">
                                {report.channels.map((channel, index) => <li key={channel.id}>
                                    <span>{index + 1}</span><strong>{channel.name}<br /><small>{number.format(channel.viewers)} viewer sessions · {number.format(Math.round(channel.watchSeconds / 60))} min watched</small></strong><b>{channel.score}</b>
                                    <meter aria-label={`${channel.name} popularity score`} min={0} max={peakChannel} value={channel.score} />
                                </li>)}
                            </ol>
                        ) : <p className="admin-notice">No public channel plays recorded for this period yet.</p>}
                        <p className="admin-caption">Popularity combines watch time (65%) and anonymous viewer sessions (35%). Watch time is recorded in 30-second intervals for public IPTV-org channels. Custom playlists are included in totals only.</p>
                    </section>
                </div>
            </>}
        </section>
    );
}
