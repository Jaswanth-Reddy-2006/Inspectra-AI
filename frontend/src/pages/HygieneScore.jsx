import React, { useState, useEffect, useCallback } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader, RefreshCw, XCircle, CheckCircle, AlertTriangle, TrendingDown, Globe } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// ── Weight definitions (mirrors backend) ──────────────────────────────────────
const DIMENSIONS = [
    {
        key: 'functional',
        label: 'Functional',
        icon: '⚙️',
        weight: 0.40,
        color: '#6366f1',
        bg: '#eef2ff',
        desc: 'Login, Add to Cart, Submit Form, Search flows',
    },
    {
        key: 'performance',
        label: 'Performance',
        icon: '⚡',
        weight: 0.20,
        color: '#f59e0b',
        bg: '#fef3c7',
        desc: 'LCP, CLS, TTI, FID – Core Web Vitals',
    },
    {
        key: 'accessibility',
        label: 'Accessibility',
        icon: '♿',
        weight: 0.15,
        color: '#10b981',
        bg: '#ecfdf5',
        desc: 'WCAG 2.1 axe-core violations & contrast',
    },
    {
        key: 'visual',
        label: 'Visual',
        icon: '👁️',
        weight: 0.15,
        color: '#ec4899',
        bg: '#fdf2f8',
        desc: 'SSIM regression, overflow, hidden buttons',
    },
    {
        key: 'network',
        label: 'Network',
        icon: '🌐',
        weight: 0.10,
        color: '#0ea5e9',
        bg: '#e0f2fe',
        desc: 'API errors, slow requests, blocked calls',
    },
];

// ── Grade config ──────────────────────────────────────────────────────────────
const GRADE = {
    'A+': { color: '#10b981', bg: '#ecfdf5', label: 'Excellent' },
    'A': { color: '#22c55e', bg: '#f0fdf4', label: 'Very Good' },
    'B': { color: '#84cc16', bg: '#f7fee7', label: 'Good' },
    'C': { color: '#f59e0b', bg: '#fef3c7', label: 'Fair' },
    'D': { color: '#f97316', bg: '#fff7ed', label: 'Needs Work' },
    'F': { color: '#ef4444', bg: '#fee2e2', label: 'Critical' },
};

// ── Animated circular gauge ───────────────────────────────────────────────────
function ScoreGauge({ score, size = 140, strokeWidth = 12, color = '#6366f1' }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke="#f1f5f9" strokeWidth={strokeWidth} />
            <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }} />
        </svg>
    );
}

