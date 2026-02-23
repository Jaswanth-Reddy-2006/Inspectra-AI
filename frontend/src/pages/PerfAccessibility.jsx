import React, { useState, useMemo } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gauge, Globe, Loader, XCircle, CheckCircle, AlertTriangle,
    Zap, Eye, ShieldCheck, Clock, LayoutGrid, AlignLeft,
    Contrast, Navigation, ChevronDown, ChevronRight, ExternalLink
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = 'http://localhost:5000';

// ─── Score helpers ────────────────────────────────────────────────────────────

const scoreColor = (s) => s >= 90 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const scoreBg = (s) => s >= 90 ? '#d1fae5' : s >= 50 ? '#fef3c7' : '#fee2e2';
const scoreLabel = (s) => s >= 90 ? 'Good' : s >= 50 ? 'Needs work' : 'Poor';

const IMPACT_COLORS = {
    critical: { color: '#ef4444', bg: '#fee2e2' },
    serious: { color: '#f97316', bg: '#fff7ed' },
    moderate: { color: '#f59e0b', bg: '#fef3c7' },
    minor: { color: '#94a3b8', bg: '#f1f5f9' },
};

const VITAL_UNITS = { lcp: 'ms', cls: '', fid: 'ms', tti: 'ms' };
const VITAL_LABELS = { lcp: 'LCP', cls: 'CLS', fid: 'TBT', tti: 'TTI' };

// ─── Score Gauge ──────────────────────────────────────────────────────────────

function ScoreGauge({ score, label, icon: Icon, size = 'lg' }) {
    const r = size === 'lg' ? 52 : 38;
    const sw = size === 'lg' ? 8 : 6;
    const dim = (r + sw) * 2 + 2;
    const circ = 2 * Math.PI * r;
    const color = scoreColor(score);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
                <svg className="absolute" width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
                    <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
                    <motion.circle
                        cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
                        strokeLinecap="round" strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - (score / 100) * circ }}
                        transition={{ duration: 1.1, ease: 'easeOut' }}
                        transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
                    />
                </svg>
                <div className="z-10 text-center">
                    <p className="font-black leading-none" style={{ color, fontSize: size === 'lg' ? 26 : 18 }}>{score}</p>
                    {size === 'lg' && <p className="text-[9px] font-bold mt-0.5" style={{ color }}>{scoreLabel(score)}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1.5">
                {Icon && <Icon size={12} style={{ color }} />}
                <p className="text-xs font-black text-slate-600">{label}</p>
            </div>
        </div>
    );
}

// ─── Vital Card ───────────────────────────────────────────────────────────────

function VitalCard({ name, vital }) {
    const color = scoreColor(vital.score);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{VITAL_LABELS[name]}</p>
            <ScoreGauge score={vital.score} size="sm" />
            <p className="text-sm font-black" style={{ color }}>
                {name === 'cls' ? vital.value.toFixed(3) : (vital.value > 999 ? (vital.value / 1000).toFixed(1) + 's' : vital.value + 'ms')}
            </p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: scoreBg(vital.score), color }}>{vital.label}</span>
        </div>
    );
}

// ─── Issue Accordion ──────────────────────────────────────────────────────────

