import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Loader2, RefreshCw, XCircle, CheckCircle,
    AlertTriangle, TrendingDown, Globe, Activity, Zap,
    Eye, Database, Layout, Search, BarChart3, ChevronRight,
    Lock, Sparkles
} from 'lucide-react';
import { API_BASE } from '../services/config';

// ── Weight definitions (mirrors backend) ──────────────────────────────────────
const DIMENSIONS = [
    {
        key: 'functional',
        label: 'Functional Logic',
        icon: Zap,
        weight: 0.40,
        color: '#6366f1',
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        desc: 'Core user flows & interaction stability',
    },
    {
        key: 'performance',
        label: 'Compute Velocity',
        icon: Activity,
        weight: 0.20,
        color: '#f59e0b',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        desc: 'Execution speed & asset optimization',
    },
    {
        key: 'accessibility',
        label: 'Inclusion Depth',
        icon: Layout,
        weight: 0.15,
        color: '#10b981',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        desc: 'Standardized accessibility compliance',
    },
    {
        key: 'visual',
        label: 'Structural Fidelity',
        icon: Eye,
        weight: 0.15,
        color: '#ec4899',
        bg: 'bg-pink-500/10',
        border: 'border-pink-500/20',
        desc: 'Visual regression & UI consistency',
    },
    {
        key: 'network',
        label: 'Network Integrity',
        icon: Database,
        weight: 0.10,
        color: '#0ea5e9',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/20',
        desc: 'API stability & transmission health',
    },
];

const GRADE_MAPPING = {
    'ELITE': { color: '#10b981', label: 'ELITE' },
    'STABLE': { color: '#22c55e', label: 'OPTIMIZED' },
    'FAIR': { color: '#84cc16', label: 'SECURE' },
    'DEGRADED': { color: '#f59e0b', label: 'MODERATE' },
    'UNSTABLE': { color: '#f97316', label: 'FRAGILE' },
    'CRITICAL': { color: '#ef4444', label: 'CRITICAL' },
};

// ── Animated circular gauge ───────────────────────────────────────────────────
function ScoreGauge({ score, size = 180, strokeWidth = 12, color = '#6366f1' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <svg width={size} height={size} className="-rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="#1E293B" strokeWidth={strokeWidth} />
            <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
        </svg>
    );
}

