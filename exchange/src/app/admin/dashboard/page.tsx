"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw, LogOut, Save, Globe, Tv, FileText, SlidersHorizontal, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import VisitorMap from "@/components/admin/visitor-map";
import IptvOverview from "@/components/admin/iptv-overview";
import PreciousBlog from "@/components/admin/precious-blog";

interface Transaction {
    id: string;
    changenow_id?: string;
    stealthex_id?: string;
    payin_address: string;
    payout_address: string;
    from_currency: string;
    to_currency: string;
    from_amount: number;
    to_amount: number;
    status: string;
    created_at: string;
}

interface Analytics {
    totalTransactions: number;
    totalVolume: number; // Raw sum
    successRate: string;
    totalVisits: number;
    totalUniqueVisits: number;
    totalVolumeUSD: number;
    totalCommissionUSD: number;
}

export default function AdminDashboard() {
    const [section, setSection] = useState<"iptv" | "exchange" | "audience" | "metals">("iptv");
    const [refresh, setRefresh] = useState(0);
    const [exchangeError, setExchangeError] = useState(false);
    const [settingsAvailable, setSettingsAvailable] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [commission, setCommission] = useState<string>("0");
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const onUnauthorized = useCallback(() => window.location.replace("/admin/"), []);

    // Force sync a transaction from ChangeNOW or StealthEX
    const syncTransaction = async (id: string, externalId: string) => {
        setIsRefreshing(id);
        try {
            // Try ChangeNOW as the primary provider
            await fetch(`/api/changenow/transaction/${externalId}`);
            await fetchData();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsRefreshing(null);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        setExchangeError(false);
        setSettingsAvailable(false);
        try {
            // Check auth
            const res = await fetch("/api/admin/transactions");
            if (res.status === 401) {
                router.push("/admin");
                return;
            }
            if (!res.ok) throw new Error("Exchange data unavailable");
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
                setAnalytics(data.analytics);

            } else {
                setExchangeError(true);
            }

            // Fetch Config
            const configRes = await fetch("/api/admin/config");
            if (!configRes.ok) throw new Error("Commission settings unavailable");
            const configData = await configRes.json();
            if (configData.commission_percentage !== undefined) {
                setCommission(configData.commission_percentage.toString());
                setSettingsAvailable(true);
            }

        } catch (error) {
            setExchangeError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateCommission = async () => {
        setIsSaving(true);
        try {
            const val = parseFloat(commission);
            if (!Number.isFinite(val) || val < 0) {
                alert("Invalid commission value");
                return;
            }
            const res = await fetch("/api/admin/config", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commission_percentage: val })
            });
            if (res.ok) {
                alert("Commission updated successfully");
            } else {
                alert("Failed to update commission");
            }
        } catch (error) {
            console.error("Error saving commission", error);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (section === "exchange") void fetchData();
    }, [section, refresh]);

    const handleLogout = async () => {
        await fetch('/api/admin/logout', {method:'POST'}).catch(()=>{});
        router.push("/admin");
    };

    const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const views = [
        { id: "iptv", label: "IPTV analytics", Icon: Tv },
        { id: "exchange", label: "Exchange", Icon: ArrowLeftRight },
        { id: "audience", label: "Visitor geography", Icon: Globe },
        { id: "metals", label: "Metals blog", Icon: FileText },
    ] as const;

    return (
        <div className="admin-dashboard">
            <aside className="admin-nav">
                <a className="admin-brand" href="/"><img src="/assets/plasmax-mark.svg" alt="" width="36" height="36" /><span>PlasmaX Admin</span></a>
                <nav aria-label="Admin sections">
                    {views.map(({ id, label, Icon }) => <button key={id} type="button"
                        aria-current={section === id ? "page" : undefined}
                        onClick={() => setSection(id)}><Icon size={18} aria-hidden="true" />{label}</button>)}
                </nav>
            </aside>
            <div className="admin-content">
                <div className="admin-toolbar">
                    <a href="/">Open player</a>
                    <button type="button" onClick={() => setRefresh(n => n + 1)} disabled={section === "exchange" && isLoading}><RefreshCcw size={16} aria-hidden="true" />Refresh</button>
                    <button type="button" onClick={handleLogout}><LogOut size={16} aria-hidden="true" />Sign out</button>
                </div>

                {section === "iptv" && <IptvOverview refresh={refresh} onUnauthorized={onUnauthorized} />}
                {section === "metals" && <PreciousBlog />}
                {section === "audience" && <section>
                    <div className="admin-section-head"><div><h1>Visitor geography</h1><p>Explore Exchange visitor locations by day, week, or all time.</p></div></div>
                    <div className="admin-panel admin-audience-panel"><VisitorMap key={refresh} /></div>
                </section>}
                {section === "exchange" && <section>
                    <div className="admin-section-head"><div><h1>Exchange</h1><p>Monitor transactions and manage commission.</p></div></div>
                    {isLoading && <p role="status" className="admin-notice">Loading Exchange data…</p>}
                    {exchangeError && <p role="status" className="admin-notice">Some Exchange data couldn’t load. Use Refresh to try again.</p>}
                    {analytics && <dl className="admin-totals admin-exchange-totals">
                        <div><dt>Transactions</dt><dd>{analytics.totalTransactions.toLocaleString()}</dd></div>
                        <div><dt>Exchange visits</dt><dd>{analytics.totalVisits.toLocaleString()}</dd><small>{analytics.totalUniqueVisits.toLocaleString()} unique</small></div>
                        <div><dt>Success rate</dt><dd>{analytics.successRate}%</dd></div>
                        <div><dt>Estimated volume</dt><dd>{currency.format(analytics.totalVolumeUSD || 0)}</dd></div>
                        <div><dt>Commission earned</dt><dd>{currency.format(analytics.totalCommissionUSD || 0)}</dd></div>
                    </dl>}
                    <section className="admin-panel">
                        <div className="admin-panel-head"><h2><SlidersHorizontal size={17} aria-hidden="true" />Commission</h2></div>
                        <div className="admin-commission">
                            <div><label htmlFor="exchange-commission">Commission (%)</label><Input id="exchange-commission" type="number" min="0" step="0.1" value={commission} disabled={!settingsAvailable} onChange={event => setCommission(event.target.value)} /></div>
                            <Button onClick={handleUpdateCommission} disabled={isSaving || !settingsAvailable}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save</Button>
                        </div>
                    </section>
                    <section className="admin-panel admin-transactions">
                        <div className="admin-panel-head"><h2>Recent transactions</h2></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-left">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Date</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">ID</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Pair</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Amount</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Address</th>
                                    <th className="px-6 py-3 font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{tx.stealthex_id || tx.changenow_id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-bold uppercase">
                                                <span>{tx.from_currency}</span>
                                                <span className="text-muted-foreground">→</span>
                                                <span>{tx.to_currency}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>{Number(tx.from_amount).toFixed(4)} <span className="text-xs text-muted-foreground uppercase">{tx.from_currency}</span></div>
                                            <div className="text-xs text-muted-foreground">≈ {Number(tx.to_amount).toFixed(4)} <span className="uppercase">{tx.to_currency}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${tx.status === 'finished' || tx.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                                    tx.status === 'failed' || tx.status === 'expired' || tx.status === 'refunded' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-blue-500/10 text-blue-500'}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate font-mono text-xs text-muted-foreground" title={tx.payout_address}>
                                            {tx.payout_address}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-white"
                                                onClick={() => syncTransaction(tx.id, (tx.stealthex_id || tx.changenow_id) as string)}
                                                disabled={isRefreshing === tx.id || !(tx.stealthex_id || tx.changenow_id)}
                                                title="Sync Status"
                                            >
                                                <RefreshCcw className={`w-4 h-4 ${isRefreshing === tx.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                            No transactions found yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    </section>
                </section>}
            </div>
        </div>
    );
}
