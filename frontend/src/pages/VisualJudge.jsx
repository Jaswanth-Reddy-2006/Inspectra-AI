import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, Globe, Loader, XCircle, CheckCircle,
    Monitor, Tablet, Smartphone, ArrowLeftRight
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const ISSUE_ICONS = {
    overflow: { icon: '↔️', color: '#f97316', label: 'Overflow' },
    hidden_button: { icon: '👻', color: '#ef4444', label: 'Hidden Button' },
    z_overlap: { icon: '🔲', color: '#8b5cf6', label: 'Z-Overlap' },
    shifted_element: { icon: '↕️', color: '#f59e0b', label: 'Shifted' },
};
const SEVERITY_CFG = {
    high: { color: '#ef4444', bg: '#fee2e2' },
    medium: { color: '#f59e0b', bg: '#fef3c7' },
    low: { color: '#10b981', bg: '#d1fae5' },
};
const VIEWPORTS = [
    { id: 'desktop', label: 'Desktop', Icon: Monitor },
    { id: 'tablet', label: 'Tablet', Icon: Tablet },
    { id: 'mobile', label: 'Mobile', Icon: Smartphone },
];

function SliderCompare({ baseline, current, diff, mode }) {
    const [sliderX, setSliderX] = useState(50);
    const containerRef = useRef(null);
    const dragging = useRef(false);
    const onMouseMove = (e) => {
        if (!dragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setSliderX(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    };
    if (mode === 'diff') return (
        <div className="relative rounded-xl overflow-hidden bg-slate-900" style={{ aspectRatio: '16/9' }}>
            {diff ? <img src={diff} alt="Diff" className="w-full h-full object-contain" />
                : <div className="flex items-center justify-center h-full text-slate-500 text-sm">No diff generated</div>}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-lg">🔴 Changed · 🟡 Anti-aliased</div>
        </div>
    );
    if (mode === 'side') return (
        <div className="grid grid-cols-2 gap-2">
            {[{ img: baseline, l: 'Baseline' }, { img: current, l: 'Current' }].map(({ img, l }) => (
                <div key={l} className="relative rounded-xl overflow-hidden bg-slate-100" style={{ aspectRatio: '16/9' }}>
                    {img ? <img src={img} alt={l} className="w-full h-full object-cover object-top" />
                        : <div className="flex items-center justify-center h-full text-slate-400 text-sm">{l}</div>}
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded">{l}</div>
                </div>
            ))}
        </div>
    );
    return (
        <div ref={containerRef} className="relative rounded-xl overflow-hidden cursor-col-resize select-none bg-slate-100"
            style={{ aspectRatio: '16/9' }}
            onMouseMove={onMouseMove} onMouseDown={() => { dragging.current = true; }}
            onMouseUp={() => { dragging.current = false; }} onMouseLeave={() => { dragging.current = false; }}>
            {current && <img src={current} alt="Current" className="absolute inset-0 w-full h-full object-cover object-top" />}
            {baseline && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderX}%` }}>
                    <img src={baseline} alt="Baseline" className="absolute inset-0 object-cover object-top"
                        style={{ width: containerRef.current?.offsetWidth || 800, height: '100%' }} />
                </div>
            )}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl" style={{ left: `${sliderX}%` }}>
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                    <ArrowLeftRight size={14} className="text-slate-600" />
                </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded">Baseline</div>
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded">Current</div>
        </div>
    );
}

function IssueCard({ issue }) {
    const cfg = ISSUE_ICONS[issue.type] || { icon: '⚠️', color: '#94a3b8', label: issue.type };
    const sev = SEVERITY_CFG[issue.severity] || SEVERITY_CFG.low;
    return (
        <div className="bg-white rounded-xl border border-slate-100 p-3 flex items-start gap-3 shadow-sm">
            <span className="text-base shrink-0">{cfg.icon}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: sev.bg, color: sev.color }}>{issue.severity?.toUpperCase()}</span>
                    <span className="text-[9px] font-bold text-slate-400">{cfg.label}</span>
                    {issue.tag && <code className="text-[9px] font-mono text-slate-400">&lt;{issue.tag}&gt;</code>}
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">{issue.detail}</p>
            </div>
        </div>
    );
}

export default function VisualJudge() {
    const [baselineUrl, setBaselineUrl] = useState('');
    const [currentUrl, setCurrentUrl] = useState('');
    const [viewport, setViewport] = useState('desktop');
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ phase: '', pct: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('slider');
    const [issueFilter, setIssueFilter] = useState('all');

    const handleCompare = async () => {
        if (!baselineUrl || !currentUrl) return;
        setRunning(true); setResult(null); setError(null);
        setProgress({ phase: 'starting', pct: 5 });
        try {
            const res = await fetch(`${API_BASE}/api/visual/compare`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ baselineUrl, currentUrl, viewport }),
            });
            const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n'); buf = lines.pop();
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

    const filteredIssues = (result?.issues || []).filter(i => issueFilter === 'all' || i.type === issueFilter || i.severity === issueFilter);
    const verdictColor = result?.overallVerdict === 'pass' ? '#10b981' : result?.overallVerdict === 'warn' ? '#f59e0b' : '#ef4444';

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200">
                        <Eye size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Visual Judge</p>
                        <p className="text-[10px] text-slate-400 font-semibold">SSIM diff · Overlay heatmap · Issue detection</p>
                    </div>
                </div>
                <div className="w-px h-7 bg-slate-100 mx-1 hidden md:block" />
                <div className="flex-1 grid grid-cols-2 gap-2 min-w-[300px]">
                    {[{ val: baselineUrl, set: setBaselineUrl, ph: 'Baseline URL' }, { val: currentUrl, set: setCurrentUrl, ph: 'Current URL' }].map(({ val, set, ph }) => (
                        <div key={ph} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-pink-300 transition-all">
                            <Globe size={11} className="text-slate-400 shrink-0" />
                            <input type="url" value={val} onChange={e => set(e.target.value)} placeholder={ph} disabled={running}
                                className="flex-1 bg-transparent text-xs font-mono text-slate-800 placeholder-slate-400 outline-none" />
                        </div>
                    ))}
                </div>
                <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                    {VIEWPORTS.map(vp => (
                        <button key={vp.id} onClick={() => setViewport(vp.id)}
                            className={`flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${viewport === vp.id ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>
                            <vp.Icon size={11} />{vp.label}
                        </button>
                    ))}
                </div>
                <button onClick={handleCompare} disabled={!baselineUrl || !currentUrl || running}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                    {running ? <><Loader size={13} className="animate-spin" />{progress.phase}…</> : <><Eye size={13} />Compare</>}
                </button>
                {error && <div className="bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><XCircle size={11} />{error.slice(0, 55)}</div>}
            </div>

            {running && (
                <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-400"
                            animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 capitalize">{progress.phase}…</span>
                </div>
            )}

            {running && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            className="w-14 h-14 rounded-full border-4 border-pink-100 border-t-pink-500" />
                        <p className="text-slate-500 font-bold text-sm capitalize">{progress.phase.replace(/_/g, ' ')}…</p>
                    </div>
                </div>
            )}

            {!running && !result && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center max-w-md text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl flex items-center justify-center mb-5">
                            <Eye size={38} className="text-pink-300" />
                        </div>
                        <h3 className="text-base font-black text-slate-700 mb-2">Visual Regression Testing</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Compare two URLs pixel-by-pixel. Inspectra captures full viewport screenshots, computes SSIM diff, overlays a heatmap, and detects overflow, hidden buttons, and element shifts.</p>
                    </div>
                </div>
            )}

            {!running && result && (
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="max-w-5xl mx-auto space-y-5">
                        {/* Score bar */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: verdictColor + '22' }}>
                                    <p className="text-2xl font-black" style={{ color: verdictColor }}>{result.ssimScore}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-wider">SSIM Score</p>
                                    <p className="text-sm font-black capitalize" style={{ color: verdictColor }}>{result.overallVerdict}</p>
                                </div>
                            </div>
                            <div className="w-px h-10 bg-slate-100" />
                            {[
                                { l: 'Δ Pixels', v: result.diffPct != null ? result.diffPct + '%' : '—' },
                                { l: 'Issues', v: result.issues?.length || 0 },
                                { l: 'Viewport', v: result.viewport },
                                { l: 'Overflow', v: result.issuesByType?.overflow || 0 },
                                { l: 'Hidden', v: result.issuesByType?.hidden_button || 0 },
                                { l: 'Shifted', v: result.issuesByType?.shifted_element || 0 },
                            ].map(m => (
                                <div key={m.l} className="text-center">
                                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{m.l}</p>
                                    <p className="text-base font-black text-slate-800">{m.v}</p>
                                </div>
                            ))}
                        </div>

                        {/* View mode */}
                        <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 shadow-sm w-fit">
                            {[{ id: 'slider', l: 'Slider' }, { id: 'side', l: 'Side by Side' }, { id: 'diff', l: 'Diff Heatmap' }].map(m => (
                                <button key={m.id} onClick={() => setViewMode(m.id)}
                                    className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${viewMode === m.id ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {m.l}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <SliderCompare baseline={result.baselineImg} current={result.currentImg} diff={result.diffImg} mode={viewMode} />
                        </div>

                        {result.blocks?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <p className="text-xs font-black text-slate-700 mb-3">Change Intensity Heatmap (32px blocks)</p>
                                <div className="flex flex-wrap gap-0.5">
                                    {result.blocks.slice(0, 100).map((b, i) => (
                                        <div key={i} title={`(${b.x},${b.y}) ${Math.round(b.diff * 100)}% change`}
                                            className="w-3 h-3 rounded-sm transition-all hover:scale-150"
                                            style={{ background: `rgba(239,68,68,${Math.min(1, b.diff * 2)})` }} />
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2">Red intensity = change magnitude per block</p>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                                <p className="text-xs font-black text-slate-700">Visual Issues ({result.issues?.length || 0})</p>
                                <div className="flex gap-1 ml-auto flex-wrap">
                                    {['all', 'overflow', 'hidden_button', 'z_overlap', 'shifted_element', 'high', 'medium'].map(f => (
                                        <button key={f} onClick={() => setIssueFilter(f)}
                                            className={`text-[9px] font-black px-2 py-1 rounded-lg capitalize ${issueFilter === f ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            {f.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {filteredIssues.length === 0
                                ? <p className="text-sm text-green-600 font-bold flex items-center gap-2"><CheckCircle size={14} />No issues match filter</p>
                                : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filteredIssues.map((iss, i) => <IssueCard key={i} issue={iss} />)}</div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