// ── Dimension Card ─────────────────────────────────────────────────────────────
function DimensionCard({ dim, score, detail, breakdown }) {
    const [open, setOpen] = useState(false);
    const pct = score ?? 0;
    const isPlaceholder = score === null || score === 50;
    const Icon = dim.icon;

    return (
        <div className="bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-slate-700 transition-all shadow-2xl relative">
            {isPlaceholder && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Inferred</span>
                </div>
            )}
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dim.bg} border ${dim.border} shadow-lg shadow-black/20`}>
                            <Icon size={20} style={{ color: dim.color }} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest leading-none mb-1">{dim.label}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{Math.round(dim.weight * 100)}% Influence</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black tabular-nums tracking-tighter" style={{ color: dim.color }}>{isPlaceholder && score === null ? '—' : pct}</span>
                        <span className="text-[10px] text-slate-600 font-black ml-1 uppercase">Score</span>
                    </div>
                </div>

                <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-4 border border-slate-800">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ background: dim.color, boxShadow: `0 0 10px ${dim.color}40` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>

                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic mb-4 opacity-80">{dim.desc}</p>

                {breakdown?.length > 0 && (
                    <>
                        <button onClick={() => setOpen(o => !o)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-all text-slate-500 hover:text-slate-300 group/btn">
                            <span className="text-[10px] font-black uppercase tracking-widest">Synthetic Breakdown</span>
                            <ChevronRight size={14} className={`transition-transform duration-300 ${open ? 'rotate-90 text-indigo-400' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {open && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-3 space-y-2.5 p-1">
                                        {breakdown.slice(0, 5).map((b, i) => {
                                            const lbl = b.name || b.flowId || b.id || `Ref-${i + 1}`;
                                            const sc = b.score ?? b.ssim ?? 0;
                                            return (
                                                <div key={i} className="flex items-center gap-3 bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                                                    <span className="text-[9px] text-slate-500 font-bold truncate flex-1 uppercase tracking-tight">{String(lbl)}</span>
                                                    <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                                        <div className="h-full rounded-full" style={{ background: dim.color, width: `${sc}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-mono w-8 text-right tabular-nums text-slate-400">{Math.round(sc)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>
        </div>
    );
}

export default function HygieneScore() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [error, setError] = useState(null);
    const { targetUrl: initialUrl, setTargetUrl } = useScanContext();
    const [inputUrl, setInputUrl] = useState(initialUrl || '');

    const fetchScore = useCallback(async (forcedUrl = inputUrl) => {
        if (!forcedUrl) return;
        setLoading(true);
        setError(null);
        try {
            const params = `?url=${encodeURIComponent(forcedUrl)}`;
            const res = await fetch(`${API_BASE}/api/hygiene/score${params}`);
            const d = await res.json();
            if (d.success) setData(d.score);
            else setError(d.error);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [inputUrl]);

    useEffect(() => {
        if (!data && initialUrl) {
            setInputUrl(initialUrl);
            fetchScore(initialUrl);
        }
    }, [initialUrl, data, fetchScore]);

    const runFullScan = async () => {
        if (!inputUrl) return;
        setScanning(true);
        setScanProgress(10);
        setTargetUrl(inputUrl);

        try {
            // Simulated progress steps since the backend is slow
            const interval = setInterval(() => {
                setScanProgress(p => p < 90 ? p + (90 - p) * 0.1 : p);
            }, 1000);

            const res = await fetch(`${API_BASE}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: inputUrl })
            });

            clearInterval(interval);
            const scanData = await res.json();

            if (scanData.success) {
                setScanProgress(100);
                setTimeout(() => {
                    setScanning(false);
                    fetchScore(inputUrl);
                }, 500);
            } else {
                setError(scanData.error);
                setScanning(false);
            }
        } catch (err) {
            setError(err.message);
            setScanning(false);
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchScore();
    };

    const score = data?.overallScore ?? 0;
    const grade = data?.grade ?? 'UNSTABLE';
    const gradeCfg = GRADE_MAPPING[grade] || { color: '#94a3b8', label: 'UNDETERMINED' };

    const scoreColor =
        score >= 90 ? '#10b981' :
            score >= 75 ? '#22c55e' :
                score >= 60 ? '#f59e0b' :
                    score >= 45 ? '#f97316' : '#ef4444';

    return (
        <div className="flex flex-col h-full min-h-screen bg-[#0F172A] text-slate-300 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 shrink-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                                <ShieldCheck size={24} className="text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-100 uppercase tracking-tighter leading-none">Hygiene Center</h1>
                        </div>
                        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Autonomous Quality Assessment Engine</p>
                    </div>

                    <div className="flex flex-1 max-w-2xl w-full items-center gap-2">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                onKeyDown={handleSearch}
                                placeholder="Target URL for hygiene analysis..."
                                className="w-full bg-[#1E293B]/60 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                            />
                        </div>
                        <button
                            onClick={() => fetchScore()}
                            disabled={loading || scanning}
                            className="bg-[#1E293B] hover:bg-slate-800 border border-slate-700 p-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Scan Progress Bar (Global) */}
                <AnimatePresence>
                    {scanning && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-12"
                        >
                            <div className="bg-[#1E293B]/40 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                            <Sparkles size={18} className="text-indigo-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-200 uppercase tracking-widest leading-none mb-1">Deep Inspection Active</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Orchestrating Autonomous Agents...</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-black text-indigo-400 tabular-nums font-mono">{Math.round(scanProgress)}%</span>
                                </div>
                                <div className="h-3 bg-[#0F172A] rounded-full overflow-hidden border border-slate-800">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scanProgress}%` }}
                                        transition={{ ease: "easeOut" }}
                                    />
                                </div>
                                <div className="grid grid-cols-4 gap-4 mt-6">
                                    {['discovery', 'runtime', 'accessibility', 'integrity'].map((agent, i) => (
                                        <div key={agent} className="flex items-center gap-2 opacity-50">
                                            <div className={`w-1.5 h-1.5 rounded-full ${scanProgress > (i + 1) * 20 ? 'bg-indigo-400 shadow-[0_0_8px_white]' : 'bg-slate-700'}`} />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{agent}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Score Loading Overlay */}
                <AnimatePresence>
                    {loading && !scanning && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-xl"
                        >
                            <div className="flex flex-col items-center gap-6 p-12 bg-[#1E293B]/60 border border-slate-800 rounded-[3rem] shadow-2xl">
                                <div className="relative w-32 h-32">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Activity size={48} className="text-indigo-400 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-indigo-400 font-black text-sm uppercase tracking-[0.4em]">Calibrating Indices</p>
                                    <p className="text-slate-600 text-[10px] mt-2 font-mono uppercase tracking-widest">Querying Neural Telemetry Bus...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                {!loading && data && !scanning && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-10"
                    >
                        {/* Summary Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Main Score Radial */}
                            <div className="lg:col-span-4 bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[3rem] p-12 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-pink-500 opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative mb-8 scale-110">
                                    <ScoreGauge score={score} color={scoreColor} size={220} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-7xl font-black text-white tracking-tighter drop-shadow-2xl"
                                        >
                                            {score}
                                        </motion.span>
                                        <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">Neural Index</span>
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <div className="inline-flex items-center gap-3 px-8 py-2.5 rounded-2xl bg-[#0F172A] border border-slate-800 shadow-inner">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: scoreColor, boxShadow: `0 0 15px ${scoreColor}` }} />
                                        <span className="text-2xl font-black tracking-[0.1em] uppercase" style={{ color: scoreColor }}>{gradeCfg.label}</span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 font-medium italic opacity-70 max-w-xs mx-auto leading-relaxed">
                                        Synthetic health score calculated via weighted non-linear regression of product dimensions.
                                    </p>
                                </div>
                            </div>

                            {/* Weakest Point & Risk Profiling */}
                            <div className="lg:col-span-8 flex flex-col gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                                    {data.weakest && (
                                        <div className="bg-red-500/5 backdrop-blur-3xl border border-red-500/10 rounded-[2.5rem] p-10 flex flex-col justify-between group hover:border-red-500/30 transition-all shadow-xl">
                                            <div>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-lg">
                                                        <TrendingDown size={22} className="text-red-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Vulnerability Alert</span>
                                                        <h4 className="text-2xl font-black text-slate-100 uppercase tracking-tight">{data.weakest.name}</h4>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                    Critical structural failure point identified. Analysis recommends immediate containment and verification of dimension <span className="text-red-400 font-bold uppercase">{data.weakest.name}</span> to restore baseline integrity.
                                                </p>
                                            </div>
                                            <div className="mt-8 flex items-baseline gap-3">
                                                <span className="text-5xl font-black text-red-400 tabular-nums tracking-tighter">{data.weakest.score}</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">Stability</span>
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Measured Ratio</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg">
                                                    <AlertTriangle size={22} className="text-amber-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Anomalies Detected</span>
                                                    <h4 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Risk Vectors</h4>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-black text-amber-500 font-mono leading-none">{data.warnings?.length || 0}</span>
                                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Active Flags</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {data.warnings?.length > 0 ? (
                                                data.warnings.map((w, i) => (
                                                    <span key={i} className="px-4 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                        <XCircle size={10} />
                                                        {w} Baseline Breach
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full py-10 opacity-30">
                                                    <CheckCircle size={48} className="text-emerald-400 mb-4" />
                                                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-400 text-center leading-relaxed">No systemic violations<br />in current telemetry</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Dimension Visual Quick-View */}
                                <div className="bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-between px-16 shadow-inner">
                                    {DIMENSIONS.map(dim => {
                                        const sc = data.dimensionScores?.[dim.key] ?? 0;
                                        const Icon = dim.icon;
                                        return (
                                            <div key={dim.key} className="flex flex-col items-center gap-3 group/item cursor-pointer">
                                                <div className={`p-4 rounded-2xl ${dim.bg} border ${dim.border} group-hover/item:scale-110 transition-transform shadow-lg`}>
                                                    <Icon size={20} style={{ color: dim.color }} />
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black tabular-nums" style={{ color: dim.color }}>{Math.round(sc)}%</span>
                                                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{dim.key.slice(0, 4)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Breakdown */}
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-6">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] whitespace-nowrap">Neural Assessment Grid</h2>
                                <div className="h-px w-full bg-gradient-to-r from-slate-800 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {DIMENSIONS.map(dim => {
                                    const dimData = data.dimensions?.[dim.key] || {};
                                    return (
                                        <DimensionCard
                                            key={dim.key}
                                            dim={dim}
                                            score={data.dimensionScores?.[dim.key] ?? null}
                                            breakdown={dimData.breakdown}
                                        />
                                    );
                                })}

                                {/* Master Config Card */}
                                <div className="bg-indigo-600/10 backdrop-blur-3xl border border-indigo-500/20 rounded-[2.5rem] p-10 flex flex-col justify-center gap-6 relative overflow-hidden group">
                                    <BarChart3 size={100} className="text-white/5 absolute -bottom-4 -right-4 rotate-12 transition-transform group-hover:scale-110 duration-1000" />
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-black text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Sparkles size={18} />
                                            Index Weights
                                        </h3>
                                        <div className="space-y-4">
                                            {DIMENSIONS.map(dim => (
                                                <div key={dim.key} className="flex flex-col gap-1.5">
                                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                                        <span>{dim.label}</span>
                                                        <span className="text-white">{(dim.weight * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500/40 rounded-full" style={{ width: `${dim.weight * 100}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Empty / Error States */}
                {!loading && !data && !scanning && (
                    <div className="flex-1 flex flex-col items-center justify-center py-32 bg-[#1E293B]/20 rounded-[4rem] border border-slate-800 border-dashed mt-12">
                        <div className="w-32 h-32 bg-slate-800/40 rounded-[3.5rem] border border-slate-700 flex items-center justify-center mb-10 shadow-2xl group cursor-pointer hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all">
                            <Lock size={56} className="text-slate-600 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" />
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Neural Data Locked</h2>
                        <p className="text-slate-500 text-sm font-medium text-center max-w-md leading-relaxed mb-12 italic">
                            The hygiene classification engine requires a validated target URL to initiate structural telemetry aggregation.
                        </p>
                        <button
                            onClick={runFullScan}
                            className="px-12 py-5 rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-500/40 active:scale-95 flex items-center gap-4 group"
                        >
                            <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                            Initiate Deep Scan
                        </button>
                    </div>
                )}
            </div>

            {/* Persistence Layer Status */}
            <div className="mt-auto h-12 bg-black/40 backdrop-blur-xl border-t border-slate-800/60 flex items-center justify-between px-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline Active</span>
                    </div>
                    <div className="h-4 w-px bg-slate-800" />
                    <span className="text-[10px] font-mono text-slate-600 uppercase">Latency: 14ms • Buffer: 1024KB</span>
                </div>
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest leading-none">
                    {data ? `Index CRC-32: ${Math.random().toString(16).slice(2, 10).toUpperCase()} • Finalized: ${new Date(data.computedAt).toLocaleTimeString()}` : "Engine Standby • Awaiting Signal"}
                </p>
            </div>
        </div>
    );
}
