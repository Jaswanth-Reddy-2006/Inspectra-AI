import React, { useState, useEffect, useRef } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu, Globe, Loader, CheckCircle, XCircle, AlertTriangle,
    ChevronDown, ChevronRight, Play, RotateCcw, Clock,
    ThumbsUp, ThumbsDown, Minus, Copy, Camera
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// ── Constants ─────────────────────────────────────────────────────────────────

const VERDICT_CFG = {
    pass: { label: 'PASS', color: '#10b981', bg: '#d1fae5', Icon: ThumbsUp },
    warn: { label: 'WARN', color: '#f59e0b', bg: '#fef3c7', Icon: Minus },
    fail: { label: 'FAIL', color: '#ef4444', bg: '#fee2e2', Icon: ThumbsDown },
};

const FLOW_COLORS = {
    login: '#6366f1',
    addToCart: '#f59e0b',
    submitForm: '#10b981',
    search: '#0ea5e9',
};

const STEP_ICONS = {
    navigate: '🧭', detect: '🔍', fill: '✏️', fillFirst: '✏️',
    click: '👆', submit: '↩️', waitNav: '⏳', verify: '✔️',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepTrace({ steps }) {
    const [expanded, setExpanded] = useState(null);
    return (
        <div className="space-y-1 mt-3">
            {steps.map((step, i) => {
                const isOpen = expanded === i;
                const v = VERDICT_CFG[step.verdict] || VERDICT_CFG.pass;
                return (
                    <div key={i} className="rounded-xl overflow-hidden border border-slate-100">
                        <button onClick={() => setExpanded(isOpen ? null : i)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isOpen ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/60'}`}>
                            <span className="text-sm shrink-0">{STEP_ICONS[step.action] || '•'}</span>
                            <span className="text-[10px] font-black text-slate-500 w-4 shrink-0">{i + 1}</span>
                            <span className="flex-1 text-[11px] font-semibold text-slate-700 truncate">{step.label}</span>
                            {step.durationMs > 0 && (
                                <span className="text-[9px] text-slate-400 font-mono shrink-0">{step.durationMs}ms</span>
                            )}
                            <div className="shrink-0 flex items-center gap-1">
                                <v.Icon size={11} style={{ color: v.color }} />
                                <span className="text-[9px] font-black" style={{ color: v.color }}>{v.label}</span>
                            </div>
                            {(step.verdict === 'fail' || step.detail) && (
                                <ChevronDown size={10} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                            )}
                        </button>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                    className="overflow-hidden border-t border-slate-100">
                                    <div className="px-4 py-3 bg-slate-50 space-y-2">
                                        {step.detail && (
                                            <p className="text-[10px] font-mono text-slate-500">{step.detail}</p>
                                        )}
                                        {step.verdict === 'fail' && step.reason && (
                                            <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <XCircle size={12} className="text-red-400 shrink-0" />
                                                    <p className="text-[11px] font-black text-red-700">{step.reason.title}</p>
                                                    <span className="text-[9px] font-bold text-red-400 ml-auto">{step.reason.category}</span>
                                                </div>
                                                <p className="text-[10px] text-red-600 leading-relaxed">{step.reason.why}</p>
                                                {step.reason.cascade && (
                                                    <p className="text-[9px] text-orange-500 font-bold">⚡ Cascade from: {step.reason.cascadeFrom}</p>
                                                )}
                                                {step.reason.suggestions?.length > 0 && (
                                                    <div className="space-y-1">
                                                        {step.reason.suggestions.map((s, j) => (
                                                            <div key={j} className="flex items-start gap-1.5">
                                                                <span className="text-[9px] text-red-300 mt-0.5 shrink-0">→</span>
                                                                <p className="text-[9px] text-red-500">{s}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {step.screenshot && (
                                            <img src={step.screenshot} alt="Step screenshot"
                                                className="rounded-lg border border-slate-150 w-full max-h-40 object-cover object-top" />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

function FlowCard({ flow, isRunning, liveSteps }) {
    const [open, setOpen] = useState(false);
    const v = flow ? (VERDICT_CFG[flow.verdict] || VERDICT_CFG.pass) : null;
    const color = FLOW_COLORS[flow?.flowId] || '#6366f1';
    const steps = flow?.steps || liveSteps || [];

    return (
        <motion.div layout
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header strip */}
            <div className="h-1" style={{ background: color }} />

            <div className="p-5">
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                        style={{ background: color + '15' }}>
                        {flow?.icon || '⚙️'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{flow?.name || 'Running…'}</p>
                        <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">{flow?.goal || 'Executing…'}</p>
                    </div>
                    {isRunning && !flow && (
                        <Loader size={16} className="animate-spin text-indigo-400 shrink-0" />
                    )}
                    {flow && v && (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: v.bg }}>
                                <v.Icon size={12} style={{ color: v.color }} />
                                <span className="text-xs font-black" style={{ color: v.color }}>{v.label}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{flow.confidence}% confidence</span>
                        </div>
                    )}
                </div>

                {/* Stats row */}
                {flow && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                            { l: 'Steps', v: `${flow.passCount}/${flow.totalSteps}` },
                            { l: 'Time', v: flow.durationMs > 999 ? (flow.durationMs / 1000).toFixed(1) + 's' : flow.durationMs + 'ms' },
                            { l: 'Fails', v: flow.failCount, warn: flow.failCount > 0 },
                        ].map(s => (
                            <div key={s.l} className="bg-slate-50 rounded-xl px-2.5 py-2 text-center">
                                <p className="text-[9px] text-slate-400 font-semibold">{s.l}</p>
                                <p className={`text-sm font-black ${s.warn ? 'text-red-500' : 'text-slate-800'}`}>{s.v}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Overall failure reason */}
                {flow?.overallReason && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={12} className="text-red-400 shrink-0" />
                            <p className="text-[11px] font-black text-red-700">{flow.overallReason.title}</p>
                        </div>
                        <p className="text-[10px] text-red-600 leading-relaxed">{flow.overallReason.why}</p>
                        {flow.overallReason.step && (
                            <p className="text-[9px] text-red-400 mt-1 font-bold">📍 Failed at: {flow.overallReason.step}</p>
                        )}
                    </div>
                )}

                {/* Expand step trace */}
                {steps.length > 0 && (
                    <>
                        <button onClick={() => setOpen(o => !o)}
                            className="w-full flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-indigo-600 transition-colors">
                            <ChevronRight size={11} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                            {open ? 'Hide' : 'View'} step trace ({steps.length} steps)
                        </button>
                        <AnimatePresence>
                            {open && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}>
                                    <StepTrace steps={steps} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}

                {/* Running / live progress */}
                {isRunning && !flow && liveSteps.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {liveSteps.slice(-3).map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500">
                                <Loader size={9} className="animate-spin text-indigo-400 shrink-0" />
                                <span className="font-mono truncate">{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ── Predefined flow definitions (for display before run) ──────────────────────
const FLOW_DEFS = [
    { flowId: 'login', name: 'User Login', icon: '🔐', goal: 'Authenticate with valid credentials and verify session creation' },
    { flowId: 'addToCart', name: 'Add to Cart', icon: '🛒', goal: 'Find a purchasable product and add it to the shopping cart' },
    { flowId: 'submitForm', name: 'Submit Contact Form', icon: '📋', goal: 'Fill and submit a contact/enquiry form and verify success confirmation' },
    { flowId: 'search', name: 'Site Search', icon: '🔍', goal: 'Enter a query and verify search results are returned' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FunctionalJudge() {
    const { targetUrl: url } = useTargetUrl();
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState({});     // flowId → result
    const [liveSteps, setLiveSteps] = useState({});   // flowId → step[]
    const [activeFlows, setActiveFlows] = useState(new Set());
    const [error, setError] = useState(null);
    const [done, setDone] = useState(0);
    const [total, setTotal] = useState(0);
    const [selectedFlows, setSelectedFlows] = useState(
        new Set(['login', 'addToCart', 'submitForm', 'search'])
    );

    const handleRun = async () => {
        if (!url) return;
        setRunning(true); setResults({}); setLiveSteps({}); setError(null); setDone(0);
        setTotal(selectedFlows.size);
        const active = new Set(selectedFlows);
        setActiveFlows(active);

        try {
            const res = await fetch(`${API_BASE}/api/functional/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, flows: [...selectedFlows] }),
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';

            while (true) {
                const { done: d, value } = await reader.read();
                if (d) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop();
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const ev = JSON.parse(line.slice(6));
                        if (ev.type === 'flow_complete') {
                            setResults(prev => ({ ...prev, [ev.flow.flowId]: ev.flow }));
                            setActiveFlows(prev => { const s = new Set(prev); s.delete(ev.flow.flowId); return s; });
                            setDone(ev.progress?.done || 0);
                        }
                        if (ev.type === 'step') {
                            setLiveSteps(prev => ({
                                ...prev,
                                [ev.flowId]: [...(prev[ev.flowId] || []), ev.step],
                            }));
                        }
                        if (ev.type === 'error') setError(ev.message);
                    } catch { }
                }
            }
        } catch (err) { setError(err.message); }
        finally { setRunning(false); setActiveFlows(new Set()); }
    };

    const summary = Object.values(results);
    const passed = summary.filter(r => r.verdict === 'pass').length;
    const failed = summary.filter(r => r.verdict === 'fail').length;
    const warned = summary.filter(r => r.verdict === 'warn').length;
    const avgConf = summary.length
        ? Math.round(summary.reduce((s, r) => s + (r.confidence || 0), 0) / summary.length)
        : 0;

    // Displayed flow cards
    const displayFlows = [...selectedFlows].map(id => FLOW_DEFS.find(f => f.flowId === id));

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
                        <Cpu size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Functional Judge</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Autonomous flows · Failure reasoning · Step trace</p>
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-100 mx-1 hidden md:block" />
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex-1 min-w-[200px]">
                    <Globe size={13} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-mono text-slate-700 truncate">{url || <span className="text-slate-400 italic">Set a URL in the top bar…</span>}</span>
                </div>
                <button onClick={handleRun} disabled={!url || running || selectedFlows.size === 0}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-violet-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                    {running
                        ? <><Loader size={13} className="animate-spin" />{done}/{total} flows…</>
                        : <><Play size={13} />Run Flows</>}
                </button>
                {error && (
                    <div className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1">
                        <XCircle size={11} />{error.slice(0, 55)}
                    </div>
                )}
            </div>

            {/* Progress bar */}
            {running && (
                <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                            animate={{ width: total > 0 ? `${(done / total) * 100}%` : '5%' }}
                            transition={{ duration: 0.4 }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400">{done}/{total} flows complete</span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
                {/* Flow selector */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Flows to run:</p>
                    {FLOW_DEFS.map(f => (
                        <button key={f.flowId}
                            onClick={() => {
                                setSelectedFlows(prev => {
                                    const s = new Set(prev);
                                    s.has(f.flowId) ? s.delete(f.flowId) : s.add(f.flowId);
                                    return s;
                                });
                            }}
                            className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all ${selectedFlows.has(f.flowId)
                                ? 'text-white border-transparent shadow-md'
                                : 'bg-white border-slate-200 text-slate-500'
                                }`}
                            style={selectedFlows.has(f.flowId) ? { background: FLOW_COLORS[f.flowId] } : {}}>
                            {f.icon} {f.name}
                        </button>
                    ))}
                </div>

                {/* Summary bar — only after first result */}
                {summary.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        {[
                            { l: 'Passed', v: passed, c: '#10b981', bg: '#d1fae5', Icon: ThumbsUp },
                            { l: 'Failed', v: failed, c: '#ef4444', bg: '#fee2e2', Icon: ThumbsDown },
                            { l: 'Warned', v: warned, c: '#f59e0b', bg: '#fef3c7', Icon: AlertTriangle },
                            { l: 'Avg Conf', v: avgConf + '%', c: '#6366f1', bg: '#eef2ff', Icon: Cpu },
                        ].map(m => (
                            <div key={m.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                                    <m.Icon size={15} style={{ color: m.c }} />
                                </div>
                                <div>
                                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{m.l}</p>
                                    <p className="text-xl font-black text-slate-900">{m.v}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Flow cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayFlows.map(def => {
                        if (!def) return null;
                        const result = results[def.flowId];
                        const isActive = activeFlows.has(def.flowId) || (running && !result);
                        const live = liveSteps[def.flowId] || [];
                        return (
                            <FlowCard key={def.flowId}
                                flow={result || null}
                                isRunning={isActive && !result}
                                liveSteps={live} />
                        );
                    })}
                </div>

                {/* Empty state */}
                {!running && summary.length === 0 && (
                    <div className="flex flex-col items-center py-20 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl flex items-center justify-center mb-5">
                            <Cpu size={38} className="text-violet-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 mb-2">Autonomous Test Execution</h3>
                        <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                            Enter a URL and select which flows to run. Inspectra will autonomously navigate, fill forms, click buttons, and explain exactly why each step passed or failed.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
