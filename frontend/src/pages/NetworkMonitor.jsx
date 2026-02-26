import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Globe, Loader, XCircle, ChevronDown, ChevronRight,
    Filter, Clock, AlertTriangle, CheckCircle, Ban, Zap,
    Server, Database, Shield, BarChart2, Wifi, X, Copy, ChevronUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { API_BASE } from '../services/config';

// ─── Config ───────────────────────────────────────────────────────────────────

const METHOD_COLORS = {
    GET: { bg: '#e0f2fe', text: '#0284c7' },
    POST: { bg: '#d1fae5', text: '#065f46' },
    PUT: { bg: '#fef3c7', text: '#92400e' },
    PATCH: { bg: '#ede9fe', text: '#5b21b6' },
    DELETE: { bg: '#fee2e2', text: '#991b1b' },
    OPTIONS: { bg: '#f1f5f9', text: '#475569' },
};

const statusColor = (s) => {
    if (!s || s === 0) return { bg: '#f1f5f9', text: '#94a3b8' };
    if (s < 300) return { bg: '#d1fae5', text: '#065f46' };
    if (s < 400) return { bg: '#fef3c7', text: '#92400e' };
    if (s < 500) return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#fce7f3', text: '#9d174d' };
};

const durationColor = (ms) => ms > 3000 ? '#ef4444' : ms > 1000 ? '#f59e0b' : '#10b981';

const CLUSTER_ICONS = {
    Auth: '🔐', API: '⚡', Static: '📦', Media: '🖼️', Analytics: '📊', CDN: '🌐', WebSocket: '🔌', GraphQL: '🔷', Other: '🔗',
};

const CLUSTER_COLORS = {
    Auth: '#8b5cf6', API: '#0ea5e9', Static: '#94a3b8', Media: '#f59e0b',
    Analytics: '#ec4899', CDN: '#10b981', WebSocket: '#f97316', GraphQL: '#6366f1', Other: '#64748b',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MethodBadge({ method }) {
    const c = METHOD_COLORS[method] || { bg: '#f1f5f9', text: '#475569' };
    return (
        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide" style={{ background: c.bg, color: c.text }}>
            {method}
        </span>
    );
}

function StatusBadge({ status }) {
    const c = statusColor(status);
    return (
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ background: c.bg, color: c.text }}>
            {status || '—'}
        </span>
    );
}

function TimingBar({ duration, max }) {
    const pct = Math.min(100, (duration / Math.max(max, 1)) * 100);
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-1.5 rounded-full" style={{ background: durationColor(duration) }}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
            </div>
            <span className="text-[10px] font-black whitespace-nowrap" style={{ color: durationColor(duration) }}>
                {duration >= 1000 ? (duration / 1000).toFixed(1) + 's' : duration + 'ms'}
            </span>
        </div>
    );
}

function IssueBadge({ issues }) {
    if (!issues || issues.length === 0) return <CheckCircle size={12} className="text-green-400" />;
    const sev = issues.some(i => i.severity === 'error') ? 'error' : 'warn';
    return (
        <div className="flex items-center gap-1">
            {sev === 'error'
                ? <XCircle size={12} className="text-red-400" />
                : <AlertTriangle size={12} className="text-amber-400" />}
            <span className="text-[9px] font-bold text-slate-500">{issues.length}</span>
        </div>
    );
}

