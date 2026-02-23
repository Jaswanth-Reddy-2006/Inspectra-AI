import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion } from 'framer-motion';
import { GitBranch, Loader, RefreshCw, AlertTriangle, XCircle, CheckCircle, ChevronRight, Globe } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const NODE_CFG = {
    page: { color: '#6366f1', bg: '#eef2ff', icon: '📄', label: 'Page' },
    element: { color: '#0ea5e9', bg: '#e0f2fe', icon: '🧩', label: 'Element' },
    action: { color: '#8b5cf6', bg: '#f3e8ff', icon: '👆', label: 'Action' },
    api: { color: '#f59e0b', bg: '#fef3c7', icon: '🔗', label: 'API' },
    failure: { color: '#ef4444', bg: '#fee2e2', icon: '💥', label: 'Failure' },
    goal: { color: '#10b981', bg: '#d1fae5', icon: '🎯', label: 'User Goal' },
};

const EDGE_CFG = {
    HAS: { color: '#6366f1', label: 'HAS' },
    TRIGGERS: { color: '#8b5cf6', label: 'TRIGGERS' },
    CALLS: { color: '#f59e0b', label: 'CALLS' },
    CAUSES: { color: '#ef4444', label: 'CAUSES' },
    IMPACTS: { color: '#10b981', label: 'IMPACTS' },
};

const TYPE_ORDER = ['page', 'element', 'action', 'api', 'failure', 'goal'];