function IssueAccordion({ title, icon: Icon, count, color, bg, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                    <Icon size={15} style={{ color }} />
                </div>
                <p className="text-sm font-black text-slate-800 flex-1 text-left">{title}</p>
                {count > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{count} found</span>
                )}
                {open ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronRight size={13} className="text-slate-400" />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden">
                        <div className="px-5 pb-4 border-t border-slate-100">
                            {count === 0
                                ? <p className="text-sm text-green-600 font-bold flex items-center gap-2 mt-3"><CheckCircle size={14} />None detected</p>
                                : <div className="mt-3">{children}</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PerfAccessibility() {
    const { targetUrl: url } = useTargetUrl();
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ phase: '', pct: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const handleAnalyze = async () => {
        if (!url) return;
        setRunning(true); setResult(null); setError(null);
        setProgress({ phase: 'starting', pct: 5 });

        try {
            const res = await fetch(`${API_BASE}/api/perf/analyze`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
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

    const radarData = result ? [
        { metric: 'Performance', value: result.scores.performance },
        { metric: 'Accessibility', value: result.scores.accessibility },
        { metric: 'Best Practice', value: result.scores.bestPractices },
        { metric: 'LCP', value: result.vitals.lcp.score },
        { metric: 'CLS', value: result.vitals.cls.score },
    ] : [];

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'perf', label: 'Performance' },
        { id: 'a11y', label: 'Accessibility' },
        { id: 'bp', label: 'Best Practices' },
    ];

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">

            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                        <Gauge size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Performance & Accessibility</p>
                        <p className="text-[10px] text-slate-400 font-semibold">LCP · CLS · TTI · WCAG audit</p>
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-100 mx-1 hidden md:block" />
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
                    <Globe size={13} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-mono text-slate-700 truncate">{url || <span className="text-slate-400 italic">Set a URL in the top bar…</span>}</span>
                </div>
                <button onClick={handleAnalyze} disabled={!url || running}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                    {running ? <><Loader size={13} className="animate-spin" />{progress.phase}…</> : <><Gauge size={13} />Analyze</>}
                </button>
                {error && <div className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><XCircle size={11} />{error.slice(0, 60)}</div>}
            </div>

            {/* Progress */}
            {running && (
                <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-400"
                            animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 capitalize">{progress.phase}…</span>
                </div>
            )}

            {/* Loading */}
            {running && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
                            className="w-14 h-14 rounded-full border-4 border-rose-100 border-t-rose-500" />
                        <p className="text-slate-500 font-bold text-sm">Running performance analysis…</p>
                        <p className="text-slate-400 text-xs">Measuring Web Vitals · Running WCAG audit</p>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!running && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center max-w-md text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl flex items-center justify-center mb-5">
                            <Gauge size={38} className="text-rose-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 mb-2">Combined Audit</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Enter a URL to run a combined performance and accessibility audit. Inspectra measures LCP, CLS, TTI, and TBT, and runs a full WCAG 2.1 scan via axe-core.</p>
                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {[{ l: 'Performance', c: '#ef4444', i: Zap }, { l: 'Accessibility', c: '#6366f1', i: Eye }, { l: 'Best Practices', c: '#10b981', i: ShieldCheck }].map(m => {
                                const Icon = m.i;
                                return (<div key={m.l} className="flex flex-col items-center gap-1.5 bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                                    <Icon size={18} style={{ color: m.c }} />
                                    <p className="text-[10px] font-bold text-slate-500">{m.l}</p>
                                </div>);
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {!running && result && (
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-6 py-5 space-y-5">

                        {/* Tab bar */}
                        <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-fit">
                            {TABS.map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id)}
                                    className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${activeTab === t.id ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'overview' && (
                                <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                                    {/* Score gauges */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                        <div className="flex flex-wrap items-center justify-around gap-8">
                                            {/* Overall */}
                                            <div className="flex flex-col items-center gap-2">
                                                <ScoreGauge score={result.scores.overall} label="Overall" size="lg" />
                                                <p className="text-[10px] font-semibold text-slate-400">Combined Score</p>
                                            </div>
                                            <div className="w-px h-24 bg-slate-100 hidden md:block" />
                                            <ScoreGauge score={result.scores.performance} label="Performance" icon={Zap} size="lg" />
                                            <ScoreGauge score={result.scores.accessibility} label="Accessibility" icon={Eye} size="lg" />
                                            <ScoreGauge score={result.scores.bestPractices} label="Best Practices" icon={ShieldCheck} size="lg" />
                                            <div className="w-px h-24 bg-slate-100 hidden md:block" />
                                            {/* Radar */}
                                            <ResponsiveContainer width={180} height={160}>
                                                <RadarChart data={radarData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                                                    <PolarGrid stroke="#e2e8f0" />
                                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                                                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                                    <Radar dataKey="value" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.18} strokeWidth={2} />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Web Vitals */}
                                    <div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Core Web Vitals</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {Object.entries(result.vitals).map(([key, vital]) => (
                                                <VitalCard key={key} name={key} vital={vital} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Screenshot */}
                                    {result.screenshot && (
                                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                                                <Globe size={12} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">{result.title}</span>
                                            </div>
                                            <img src={result.screenshot} alt="Page screenshot" className="w-full" />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'perf' && (
                                <motion.div key="perf" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {/* Slow resources */}
                                    <IssueAccordion title="Slow Resources (> 500ms)" icon={Clock} count={result.slowResources?.length || 0}
                                        color="#f59e0b" bg="#fef3c7" defaultOpen>
                                        <div className="space-y-2">
                                            {result.slowResources?.map((r, i) => (
                                                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0">{r.type}</span>
                                                    <p className="font-mono text-[10px] text-slate-600 flex-1 truncate" title={r.url}>{r.url.split('/').slice(-2).join('/')}</p>
                                                    <span className="text-[10px] font-black shrink-0" style={{ color: r.duration > 3000 ? '#ef4444' : '#f59e0b' }}>
                                                        {r.duration >= 1000 ? (r.duration / 1000).toFixed(1) + 's' : r.duration + 'ms'}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 shrink-0">{(r.size / 1024).toFixed(1)}KB</span>
                                                </div>
                                            ))}
                                        </div>
                                    </IssueAccordion>

                                    {/* Layout shifts */}
                                    <IssueAccordion title="Layout Shifts (CLS)" icon={LayoutGrid} count={result.clsDetails?.length || 0}
                                        color="#ef4444" bg="#fee2e2">
                                        <div className="space-y-2">
                                            {result.clsDetails?.map((cls, i) => (
                                                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-[10px] font-black text-red-600">{cls.value}</span>
                                                    <span className="text-[9px] text-slate-400">at {cls.time}ms</span>
                                                    {cls.sources?.map((s, j) => (
                                                        <span key={j} className="text-[9px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">&lt;{s}&gt;</span>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </IssueAccordion>

                                    {/* Console errors */}
                                    <IssueAccordion title="Console Errors" icon={AlertTriangle} count={result.consoleErrors?.length || 0}
                                        color="#ef4444" bg="#fee2e2">
                                        <div className="space-y-1.5">
                                            {result.consoleErrors?.map((e, i) => (
                                                <p key={i} className="text-[10px] font-mono text-red-600 bg-red-50 rounded-lg p-2">{e.slice(0, 120)}</p>
                                            ))}
                                        </div>
                                    </IssueAccordion>
                                </motion.div>
                            )}

                            {activeTab === 'a11y' && (
                                <motion.div key="a11y" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                    {/* Axe summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Object.entries(result.axeSummary.byImpact).map(([impact, count]) => {
                                            const c = IMPACT_COLORS[impact];
                                            return (
                                                <div key={impact} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg }}>
                                                        <AlertTriangle size={15} style={{ color: c.color }} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] capitalize text-slate-400 font-semibold">{impact}</p>
                                                        <p className="text-xl font-black text-slate-900">{count}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Missing labels */}
                                    <IssueAccordion title="Missing / Mismatched Labels" icon={AlignLeft} count={result.missingLabels?.length || 0}
                                        color="#6366f1" bg="#eef2ff" defaultOpen>
                                        <div className="space-y-2">
                                            {result.missingLabels?.map((m, i) => (
                                                <div key={i} className="bg-slate-50 rounded-xl p-3">
                                                    <div className="flex gap-2 mb-1">
                                                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: IMPACT_COLORS[m.impact]?.bg, color: IMPACT_COLORS[m.impact]?.color }}>{m.impact}</span>
                                                        <span className="text-[9px] text-slate-400 font-mono">{m.rule}</span>
                                                    </div>
                                                    <code className="block text-[10px] text-slate-600 truncate">{m.element}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </IssueAccordion>

                                    {/* Contrast failures */}
                                    <IssueAccordion title="Color Contrast Failures" icon={Contrast} count={result.contrastFails?.length || 0}
                                        color="#ec4899" bg="#fce7f3">
                                        <div className="space-y-2">
                                            {result.contrastFails?.map((c, i) => (
                                                <div key={i} className="bg-slate-50 rounded-xl p-3">
                                                    <code className="block text-[10px] text-slate-600 truncate mb-1">{c.element}</code>
                                                    <p className="text-[10px] text-slate-500">{c.message?.slice(0, 100)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </IssueAccordion>

                                    {/* ARIA violations */}
                                    <IssueAccordion title="ARIA Violations" icon={Eye} count={result.ariaViolations?.length || 0}
                                        color="#8b5cf6" bg="#ede9fe">
                                        <div className="space-y-2">
                                            {result.ariaViolations?.map((v, i) => (
                                                <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded mt-0.5 shrink-0" style={{ background: IMPACT_COLORS[v.impact]?.bg, color: IMPACT_COLORS[v.impact]?.color }}>{v.impact}</span>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-mono text-slate-600">{v.rule}</p>
                                                        <p className="text-[9px] text-slate-400">{v.description?.slice(0, 80)}</p>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-500 shrink-0">{v.count}×</span>
                                                </div>
                                            ))}
                                        </div>
                                    </IssueAccordion>

                                    {/* Tab navigation */}
                                    <IssueAccordion title="Tab Navigation Issues" icon={Navigation} count={result.tabViolations?.length || 0}
                                        color="#f97316" bg="#fff7ed">
                                        <div className="space-y-2">
                                            {result.tabViolations?.map((v, i) => (
                                                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                                                    <span className="text-[9px] font-mono text-slate-600">{v.rule}</span>
                                                    <span className="text-[9px] text-slate-400 flex-1">{v.message?.slice(0, 60)}</span>
                                                    <span className="text-[9px] font-bold text-slate-500">{v.count}×</span>
                                                </div>
                                            ))}
                                        </div>
                                    </IssueAccordion>

                                    {/* All violations table */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-100">
                                            <p className="text-sm font-black text-slate-800">All Violations ({result.axeSummary.violations})</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        {['Rule', 'Impact', 'Count', 'Description'].map(h => (
                                                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.axeSummary.allViolations?.map((v, i) => (
                                                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                                                            <td className="px-4 py-2.5"><code className="text-[10px] text-slate-600">{v.id}</code></td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full capitalize" style={{ background: IMPACT_COLORS[v.impact]?.bg, color: IMPACT_COLORS[v.impact]?.color }}>{v.impact}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5 font-black text-slate-700">{v.count}</td>
                                                            <td className="px-4 py-2.5 text-slate-500 max-w-[300px] truncate">{v.description}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'bp' && (
                                <motion.div key="bp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                        <p className="text-sm font-black text-slate-800 mb-4">Best Practices Signals</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { l: 'HTTPS', v: result.bestPracticesSignals?.isHTTPS },
                                                { l: 'Meta Description', v: result.bestPracticesSignals?.hasMetaDesc },
                                                { l: 'Viewport Meta', v: result.bestPracticesSignals?.hasViewport },
                                                { l: 'Charset', v: result.bestPracticesSignals?.hasCharset },
                                                { l: 'Favicon', v: result.bestPracticesSignals?.hasFavicon },
                                                { l: 'Lang Attribute', v: result.bestPracticesSignals?.hasLangAttr },
                                            ].map(s => (
                                                <div key={s.l} className={`flex items-center gap-3 p-3 rounded-xl border ${s.v ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                                                    {s.v ? <CheckCircle size={14} className="text-green-500 shrink-0" /> : <XCircle size={14} className="text-red-400 shrink-0" />}
                                                    <p className="text-xs font-bold text-slate-700">{s.l}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {result.bestPracticesSignals?.imagesTotal > 0 && (
                                            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                                                <p className="text-xs font-bold text-slate-600 mb-1">Images without alt text</p>
                                                <p className="text-2xl font-black text-red-500">{result.bestPracticesSignals.imgWithoutAlt}</p>
                                                <p className="text-[10px] text-slate-400">of {result.bestPracticesSignals.imagesTotal} total images</p>
                                            </div>
                                        )}
                                        {result.bestPracticesSignals?.consoleErrors > 0 && (
                                            <div className="mt-3 p-4 bg-red-50 rounded-xl">
                                                <p className="text-xs font-bold text-red-600 mb-1">Console Errors</p>
                                                <p className="text-2xl font-black text-red-500">{result.bestPracticesSignals.consoleErrors}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