function RequestRow({ req, maxDuration, isExpanded, onToggle }) {
    const [copied, setCopied] = useState(false);
    const copyUrl = () => { navigator.clipboard.writeText(req.url); setCopied(true); setTimeout(() => setCopied(false), 1400); };

    return (
        <>
            <tr onClick={onToggle}
                className={`border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors text-xs ${isExpanded ? 'bg-indigo-50/40' : ''}`}>
                <td className="py-2.5 pl-3 pr-1">
                    <ChevronRight size={11} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </td>
                <td className="px-2 py-2.5">
                    <IssueBadge issues={req.issues} />
                </td>
                <td className="px-2 py-2.5 max-w-[200px]">
                    <p className="font-mono text-[10px] text-slate-700 truncate" title={req.url}>{req.shortUrl || req.url}</p>
                    <p className="text-[9px] text-slate-400 truncate max-w-[180px]" title={req.url}>{(() => { try { return new URL(req.url).hostname; } catch { return ''; } })()}</p>
                </td>
                <td className="px-2 py-2.5"><MethodBadge method={req.method} /></td>
                <td className="px-2 py-2.5"><StatusBadge status={req.status} /></td>
                <td className="px-2 py-2.5"><TimingBar duration={req.duration} max={maxDuration} /></td>
                <td className="px-2 py-2.5 text-[10px] text-slate-500 font-semibold whitespace-nowrap">{req.sizeKb} KB</td>
                <td className="px-2 py-2.5">
                    <span className="text-[9px] font-bold" style={{ color: CLUSTER_COLORS[req.cluster] || '#64748b' }}>
                        {CLUSTER_ICONS[req.cluster] || '🔗'} {req.cluster}
                    </span>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={8} className="px-0 pb-0 bg-indigo-50/30 border-b border-indigo-100">
                        <div className="px-8 py-3 grid grid-cols-3 gap-4">
                            {/* Issues */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Issues ({req.issues?.length || 0})</p>
                                {req.issues?.length > 0 ? req.issues.map((iss, i) => (
                                    <div key={i} className="flex items-center gap-1.5 mb-1">
                                        {iss.severity === 'error' ? <XCircle size={10} className="text-red-400 shrink-0" /> : <AlertTriangle size={10} className="text-amber-400 shrink-0" />}
                                        <span className="text-[10px] text-slate-600 font-medium">{iss.msg}</span>
                                    </div>
                                )) : <p className="text-[10px] text-green-600 font-bold flex items-center gap-1"><CheckCircle size={10} />No issues</p>}
                            </div>
                            {/* Request headers */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Request Headers</p>
                                <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                    {Object.entries(req.requestHeaders || {}).slice(0, 6).map(([k, v]) => (
                                        <div key={k} className="flex gap-1.5 text-[9px]">
                                            <span className="font-bold text-slate-500 shrink-0 w-20 truncate">{k}</span>
                                            <span className="text-slate-400 truncate">{String(v).slice(0, 40)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Full URL + copy */}
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Full URL</p>
                                <div className="flex items-start gap-1.5">
                                    <code className="text-[9px] text-slate-600 break-all leading-relaxed flex-1">{req.url}</code>
                                    <button onClick={copyUrl} className="p-1 rounded hover:bg-white shrink-0">
                                        {copied ? <CheckCircle size={10} className="text-green-500" /> : <Copy size={10} className="text-slate-400" />}
                                    </button>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-1 text-[9px]">
                                    <div className="bg-white rounded-lg p-1.5"><p className="text-slate-400">Type</p><p className="font-bold text-slate-600">{req.resourceType || '—'}</p></div>
                                    <div className="bg-white rounded-lg p-1.5"><p className="text-slate-400">MIME</p><p className="font-bold text-slate-600 truncate">{req.mimeType?.split(';')[0] || '—'}</p></div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function NetworkMonitor() {
    const { targetUrl: url, isScanning: globalScanning } = useScanContext();
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ phase: '', pct: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');   // all | error | slow | blocked
    const [cluster, setCluster] = useState('all');
    const [expanded, setExpanded] = useState(null);
    const [searchQ, setSearchQ] = useState('');

    const prevUrlRef = useRef(url);
    // Clear results when a global scan starts
    useEffect(() => {
        if (globalScanning) {
            setResult(null);
            setError(null);
            setExpanded(null);
            setSearchQ('');
        }
    }, [globalScanning]);

    // Reset state when target URL changes
    useEffect(() => {
        if (prevUrlRef.current !== url) {
            setResult(null);
            setError(null);
            setExpanded(null);
            setSearchQ('');
            prevUrlRef.current = url;
        }
    }, [url]);

    // Auto-run monitor when URL is present and no results exist
    useEffect(() => {
        if (url && !result && !running && !error && !globalScanning) {
            handleMonitor();
        }
    }, [url, result, running, error, globalScanning]);

    const handleMonitor = async () => {
        if (!url) return;
        setRunning(true); setResult(null); setError(null); setExpanded(null);
        setProgress({ phase: 'starting', pct: 5 });

        try {
            const res = await fetch(`${API_BASE}/api/network/monitor`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url })
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const ev = JSON.parse(line.slice(6));
                        if (ev.type === 'progress') setProgress({ phase: ev.phase, pct: ev.pct });
                        if (ev.type === 'result') setResult(ev.result);
                        if (ev.type === 'error') setError(ev.message);
                    } catch { }
                }
            }
        } catch (err) { setError(err.message); }
        finally { setRunning(false); }
    };

    const filtered = useMemo(() => {
        if (!result?.requests) return [];
        return result.requests.filter(r => {
            const matchFilter = filter === 'all' || (filter === 'error' && (r.status >= 400 || r.failed)) ||
                (filter === 'slow' && r.duration >= 3000) || (filter === 'blocked' && (r.status === 403 || r.status === 401));
            const matchCluster = cluster === 'all' || r.cluster === cluster;
            const matchSearch = !searchQ || r.url.toLowerCase().includes(searchQ.toLowerCase());
            return matchFilter && matchCluster && matchSearch;
        });
    }, [result, filter, cluster, searchQ]);

    const maxDuration = useMemo(() => Math.max(...(filtered.map(r => r.duration || 0)), 1), [filtered]);

    const clusterPie = useMemo(() => result?.clusters?.map(c => ({
        name: c.name, value: c.count, color: CLUSTER_COLORS[c.name] || '#64748b'
    })) || [], [result]);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                        <Activity size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Network Monitor</p>
                        <p className="text-[10px] text-slate-400 font-semibold">CDP intercept · Request analysis</p>
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-100 mx-1 hidden md:block" />
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
                    <Globe size={13} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-mono text-slate-700 truncate">{url || <span className="text-slate-400 italic">No active scan URL…</span>}</span>
                </div>
                {running && (
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black">
                        <Loader size={13} className="animate-spin" />{progress.phase}…
                    </div>
                )}
                {error && <div className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><XCircle size={11} />{error.slice(0, 55)}</div>}
            </div>

            {/* Progress */}
            {running && (
                <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                            animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 capitalize">{progress.phase}…</span>
                    <span className="text-[10px] text-slate-400">{progress.pct}%</span>
                </div>
            )}

            {/* Summary bar */}
            {result && !running && (
                <div className="px-6 pt-4 pb-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { l: 'Requests', v: result.total, c: '#6366f1', icon: Activity },
                        { l: 'Errors', v: result.errored, c: '#ef4444', icon: XCircle },
                        { l: 'Slow (>3s)', v: result.slow, c: '#f59e0b', icon: Clock },
                        { l: 'Blocked', v: result.blocked, c: '#8b5cf6', icon: Ban },
                        { l: 'Total Size', v: result.totalKb + 'KB', c: '#0ea5e9', icon: Database },
                        { l: 'Avg Time', v: result.avgDuration + 'ms', c: '#10b981', icon: Zap },
                    ].map(m => {
                        const Icon = m.icon;
                        return (
                            <div key={m.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.c + '22' }}>
                                    <Icon size={14} style={{ color: m.c }} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{m.l}</p>
                                    <p className="text-base font-black text-slate-900">{m.v}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cluster + filter row */}
            {result && !running && (
                <div className="px-6 pb-2 flex items-center gap-2 flex-wrap">
                    {/* Filter */}
                    <div className="flex gap-1">
                        {[{ id: 'all', l: 'All' }, { id: 'error', l: '⚠ Errors' }, { id: 'slow', l: '🐢 Slow' }, { id: 'blocked', l: '🚫 Blocked' }].map(f => (
                            <button key={f.id} onClick={() => setFilter(f.id)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${filter === f.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                {f.l}
                            </button>
                        ))}
                    </div>
                    <div className="w-px h-5 bg-slate-200 mx-1" />
                    {/* Cluster filter */}
                    <div className="flex gap-1 flex-wrap">
                        <button onClick={() => setCluster('all')}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${cluster === 'all' ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                            All Clusters
                        </button>
                        {result.clusters?.map(c => (
                            <button key={c.name} onClick={() => setCluster(cl => cl === c.name ? 'all' : c.name)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${cluster === c.name ? 'text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                                style={cluster === c.name ? { background: CLUSTER_COLORS[c.name] } : {}}>
                                {CLUSTER_ICONS[c.name]} {c.name} ({c.count})
                            </button>
                        ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <Filter size={11} className="text-slate-400" />
                        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                            placeholder="Filter URL…" className="text-xs bg-transparent outline-none w-32 text-slate-700" />
                    </div>
                </div>
            )}

            {/* Empty / Loading states */}
            {running && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            className="w-14 h-14 rounded-full border-4 border-purple-100 border-t-purple-500" />
                        <p className="text-slate-500 font-bold text-sm">Intercepting network requests…</p>
                        <p className="text-slate-400 text-xs">CDP active · Waiting for networkidle</p>
                    </div>
                </div>
            )}

            {!running && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center max-w-md text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-5">
                            <Activity size={38} className="text-purple-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 mb-2">Network Monitor</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Enter a URL and click Monitor. Inspectra launches a headless Chrome with CDP enabled, intercepts every request, detects slow/failed/blocked endpoints, and groups them by cluster.
                        </p>
                        <div className="mt-6 flex gap-2 flex-wrap justify-center">
                            {['timeout > 3s', 'status 5xx', 'empty body', 'CORS blocked'].map((l, i) => (
                                <span key={i} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg shadow-sm">{l}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Requests table */}
            {result && !running && (
                <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 min-h-0">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
                        {/* Screenshot strip */}
                        {result.screenshot && (
                            <div className="border-b border-slate-100 shrink-0">
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Captured Page</span>
                                    <span className="text-[9px] text-slate-400 font-mono truncate">{result.title}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="w-6" />
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-10">Issues</th>
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Endpoint</th>
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Method</th>
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-14">Status</th>
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-32">Time</th>
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-16">Size</th>
                                        <th className="px-2 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider w-24">Cluster</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((req, i) => (
                                        <RequestRow key={i} req={req} maxDuration={maxDuration}
                                            isExpanded={expanded === i}
                                            onToggle={() => setExpanded(v => v === i ? null : i)} />
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="flex items-center justify-center py-16 text-slate-400">
                                    <p className="text-sm font-semibold">No requests match the current filter</p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-100 px-4 py-2 shrink-0 flex items-center gap-4">
                            <span className="text-[10px] text-slate-400 font-semibold">{filtered.length} of {result.total} requests</span>
                            {filtered.length < result.total && (
                                <span className="text-[9px] text-indigo-500 font-bold">{result.total - filtered.length} hidden by filter</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