// ── Simple column-layout graph renderer ───────────────────────────────────────
function GraphCanvas({ nodes, edges }) {
    const [selected, setSelected] = useState(null);
    const svgRef = useRef(null);
    const COL_W = 180;
    const ROW_H = 60;
    const PAD = 40;

    // Position nodes in columns by type
    const cols = {};
    TYPE_ORDER.forEach((t, ci) => { cols[t] = ci; });
    const colCount = {};
    const positions = {};
    nodes.forEach(n => {
        const ci = cols[n.type] ?? 5;
        const ri = colCount[ci] ?? 0;
        colCount[ci] = ri + 1;
        positions[n.id] = { x: PAD + ci * COL_W + 70, y: PAD + ri * ROW_H + 30 };
    });
    const svgH = Math.max(400, (Math.max(...Object.values(colCount), 1)) * ROW_H + 80);
    const svgW = PAD * 2 + TYPE_ORDER.length * COL_W + 80;

    return (
        <div className="relative overflow-auto rounded-2xl border border-slate-100 bg-slate-50">
            <svg ref={svgRef} width={svgW} height={svgH} className="font-sans">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                        markerWidth="5" markerHeight="5" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                    </marker>
                </defs>

                {/* Column headers */}
                {TYPE_ORDER.map((t, ci) => {
                    const cfg = NODE_CFG[t] || {};
                    return (
                        <g key={t}>
                            <rect x={PAD + ci * COL_W + 10} y={4} width={140} height={22} rx={8}
                                fill={cfg.bg} stroke={cfg.color} strokeWidth={1} />
                            <text x={PAD + ci * COL_W + 80} y={18} textAnchor="middle"
                                fontSize={9} fontWeight="bold" fill={cfg.color}>
                                {cfg.icon} {cfg.label}
                            </text>
                        </g>
                    );
                })}

                {/* Edges */}
                {edges.map((edge, i) => {
                    const fp = positions[edge.from]; const tp = positions[edge.to];
                    if (!fp || !tp) return null;
                    const ecfg = EDGE_CFG[edge.rel] || { color: '#94a3b8', label: edge.rel };
                    const mx = (fp.x + tp.x) / 2; const my = (fp.y + tp.y) / 2;
                    return (
                        <g key={i} opacity={selected && selected !== edge.from && selected !== edge.to ? 0.15 : 1}>
                            <line x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                                stroke={ecfg.color} strokeWidth={1.5} strokeDasharray={edge.rel === 'CAUSES' ? '4,3' : 'none'}
                                markerEnd="url(#arrow)" opacity={0.6} />
                            <text x={mx} y={my - 4} textAnchor="middle" fontSize={7} fill={ecfg.color} fontWeight="bold">{ecfg.label}</text>
                        </g>
                    );
                })}

                {/* Nodes */}
                {nodes.map(n => {
                    const p = positions[n.id]; if (!p) return null;
                    const cfg = NODE_CFG[n.type] || {};
                    const sel = selected === n.id;
                    return (
                        <g key={n.id} onClick={() => setSelected(sel ? null : n.id)} style={{ cursor: 'pointer' }}
                            opacity={selected && !sel ? 0.25 : 1}>
                            <rect x={p.x - 60} y={p.y - 16} width={120} height={32} rx={10}
                                fill={sel ? cfg.color : cfg.bg}
                                stroke={cfg.color} strokeWidth={sel ? 2 : 1}
                                filter={sel ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' : undefined} />
                            <text x={p.x} y={p.y - 3} textAnchor="middle" fontSize={8}>{cfg.icon}</text>
                            <text x={p.x} y={p.y + 9} textAnchor="middle" fontSize={7.5}
                                fill={sel ? '#fff' : '#334155'} fontWeight="600">
                                {n.label.slice(0, 18)}{n.label.length > 18 ? '…' : ''}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Selected node detail */}
            {selected && (() => {
                const node = nodes.find(n => n.id === selected);
                if (!node) return null;
                const cfg = NODE_CFG[node.type] || {};
                const connEdges = edges.filter(e => e.from === selected || e.to === selected);
                return (
                    <div className="absolute top-3 right-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span>{cfg.icon}</span>
                            <p className="text-xs font-black text-slate-800">{node.label}</p>
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full ml-auto" style={{ background: cfg.bg, color: cfg.color }}>{node.type}</span>
                        </div>
                        {node.meta?.why && <p className="text-[10px] text-slate-500 leading-snug mb-2">{node.meta.why}</p>}
                        {node.meta?.severity && (
                            <p className="text-[9px] font-bold text-slate-500">Severity: <span className="text-red-500">{node.meta.severity}</span></p>
                        )}
                        {connEdges.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Connections</p>
                                {connEdges.slice(0, 4).map((e, i) => (
                                    <div key={i} className="text-[9px] text-slate-500 flex items-center gap-1">
                                        <span style={{ color: (EDGE_CFG[e.rel] || {}).color || '#94a3b8' }} className="font-bold">{e.rel}</span>
                                        <ChevronRight size={8} />
                                        <span className="truncate">{nodes.find(n => n.id === (e.from === selected ? e.to : e.from))?.label?.slice(0, 25)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

export default function DefectGraphs() {
    const [graph, setGraph] = useState(null);
    const [loading, setLoad] = useState(false);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const { targetUrl: url } = useTargetUrl();

    const fetchGraph = useCallback(async () => {
        setLoad(true); setError(null);
        try {
            const params = url ? `?url=${encodeURIComponent(url)}` : '';
            const res = await fetch(`${API_BASE}/api/defects/graph${params}`);
            const data = await res.json();
            if (data.success) setGraph(data.graph);
            else setError(data.error);
        } catch (err) { setError(err.message); }
        finally { setLoad(false); }
    }, []);

    useEffect(() => { fetchGraph(); }, [fetchGraph]);

    const visNodes = graph?.nodes?.filter(n => typeFilter === 'all' || n.type === typeFilter) || [];
    const edgeSet = new Set(visNodes.map(n => n.id));
    const visEdges = (graph?.edges || []).filter(e => edgeSet.has(e.from) && edgeSet.has(e.to));

    const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            <div className="bg-white border-b border-slate-100 px-6 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                        <GitBranch size={17} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Defect Knowledge Graph</p>
                        <p className="text-[10px] text-slate-400 font-semibold">Page → Element → Action → API → Failure → UserGoal</p>
                    </div>
                </div>

                {/* URL Input */}
                <div className="flex items-center flex-1 min-w-[220px] gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchGraph()}
                        placeholder="https://your-app.com  (optional filter)"
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none font-medium"
                    />
                    {url && <button onClick={() => setUrl('')} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>}
                </div>

                <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 flex-wrap">
                    {['all', ...TYPE_ORDER].map(t => {
                        const cfg = NODE_CFG[t];
                        return (
                            <button key={t} onClick={() => setTypeFilter(t)}
                                className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all capitalize ${typeFilter === t ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400'}`}>
                                {cfg ? `${cfg.icon} ${cfg.label}` : 'All'}
                            </button>
                        );
                    })}
                </div>
                <button onClick={fetchGraph} disabled={loading}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-violet-200">
                    {loading ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Rebuild
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
                {loading && (
                    <div className="flex items-center justify-center h-48">
                        <Loader size={28} className="animate-spin text-violet-400" />
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-3">
                        <XCircle size={18} className="text-red-400" />
                        <p className="text-red-600 font-bold text-sm">{error}</p>
                    </div>
                )}

                {graph && !loading && (
                    <div className="space-y-5">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {['pages', 'elements', 'actions', 'apis', 'failures', 'goals', 'edges'].map(k => (
                                <div key={k} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
                                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider capitalize">{k}</p>
                                    <p className="text-xl font-black text-slate-900">{graph.stats?.[k] ?? 0}</p>
                                </div>
                            ))}
                        </div>

                        {/* Graph */}
                        <GraphCanvas nodes={visNodes} edges={visEdges} />

                        {/* Root Causes */}
                        {graph.rootCauses?.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                <p className="text-xs font-black text-slate-700 mb-4">Root Cause Chains ({graph.rootCauses.length})</p>
                                <div className="space-y-3">
                                    {graph.rootCauses.map((rc, i) => {
                                        const sc = SEV_COLOR[rc.severity] || '#94a3b8';
                                        return (
                                            <div key={i} className="rounded-xl border p-4" style={{ borderColor: sc + '33', background: sc + '08' }}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: sc }}>{rc.severity?.toUpperCase()}</span>
                                                    <p className="text-[11px] font-black text-slate-800">{rc.failure}</p>
                                                    <span className="text-[10px] text-slate-400 ml-auto">→ {rc.goal}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] text-slate-500 flex-wrap mb-2">
                                                    {rc.page && <span className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-lg">📄 {rc.page.slice(0, 35)}</span>}
                                                    {rc.element && <><ChevronRight size={8} /><span className="bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-lg">🧩 {rc.element}</span></>}
                                                    {rc.action && <><ChevronRight size={8} /><span className="bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-lg">👆 {rc.action}</span></>}
                                                </div>
                                                {rc.reason && <p className="text-[10px] text-slate-500 leading-snug">{rc.reason}</p>}
                                                {rc.suggestions?.length > 0 && (
                                                    <div className="mt-2 space-y-0.5">
                                                        {rc.suggestions.map((s, j) => (
                                                            <p key={j} className="text-[9px] text-slate-400">→ {s}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {graph.rootCauses?.length === 0 && (
                            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3">
                                <CheckCircle size={18} className="text-green-500" />
                                <div>
                                    <p className="font-black text-green-700 text-sm">No Root Cause Chains Found</p>
                                    <p className="text-[10px] text-green-500">Run functional tests and network monitor first to populate the graph.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