// ── Dimension bar ─────────────────────────────────────────────────────────────
function DimensionBar({ dim, score, detail, breakdown }) {
    const [open, setOpen] = useState(false);
    const pct = score ?? 50;
    const isNull = score === null;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: dim.bg }}>
                        {dim.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <p className="text-sm font-black text-slate-800">{dim.label}</p>
                            <span className="text-[9px] font-bold text-slate-400">
                                {Math.round(dim.weight * 100)}% weight
                            </span>
                            {isNull && (
                                <span className="text-[9px] font-bold text-slate-400 ml-auto bg-slate-100 px-2 py-0.5 rounded-full">
                                    No data · using 50
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{dim.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-2xl font-black" style={{ color: dim.color }}>{pct}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">/ 100</p>
                    </div>
                </div>

                {/* Main bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <motion.div className="h-2 rounded-full" style={{ background: dim.color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }} />
                </div>

                {/* Sub-bars per breakdown */}
                {detail && (
                    <p className="text-[9px] text-slate-400 mt-1">{detail}</p>
                )}

                {breakdown?.length > 0 && (
                    <>
                        <button onClick={() => setOpen(o => !o)}
                            className="mt-2 text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                            {open ? '▲ hide' : '▼ view'} breakdown ({breakdown.length})
                        </button>
                        <AnimatePresence>
                            {open && (
                                <motion.div initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                                        {breakdown.slice(0, 6).map((b, i) => {
                                            const lbl = b.name || b.url || b.baseline || `Item ${i + 1}`;
                                            const sc = b.score ?? b.ssim ?? 0;
                                            return (
                                                <div key={i} className="flex items-center gap-2">
                                                    <p className="text-[9px] text-slate-500 truncate flex-1">{String(lbl).slice(0, 40)}</p>
                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                                        <div className="h-1 rounded-full" style={{ background: dim.color, width: `${sc}%` }} />
                                                    </div>
                                                    <p className="text-[9px] font-black w-7 text-right" style={{ color: dim.color }}>{sc}</p>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HygieneScore() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { targetUrl: url } = useTargetUrl();

    const fetch_ = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = url ? `?url=${encodeURIComponent(url)}` : '';
            const res = await fetch(`${API_BASE}/api/hygiene/score${params}`);
            const d = await res.json();
            if (d.success) setData(d.score);
            else setError(d.error);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch_(); }, [fetch_]);

    const score = data?.overallScore ?? 0;
    const grade = data?.grade ?? '—';
    const gradeCfg = GRADE[grade] || { color: '#94a3b8', bg: '#f1f5f9', label: '—' };
    const scoreColor =
        score >= 80 ? '#10b981' :
            score >= 60 ? '#f59e0b' :
                score >= 40 ? '#f97316' : '#ef4444';

    const weakest = data?.weakest;

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                        <ShieldCheck size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Hygiene Score</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                            Functional 40% · Perf 20% · A11y 15% · Visual 15% · Network 10%
                        </p>
                    </div>
                </div>

                {/* URL Input */}
                <div className="flex items-center flex-1 min-w-[220px] gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetch_()}
                        placeholder="https://your-app.com"
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none font-medium"
                    />
                    {url && <button onClick={() => setUrl('')} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>}
                </div>

                <button onClick={fetch_} disabled={loading}
                    className="ml-auto flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-200">
                    {loading ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Recompute
                </button>
            </div>

            {/* ── Loading ───────────────────────────────────────────────────── */}
            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            className="w-14 h-14 rounded-full border-4 border-emerald-100 border-t-emerald-500" />
                        <p className="text-slate-500 font-bold text-sm">Computing hygiene score…</p>
                    </div>
                </div>
            )}

            {/* ── Error ─────────────────────────────────────────────────────── */}
            {error && !loading && (
                <div className="m-6 bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3">
                    <XCircle size={18} className="text-red-400" />
                    <p className="text-red-600 font-bold text-sm">{error}</p>
                </div>
            )}

            {/* ── Content ───────────────────────────────────────────────────── */}
            {!loading && data && (
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* ── Hero score card ───────────────────────────────── */}
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Gradient top strip */}
                            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
                            <div className="p-8 flex flex-wrap items-center gap-8">
                                {/* Gauge */}
                                <div className="relative flex items-center justify-center shrink-0">
                                    <ScoreGauge score={score} color={scoreColor} />
                                    <div className="absolute flex flex-col items-center">
                                        <p className="text-4xl font-black" style={{ color: scoreColor }}>{score}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">of 100</p>
                                    </div>
                                </div>

                                {/* Grade + label */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-4xl font-black"
                                            style={{ background: gradeCfg.bg, color: gradeCfg.color }}>
                                            {grade}
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">{gradeCfg.label}</p>
                                            <p className="text-sm text-slate-400">Product Quality Score</p>
                                        </div>
                                    </div>
                                    {!data.hasSufficientData && (
                                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                            <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                                            <p className="text-[10px] text-amber-700 font-bold">
                                                Limited data — run more analysis tools to improve accuracy.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick stats */}
                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 min-w-[200px]">
                                    {DIMENSIONS.map(dim => {
                                        const sc = data.dimensionScores?.[dim.key] ?? 50;
                                        return (
                                            <div key={dim.key} className="rounded-xl p-3" style={{ background: dim.bg }}>
                                                <p className="text-[9px] font-black uppercase tracking-wider mb-1"
                                                    style={{ color: dim.color }}>
                                                    {dim.icon} {dim.label}
                                                </p>
                                                <p className="text-xl font-black" style={{ color: dim.color }}>{sc}</p>
                                                <div className="h-1 rounded-full mt-1" style={{ background: dim.color + '33' }}>
                                                    <div className="h-1 rounded-full" style={{ background: dim.color, width: `${sc}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Formula explanation ──────────────────────────── */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <p className="text-xs font-black text-slate-700 mb-3">Score Formula</p>
                            <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-slate-600">
                                <span className="text-slate-400">score =</span>
                                {DIMENSIONS.map((dim, i) => (
                                    <span key={dim.key}>
                                        <span className="font-black" style={{ color: dim.color }}>
                                            {dim.label.charAt(0)}
                                        </span>
                                        <span className="text-slate-400">×{Math.round(dim.weight * 100)}%</span>
                                        {i < DIMENSIONS.length - 1 && <span className="text-slate-300"> + </span>}
                                    </span>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {DIMENSIONS.map(dim => (
                                    <div key={dim.key} className="flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-lg"
                                        style={{ background: dim.bg, color: dim.color }}>
                                        {dim.icon} {dim.label} = {data.dimensionScores?.[dim.key] ?? 50} × {Math.round(dim.weight * 100)}%
                                        = <span className="font-black">{Math.round((data.dimensionScores?.[dim.key] ?? 50) * dim.weight)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Weakest link / warnings ─────────────────────── */}
                        {(data.warnings?.length > 0 || weakest) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {weakest && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
                                        <TrendingDown size={18} className="text-red-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-black text-red-700">Weakest Dimension</p>
                                            <p className="text-[11px] text-red-500 mt-1">
                                                <span className="font-black capitalize">{weakest.name}</span> scored {weakest.score}/100.
                                                Focus here for the highest impact improvement.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {data.warnings?.length > 0 && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-black text-amber-700">Below Threshold (70)</p>
                                            <p className="text-[11px] text-amber-600 mt-1 capitalize">
                                                {data.warnings.join(', ')} — all scored below 70/100.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {data.warnings?.length === 0 && score >= 70 && (
                                    <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-3">
                                        <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-black text-green-700">All Dimensions Healthy</p>
                                            <p className="text-[11px] text-green-500 mt-1">Every dimension is above the 70/100 threshold. Keep it up!</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Per-dimension breakdown ──────────────────────── */}
                        <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Dimension Breakdown</p>
                            <div className="space-y-3">
                                {DIMENSIONS.map(dim => {
                                    const dimData = data.dimensions?.[dim.key] || {};
                                    return (
                                        <DimensionBar
                                            key={dim.key}
                                            dim={dim}
                                            score={data.dimensionScores?.[dim.key] ?? null}
                                            detail={dimData.detail}
                                            breakdown={dimData.breakdown}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Timestamp ────────────────────────────────────── */}
                        <p className="text-[9px] text-slate-300 text-center font-mono">
                            Computed at {data.computedAt ? new Date(data.computedAt).toLocaleString() : '—'}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Empty state ────────────────────────────────────────────────── */}
            {!loading && !data && !error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center max-w-sm text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl flex items-center justify-center mb-5">
                            <ShieldCheck size={38} className="text-emerald-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 mb-2">Hygiene Score Card</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Aggregates results from Functional Judge, Performance, Accessibility, Visual Judge, and Network Monitor into a single weighted 0–100 product quality score.
                        </p>
                        <button onClick={fetch_}
                            className="mt-5 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
                            Compute Score
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
