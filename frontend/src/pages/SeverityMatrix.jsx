import React, { useState, useEffect, useCallback } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion } from 'framer-motion';
import { AlertOctagon, Loader, RefreshCw, XCircle, CheckCircle, ChevronDown, Globe } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const SEV = {
    critical: { color: '#ef4444', bg: '#fee2e2', bar: '#ef4444' },
    high: { color: '#f97316', bg: '#fff7ed', bar: '#f97316' },
    medium: { color: '#f59e0b', bg: '#fefce8', bar: '#f59e0b' },
    low: { color: '#10b981', bg: '#ecfdf5', bar: '#10b981' },
};
const SRC_ICONS = { Functional: '⚙️', Network: '🌐', DOM: '🏗️' };

function ScoreBar({ value, max = 100, color }) {
    return (
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
            <motion.div className="h-1.5 rounded-full" style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
    );
}

function DefectCard({ defect }) {
    const [open, setOpen] = useState(false);
    const s = SEV[defect.severity] || SEV.low;
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-1" style={{ background: s.color }} />
            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: s.bg }}>
                        {SRC_ICONS[defect.source] || '🔍'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 leading-snug">{defect.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 truncate">{defect.page?.slice(0, 55)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{defect.severity?.toUpperCase()}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{defect.source}</span>
                    </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                        { l: 'Score', v: defect.score, max: 100, c: s.color },
                        { l: 'Impact', v: defect.impact, max: 5, c: '#6366f1' },
                        { l: 'Biz Val', v: defect.businessValue, max: 5, c: '#0ea5e9' },
                        { l: 'Repro', v: defect.reproducibility, max: 5, c: '#f59e0b' },
                    ].map(m => (
                        <div key={m.l}>
                            <div className="flex justify-between mb-1">
                                <p className="text-[8px] text-slate-400 font-semibold">{m.l}</p>
                                <p className="text-[8px] font-black text-slate-700">{m.v}/{m.max}</p>
                            </div>
                            <ScoreBar value={m.v} max={m.max} color={m.c} />
                        </div>
                    ))}
                </div>

                <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                    <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                    {open ? 'Hide' : 'Show'} details
                </button>

                {open && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        <p className="text-[10px] text-slate-600 leading-snug">{defect.description}</p>
                        {defect.suggestions?.length > 0 && (
                            <div className="space-y-1">
                                {defect.suggestions.map((s, i) => (
                                    <p key={i} className="text-[9px] text-slate-400">→ {s}</p>
                                ))}
                            </div>
                        )}
                        <div className="text-[8px] text-slate-300 font-mono">
                            Formula: ({defect.impact} × {defect.businessValue} × {defect.reproducibility}) ÷ {defect.fixEffort} = {Math.round((defect.impact * defect.businessValue * defect.reproducibility) / defect.fixEffort * 4)} → score {defect.score}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SeverityMatrix() {
    const [matrix, setMatrix] = useState(null);
    const [loading, setLoad] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [src, setSrc] = useState('all');
    const { targetUrl: url } = useTargetUrl();

    const fetchMatrix = useCallback(async () => {
        setLoad(true); setError(null);
        try {
            const params = url ? `?url=${encodeURIComponent(url)}` : '';
            const res = await fetch(`${API_BASE}/api/severity/matrix${params}`);
            const d = await res.json();
            if (d.success) setMatrix(d.matrix);
            else setError(d.error);
        } catch (err) { setError(err.message); }
        finally { setLoad(false); }
    }, []);

    useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

    const defects = (matrix?.defects || []).filter(d =>
        (filter === 'all' || d.severity === filter) &&
        (src === 'all' || d.source === src)
    );

    const SEV_ORDER = ['critical', 'high', 'medium', 'low'];

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                        <AlertOctagon size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Severity Matrix</p>
                        <p className="text-[10px] text-slate-400 font-semibold">score = (impact × biz_value × reproducibility) ÷ fix_effort</p>
                    </div>
                </div>

                {/* URL Input */}
                <div className="flex items-center flex-1 min-w-[220px] gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchMatrix()}
                        placeholder="https://your-app.com  (optional filter)"
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none font-medium"
                    />
                    {url && <button onClick={() => setUrl('')} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>}
                </div>

                <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 flex-wrap">
                    {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}>
                            {f}
                        </button>
                    ))}
                </div>
                <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                    {['all', 'Functional', 'Network', 'DOM'].map(s => (
                        <button key={s} onClick={() => setSrc(s)}
                            className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all ${src === s ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>
                            {SRC_ICONS[s] || ''} {s}
                        </button>
                    ))}
                </div>
                <button onClick={fetchMatrix} disabled={loading}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-red-200">
                    {loading ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Refresh
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {loading && <div className="flex items-center justify-center h-48"><Loader size={28} className="animate-spin text-red-400" /></div>}
                {error && <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3"><XCircle size={18} className="text-red-400" /><p className="text-red-600 font-bold text-sm">{error}</p></div>}

                {matrix && !loading && (
                    <div className="space-y-5">
                        {/* Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {SEV_ORDER.map(sv => {
                                const s = SEV[sv];
                                const count = matrix.bySeverity?.[sv] || 0;
                                return (
                                    <motion.div key={sv} layout className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all"
                                        onClick={() => setFilter(filter === sv ? 'all' : sv)}
                                        style={filter === sv ? { borderColor: s.color, boxShadow: `0 0 0 2px ${s.color}33` } : {}}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                                            <p className="text-xs font-black text-slate-700 capitalize">{sv}</p>
                                        </div>
                                        <p className="text-3xl font-black" style={{ color: s.color }}>{count}</p>
                                        <ScoreBar value={count} max={matrix.total || 1} color={s.color} />
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* By source */}
                        <div className="grid grid-cols-3 gap-3">
                            {['Functional', 'Network', 'DOM'].map(src => (
                                <div key={src} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                                    <span className="text-xl">{SRC_ICONS[src]}</span>
                                    <div>
                                        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{src}</p>
                                        <p className="text-xl font-black text-slate-900">{matrix.bySource?.[src] || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Defect cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {defects.map(d => <DefectCard key={d.id} defect={d} />)}
                        </div>

                        {defects.length === 0 && (
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3">
                                <CheckCircle size={18} className="text-green-500" />
                                <div>
                                    <p className="font-black text-green-700 text-sm">No defects match this filter</p>
                                    <p className="text-[10px] text-green-500">Run functional tests, network monitor, and DOM analysis to populate the matrix.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
