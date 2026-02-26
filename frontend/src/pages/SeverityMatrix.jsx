import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertOctagon, Loader2, XCircle, CheckCircle, ChevronDown, Globe,
    Search, Download, Filter, FileText, ArrowRight, ShieldAlert, Cpu,
    Zap, Link, Clock, User, Target, BarChart2, CheckSquare, Maximize2, RefreshCw
} from 'lucide-react';
import { API_BASE } from '../services/config';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const SEV = {
    critical: { color: '#ef4444', bg: '#fee2e2', label: 'CRITICAL', icon: AlertOctagon },
    high: { color: '#f97316', bg: '#fff7ed', label: 'HIGH', icon: ShieldAlert },
    medium: { color: '#f59e0b', bg: '#fefce8', label: 'MEDIUM', icon: Target },
    low: { color: '#10b981', bg: '#ecfdf5', label: 'LOW', icon: CheckSquare },
};

const SRC_ICONS = { Functional: Cpu, Network: Zap, DOM: Link, Unknown: FileText };

function ScoreBar({ value, max = 100, color }) {
    return (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
            <motion.div className="h-full rounded-full" style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
    );
}

// ─── DEFECT SIDE PANEL ────────────────────────────────────────────────────────
const DefectPanel = ({ defect, onClose }) => {
    if (!defect) return null;
    const s = SEV[defect.severity] || SEV.low;
    const Icon = SRC_ICONS[defect.source] || SRC_ICONS.Unknown;

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
                onClick={onClose}
            />
            <motion.div
                initial={{ x: '100%', boxShadow: '-10px 0 30px rgba(0,0,0,0)' }}
                animate={{ x: 0, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-[500px] bg-white z-50 flex flex-col border-l border-slate-100 overflow-hidden"
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-[#f8fafc]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight">Defect Details</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{defect.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
                        <XCircle size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Header Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest" style={{ background: s.bg, color: s.color }}>
                                {s.label} SEVERITY
                            </span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-slate-100 text-slate-500 flex items-center gap-1">
                                <Icon size={10} /> {defect.source}
                            </span>
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2">{defect.title}</h2>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {defect.description}
                        </p>
                    </div>

                    {/* Breakdown Metrics */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Risk & Scoring Vectors</h4>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            {[
                                { l: 'Composite Score', v: defect.score, max: 100, c: s.color },
                                { l: 'Impact Velocity', v: defect.impact, max: 5, c: '#6366f1' },
                                { l: 'Business Risk', v: defect.businessValue, max: 5, c: '#0ea5e9' },
                                { l: 'Reproducibility', v: defect.reproducibility, max: 5, c: '#8b5cf6' },
                            ].map(m => (
                                <div key={m.l}>
                                    <div className="flex justify-between mb-1">
                                        <p className="text-[10px] text-slate-500 font-semibold">{m.l}</p>
                                        <p className="text-[10px] font-black text-slate-800">{m.v}/{m.max}</p>
                                    </div>
                                    <ScoreBar value={m.v} max={m.max} color={m.c} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Page Context */}
                    <div>
                        <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Location & Context</h4>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                <Globe size={14} className="text-blue-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">Affected URL</p>
                                    <a href={defect.page} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-700 hover:underline break-all">
                                        {defect.page}
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <Target size={14} className="text-slate-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Component / Node</p>
                                    <p className="text-sm font-semibold text-slate-700">{defect.component}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <Clock size={14} className="text-slate-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Detected At</p>
                                    <p className="text-sm font-semibold text-slate-700">{new Date(defect.detectedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remediation */}
                    {defect.suggestions?.length > 0 && (
                        <div>
                            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">AI Remediation Hints</h4>
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
                                {defect.suggestions.map((s, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <ArrowRight size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <p className="text-sm text-emerald-800 font-medium">{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function DefectScoring() {
    const { targetUrl: url, isScanning, scanResult } = useScanContext();
    const [matrix, setMatrix] = useState(null);
    const [loading, setLoad] = useState(false);
    const [error, setError] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [filterSev, setFilterSev] = useState('all');
    const [filterSrc, setFilterSrc] = useState('all');
    const [selectedDefect, setSelectedDefect] = useState(null);

    const prevUrlRef = useRef(url);

    // Dynamic fetch
    const fetchMatrix = useCallback(async () => {
        if (!url) return;
        setLoad(true); setError(null);
        try {
            const params = url ? `?url=${encodeURIComponent(url)}` : '';
            const res = await fetch(`${API_BASE}/api/severity/matrix${params}`);
            const d = await res.json();
            if (d.success) {
                setMatrix(d.matrix);
            } else {
                setError(d.error);
            }
        } catch (err) { setError(err.message); }
        finally { setLoad(false); }
    }, [url]);

    useEffect(() => {
        // Fetch on mount or when URL changes
        if (url) {
            fetchMatrix();
        } else {
            setMatrix(null);
        }
    }, [url, fetchMatrix]);

    // Live polling during active scan
    useEffect(() => {
        if (!isScanning || !url) return;
        const interval = setInterval(() => {
            fetchMatrix();
        }, 3000);
        return () => clearInterval(interval);
    }, [isScanning, url, fetchMatrix]);

    // Keyboard bindings
    useEffect(() => {
        const handleKd = (e) => {
            if (e.key === 'Escape' && selectedDefect) setSelectedDefect(null);
        };
        window.addEventListener('keydown', handleKd);
        return () => window.removeEventListener('keydown', handleKd);
    }, [selectedDefect]);

    const activeMatrix = useMemo(() => {
        let list = matrix?.defects ? [...matrix.defects] : [];

        // Merge in Global Scan Context defects
        if (scanResult?.pages) {
            scanResult.pages.forEach(p => {
                if (p.issues) {
                    p.issues.forEach((iss, i) => {
                        const score = iss.severity === 'Critical' ? 95 : iss.severity === 'High' ? 65 : iss.severity === 'Medium' ? 40 : 15;
                        list.push({
                            id: `global_${p.id}_${i}`,
                            source: 'Discovery',
                            title: iss.title || iss.ruleId || 'System Issue',
                            description: iss.description || iss.failureSummary || 'No description provided',
                            page: p.url,
                            component: iss.element?.selector || 'Page',
                            category: iss.impact || 'Global',
                            impact: 4, businessValue: 3, reproducibility: 5, fixEffort: 3,
                            score,
                            severity: iss.severity?.toLowerCase() || 'low',
                            suggestions: iss.helpUrl ? [iss.helpUrl] : [],
                            detectedAt: new Date().toISOString()
                        });
                    });
                }
            });
        }

        // Deduplicate
        const unique = [];
        const seen = new Set();
        list.forEach(d => {
            const key = d.page + d.title;
            if (!seen.has(key)) { seen.add(key); unique.push(d); }
        });
        list = unique.sort((a, b) => b.score - a.score);

        const bySev = { critical: 0, high: 0, medium: 0, low: 0 };
        const bySrc = { Functional: 0, Network: 0, DOM: 0, Discovery: 0 };

        list.forEach(d => {
            if (bySev[d.severity] !== undefined) bySev[d.severity]++;
            if (bySrc[d.source] !== undefined) bySrc[d.source]++;
            else bySrc.Unknown = (bySrc.Unknown || 0) + 1;
        });

        return {
            defects: list,
            total: list.length,
            bySeverity: bySev,
            bySource: bySrc,
        };
    }, [matrix, scanResult]);

    const trendData = useMemo(() => {
        if (!activeMatrix) return [];
        const trends = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toLocaleDateString(undefined, { weekday: 'short' });

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // For a dynamic graph, we sum all defects active up to that day
            const cumulative = activeMatrix.defects ? activeMatrix.defects.filter(d => new Date(d.detectedAt) <= endOfDay).length : 0;

            trends.push({
                time: dateStr,
                defects: cumulative,
                fixed: 0
            });
        }
        return trends;
    }, [activeMatrix]);

    const defects = useMemo(() => {
        if (!activeMatrix?.defects) return [];
        return activeMatrix.defects.filter(d => {
            if (filterSev !== 'all' && d.severity !== filterSev) return false;
            if (filterSrc !== 'all' && d.source !== filterSrc) return false;
            if (globalSearch) {
                const q = globalSearch.toLowerCase();
                return d.title.toLowerCase().includes(q) || d.page.toLowerCase().includes(q) || d.component.toLowerCase().includes(q);
            }
            return true;
        });
    }, [activeMatrix, filterSev, filterSrc, globalSearch]);

    const handleExport = () => {
        const csv = [
            ['ID', 'Title', 'Severity', 'Score', 'Source', 'URL', 'Detected'],
            ...defects.map(d => [d.id, `"${d.title}"`, d.severity, d.score, d.source, `"${d.page}"`, d.detectedAt])
        ].map(r => r.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `defects-${new Date().getTime()}.csv`;
        a.click();
    };

    const pieData = useMemo(() => {
        if (!activeMatrix) return [];
        return ['critical', 'high', 'medium', 'low'].map(k => ({
            name: SEV[k].label,
            value: activeMatrix.bySeverity[k] || 0,
            color: SEV[k].color
        })).filter(d => d.value > 0);
    }, [activeMatrix]);

    const barData = useMemo(() => {
        if (!activeMatrix) return [];
        return Object.keys(activeMatrix.bySource).map(k => ({
            name: k,
            value: activeMatrix.bySource[k] || 0
        }));
    }, [activeMatrix]);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc] font-sans">
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center justify-between gap-4 z-10 sticky top-0">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <AlertOctagon size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">Defect Scoring & Triage</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{url ? new URL(url).hostname : 'No active target'}</p>
                    </div>
                </div>



                <div className="flex items-center gap-3">
                    <button onClick={fetchMatrix} className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl transition-all" title="Refresh">
                        <RefreshCw size={16} className={loading || isScanning ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">
                        <Download size={14} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
                {loading && !matrix && (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <p className="text-sm font-bold text-slate-500 animate-pulse">Computing Matrix Topology...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <XCircle size={32} className="text-red-400 mb-2" />
                        <p className="text-red-600 font-black text-lg">Failed to build matrix</p>
                        <p className="text-sm text-red-500/80 font-medium">{error}</p>
                    </div>
                )}

                {(activeMatrix && (!loading || activeMatrix.defects.length > 0)) && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-[1600px] mx-auto">

                        {/* ── METRIC CARDS ───────────────────────────── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { k: 'critical', title: 'Critical Risk', val: activeMatrix.bySeverity.critical || 0 },
                                { k: 'high', title: 'High Priority', val: activeMatrix.bySeverity.high || 0 },
                                { k: 'medium', title: 'Moderate Flaws', val: activeMatrix.bySeverity.medium || 0 },
                                { k: 'low', title: 'Low Priority', val: activeMatrix.bySeverity.low || 0 },
                            ].map(m => {
                                const s = SEV[m.k];
                                const isFilter = filterSev === m.k;
                                return (
                                    <div key={m.k} onClick={() => setFilterSev(isFilter ? 'all' : m.k)}
                                        className={`bg-white rounded-2xl border cursor-pointer hover:shadow-lg transition-all p-5 relative overflow-hidden group ${isFilter ? 'ring-2 shadow-md' : 'border-slate-100 shadow-sm'}`}
                                        style={{ ringColor: s.color }}>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-full -mr-8 -mt-8 pointer-events-none transition-transform group-hover:scale-110" style={{ backgroundImage: `linear-gradient(to bottom right, transparent, ${s.color})` }} />
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: s.bg, color: s.color }}>
                                                <s.icon size={16} />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{m.title}</p>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <p className="text-4xl font-black text-slate-800">{m.val}</p>
                                            <p className="text-xs font-bold mb-1.5" style={{ color: s.color }}>
                                                {Math.round((m.val / (activeMatrix.total || 1)) * 100)}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── VISUALIZATIONS ─────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Trend Graph */}
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <BarChart2 size={16} className="text-indigo-500" /> Discovery Trend
                                </h3>
                                <div className="flex-1 min-h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 700, fontSize: 12 }}
                                            />
                                            <Line type="monotone" dataKey="defects" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Detected" />
                                            <Line type="monotone" dataKey="fixed" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Resolved" strokeDasharray="5 5" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Donut Chart */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Target size={16} className="text-indigo-500" /> Breakdown
                                </h3>
                                <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <p className="text-3xl font-black text-slate-800">{activeMatrix.total}</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                                    </div>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                                {pieData.map((e, index) => <Cell key={`cell-${index}`} fill={e.color} />)}
                                            </Pie>
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* ── DEFECT TABLE ───────────────────────────── */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Intelligence Queue</h2>
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-black">{defects.length} items</span>
                                </div>

                                {/* Source Filters */}
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                    {['all', 'Functional', 'Network', 'DOM', 'Discovery'].map(src => {
                                        const active = filterSrc === src;
                                        const Icon = src !== 'all' ? (SRC_ICONS[src] || SRC_ICONS.Unknown) : Filter;
                                        return (
                                            <button key={src} onClick={() => setFilterSrc(src)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${active ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                                <Icon size={12} /> {src}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                                            <th className="px-6 py-4 font-semibold">Defect Signature</th>
                                            <th className="px-6 py-4 font-semibold">Vector / Source</th>
                                            <th className="px-6 py-4 font-semibold">Severity</th>
                                            <th className="px-6 py-4 font-semibold">Score</th>
                                            <th className="px-6 py-4 font-semibold text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-50">
                                        {defects.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                    <CheckCircle size={32} className="mx-auto text-emerald-400 mb-3" />
                                                    <p className="font-bold">No defects match your criteria.</p>
                                                    <p className="text-xs">System architecture is clean under current filters.</p>
                                                </td>
                                            </tr>
                                        ) : defects.map((d) => {
                                            const s = SEV[d.severity];
                                            const SIcon = s.icon;
                                            return (
                                                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedDefect(d)}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-slate-800 line-clamp-1">{d.title}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[300px]">{d.page}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                                                                {React.createElement(SRC_ICONS[d.source] || SRC_ICONS.Unknown, { size: 12 })}
                                                            </span>
                                                            <span className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{d.component}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 border px-2.5 py-1 rounded-md w-max" style={{ borderColor: `${s.color}30`, background: `${s.color}10`, color: s.color }}>
                                                            <SIcon size={12} strokeWidth={3} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3 w-32">
                                                            <span className="font-black text-slate-700 w-6">{d.score}</span>
                                                            <ScoreBar value={d.score} max={100} color={s.color} />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">
                                                            <Maximize2 size={14} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </motion.div>
                )}
            </div>

            {/* Side Panel Overlay */}
            <AnimatePresence>
                {selectedDefect && <DefectPanel defect={selectedDefect} onClose={() => setSelectedDefect(null)} />}
            </AnimatePresence>
        </div>
    );
}
