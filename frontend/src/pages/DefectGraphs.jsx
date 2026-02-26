import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Loader2, RefreshCw, AlertTriangle, XCircle, CheckCircle, ChevronRight, Globe } from 'lucide-react';
import { API_BASE } from '../services/config';

const NODE_CFG = {
    page: { color: '#6366f1', bg: '#eef2ff', icon: '📄', label: 'Page' },
    element: { color: '#0ea5e9', bg: '#e0f2fe', icon: '🧩', label: 'Element' },
    action: { color: '#8b5cf6', bg: '#f3e8ff', icon: '👆', label: 'Action' },
    api: { color: '#f59e0b', bg: '#fef3c7', icon: '🔗', label: 'API' },
    failure: { color: '#ef4444', bg: '#fee2e2', icon: '💥', label: 'Failure' },
    goal: { color: '#10b981', bg: '#d1fae5', icon: '🎯', label: 'User Goal' },
    category: { color: '#ec4899', bg: '#fce7f3', icon: '🏷️', label: 'Category' },
};

const EDGE_CFG = {
    HAS: { color: '#6366f1', label: 'HAS' },
    TRIGGERS: { color: '#8b5cf6', label: 'TRIGGERS' },
    CALLS: { color: '#f59e0b', label: 'CALLS' },
    CAUSES: { color: '#ef4444', label: 'CAUSES' },
    IMPACTS: { color: '#10b981', label: 'IMPACTS' },
};

const TYPE_ORDER = ['page', 'category', 'element', 'action', 'api', 'failure', 'goal'];

// ── Dynamic force-directed graph renderer ───────────────────────────────────────
function GraphCanvas({ nodes: rawNodes, edges: rawEdges }) {
    const [selected, setSelected] = useState(null);
    const [hovered, setHovered] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const containerRef = useRef(null);
    const [dims, setDims] = useState({ w: 800, h: 520 });

    useEffect(() => {
        if (!rawNodes.length) return;

        const w = containerRef.current?.offsetWidth || 800;
        const h = 520;
        setDims({ w, h });

        // Initialize node positions with bias towards columns for sanity
        const types = {};
        TYPE_ORDER.forEach((t, i) => types[t] = i);

        let simNodes = rawNodes.map((n, i) => ({
            ...n,
            x: (w / (TYPE_ORDER.length + 1)) * (types[n.type] ?? 3) + (Math.random() * 20),
            y: h / 2 + (Math.sin(i) * 100),
            vx: 0,
            vy: 0,
            size: n.type === 'page' ? 45 : 35
        }));

        const iterations = 180;
        const repulsionForce = 18000;
        const attractionForce = 0.2;
        const damping = 0.55;

        for (let i = 0; i < iterations; i++) {
            // Repulsion
            for (let j = 0; j < simNodes.length; j++) {
                for (let k = j + 1; k < simNodes.length; k++) {
                    const n1 = simNodes[j]; const n2 = simNodes[k];
                    const dx = n1.x - n2.x; const dy = n1.y - n2.y;
                    const ds = dx * dx + dy * dy || 1;
                    const d = Math.sqrt(ds);
                    const f = repulsionForce / ds;
                    const fx = (dx / d) * f; const fy = (dy / d) * f;
                    n1.vx += fx; n1.vy += fy; n2.vx -= fx; n2.vy -= fy;
                }
            }
            // Attraction
            rawEdges.forEach(e => {
                const s = simNodes.find(n => n.id === e.from);
                const t = simNodes.find(n => n.id === e.to);
                if (s && t) {
                    const dx = t.x - s.x; const dy = t.y - s.y;
                    const d = Math.sqrt(dx * dx + dy * dy) || 1;
                    const f = (d - 100) * attractionForce;
                    const fx = (dx / d) * f; const fy = (dy / d) * f;
                    s.vx += fx; s.vy += fy; t.vx -= fx; t.vy -= fy;
                }
            });
            // Positions
            simNodes.forEach(n => {
                n.x += n.vx; n.y += n.vy;
                n.vx *= damping; n.vy *= damping;
                // Boundary box
                n.x = Math.max(50, Math.min(w - 50, n.x));
                n.y = Math.max(50, Math.min(h - 50, n.y));
            });
        }
        setNodes(simNodes);
        setEdges(rawEdges);
    }, [rawNodes, rawEdges]);

    return (
        <div ref={containerRef} className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-900 shadow-2xl min-h-[520px]">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <svg width="100%" height={dims.h} className="font-sans">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="4" markerHeight="4" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                    </marker>
                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {edges.map((edge, i) => {
                    const s = nodes.find(n => n.id === edge.from);
                    const t = nodes.find(n => n.id === edge.to);
                    if (!s || !t) return null;
                    const active = !hovered || hovered === edge.from || hovered === edge.to;
                    const ecfg = EDGE_CFG[edge.rel] || { color: '#475569' };

                    return (
                        <g key={i} opacity={active ? 1 : 0.05} className="transition-opacity duration-300">
                            <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                stroke={hovered === edge.from || hovered === edge.to ? ecfg.color : 'url(#edgeGrad)'}
                                strokeWidth={hovered === edge.from || hovered === edge.to ? 2 : 1.5}
                                markerEnd="url(#arrow)" />
                        </g>
                    );
                })}

                {nodes.map(n => {
                    const cfg = NODE_CFG[n.type] || { icon: '📍', bg: '#1e293b', color: '#94a3b8' };
                    const isSel = selected === n.id;
                    const isHov = hovered === n.id;
                    const active = !hovered || isHov || edges.some(e => (e.from === hovered && e.to === n.id) || (e.to === hovered && e.from === n.id));

                    return (
                        <g key={n.id} onClick={() => setSelected(isSel ? null : n.id)}
                            onMouseEnter={() => setHovered(n.id)} onMouseLeave={() => setHovered(null)}
                            style={{ cursor: 'pointer' }} opacity={active ? 1 : 0.2} className="transition-opacity duration-300">

                            <AnimatePresence>
                                {isHov && (
                                    <motion.circle initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                        cx={n.x} cy={n.y} r={n.size + 15} fill={cfg.color} opacity={0.1} />
                                )}
                            </AnimatePresence>

                            <motion.rect
                                initial={false}
                                animate={{
                                    scale: isHov ? 1.05 : 1,
                                    stroke: isHov || isSel ? cfg.color : '#334155',
                                    strokeWidth: isSel ? 3 : 1.5
                                }}
                                x={n.x - n.size} y={n.y - n.size / 2} width={n.size * 2} height={n.size} rx={14}
                                fill="#0f172a" />

                            <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize={16}>{cfg.icon || '📍'}</text>
                            <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize={8.5} fill={isHov ? '#fff' : '#94a3b8'} fontWeight="bold">
                                {n.label.slice(0, 16)}{n.label.length > 16 ? '…' : ''}
                            </text>
                        </g>
                    );
                })}
            </svg>

            <AnimatePresence>
                {selected && (() => {
                    const node = nodes.find(n => n.id === selected);
                    if (!node) return null;
                    const cfg = NODE_CFG[node.type] || {};
                    return (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="absolute top-8 right-8 w-72 bg-slate-800/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl z-20">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="p-3 rounded-2xl" style={{ background: cfg.bg + '11', color: cfg.color }}>{cfg.icon || '📍'}</div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{node.type}</p>
                                    <p className="text-sm font-black text-white leading-tight">{node.label}</p>
                                </div>
                            </div>

                            <div className="space-y-3 border-t border-white/5 pt-5">
                                {node.meta?.url && (
                                    <div className="flex items-start gap-2">
                                        <Globe size={10} className="text-white/20 mt-0.5" />
                                        <p className="text-[10px] text-indigo-300 break-all">{node.meta.url}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {node.meta?.severity && (
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Severity</p>
                                            <p className="text-[10px] font-black text-rose-500 uppercase">{node.meta.severity}</p>
                                        </div>
                                    )}
                                    {node.meta?.stabilityScore && (
                                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Stability</p>
                                            <p className="text-[10px] font-black text-emerald-500">{node.meta.stabilityScore}%</p>
                                        </div>
                                    )}
                                </div>
                                {node.meta?.why && (
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Insight</p>
                                        <p className="text-[10px] text-white/60 leading-relaxed">{node.meta.why}</p>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setSelected(null)} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white/70 tracking-widest hover:text-white transition-all">CLOSE VIEW</button>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}

export default function DefectGraphs({ result }) {
    const [graph, setGraph] = useState(null);
    const [loading, setLoad] = useState(false);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const { targetUrl: url } = useScanContext();

    const prevUrlRef = useRef(url);
    useEffect(() => {
        if (prevUrlRef.current !== url) {
            setGraph(null);
            setError(null);
            prevUrlRef.current = url;
        }
    }, [url]);

    const normalizeData = useCallback((g) => {
        if (!g) return null;
        const nodes = (g.nodes || []).map(n => ({
            ...n,
            id: String(n.id),
            type: n.type || 'unknown',
            label: n.label || n.id || 'Unit'
        }));
        const edges = (g.edges || g.links || []).map(e => ({
            ...e,
            from: String(e.from || e.source || ''),
            to: String(e.to || e.target || ''),
            rel: e.rel || 'HAS'
        }));
        return { ...g, nodes, edges, rootCauses: g.rootCauses || [] };
    }, []);

    const fetchGraph = useCallback(async () => {
        if (!url) return;
        setLoad(true); setError(null);
        try {
            const params = url ? `?url=${encodeURIComponent(url)}` : '';
            const res = await fetch(`${API_BASE}/api/defects/graph${params}`);
            const data = await res.json();
            if (data.success) setGraph(normalizeData(data.graph));
            else setError(data.error);
        } catch (err) { setError(err.message); }
        finally { setLoad(false); }
    }, [url, normalizeData]);

    useEffect(() => {
        if (result?.issuesSummary?.knowledgeGraph && (result.issuesSummary.knowledgeGraph.edges || result.issuesSummary.knowledgeGraph.rootCauses)) {
            setGraph(normalizeData(result.issuesSummary.knowledgeGraph));
        } else if (!graph && url && !loading) {
            fetchGraph();
        }
    }, [result, fetchGraph, graph, url, loading, normalizeData]);

    const visNodes = graph?.nodes?.filter(n => typeFilter === 'all' || n.type === typeFilter) || [];
    const edgeSet = new Set(visNodes.map(n => n.id));
    const visEdges = (graph?.edges || []).filter(e => edgeSet.has(e.from) && edgeSet.has(e.to));

    const SEV_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">
            <div className="bg-white border-b border-slate-100 px-6 py-5 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <GitBranch size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-base font-black text-slate-800 tracking-tight">Defect Knowledge Engine</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Neural Intelligence Mapping</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1">
                        {['all', ...TYPE_ORDER].map(t => {
                            const cfg = NODE_CFG[t];
                            const active = typeFilter === t;
                            return (
                                <button key={t} onClick={() => setTypeFilter(t)}
                                    className={`text-[10px] font-black px-4 py-2 rounded-xl transition-all capitalize ${active ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {cfg ? `${cfg.icon} ${cfg.label}` : 'Unified View'}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                        <Globe size={14} className="text-indigo-500" />
                        <span className="text-[11px] font-bold text-indigo-700 max-w-[200px] truncate">{url || 'Source: Neural Core'}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
                {loading && (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 size={36} className="animate-spin text-indigo-400" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reconstructing Neural Links...</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex items-center gap-4">
                        <XCircle size={24} className="text-red-400" />
                        <div>
                            <p className="text-red-600 font-black text-sm uppercase tracking-tight">Intelligence Sync Error</p>
                            <p className="text-red-400 text-xs font-semibold">{error}</p>
                        </div>
                    </div>
                )}

                {graph && !loading && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            {['pages', 'elements', 'actions', 'apis', 'failures', 'goals', 'edges'].map(k => (
                                <div key={k} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 text-center group hover:border-indigo-200 transition-colors">
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover:text-indigo-400">{k}</p>
                                    <p className="text-2xl font-black text-slate-900">{graph.stats?.[k] ?? 0}</p>
                                </div>
                            ))}
                        </div>

                        <GraphCanvas nodes={visNodes} edges={visEdges} />

                        {graph.rootCauses?.length > 0 && (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <RefreshCw size={18} className="text-indigo-500" />
                                    <h3 className="text-lg font-black text-slate-800">Root Cause Traceability Analysis</h3>
                                    <div className="h-0.5 flex-1 bg-slate-50 ml-2" />
                                    <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full">{graph.rootCauses.length} Chains Found</span>
                                </div>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    {graph.rootCauses.map((rc, i) => {
                                        const sc = SEV_COLOR[rc.severity] || '#94a3b8';
                                        return (
                                            <div key={i} className="rounded-3xl border p-6 hover:shadow-lg transition-all" style={{ borderColor: sc + '33', background: sc + '04' }}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-[10px] font-black px-3 py-1 rounded-xl text-white shadow-sm" style={{ background: sc }}>{rc.severity?.toUpperCase()}</span>
                                                    <p className="text-sm font-black text-slate-800 flex-1">{rc.failure}</p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                                                        {rc.page && <span className="bg-white border border-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl shadow-sm">📄 {rc.page.split('/').pop() || 'index'}</span>}
                                                        {rc.element && <><ChevronRight size={10} className="text-slate-300" /><span className="bg-white border border-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl shadow-sm">🧩 {rc.element}</span></>}
                                                        {rc.action && <><ChevronRight size={10} className="text-slate-300" /><span className="bg-white border border-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl shadow-sm">👆 {rc.action}</span></>}
                                                    </div>
                                                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-100">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cause Analysis</p>
                                                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{rc.reason || 'Intelligence extraction complete. Root impact detected in primary workflow.'}</p>
                                                    </div>
                                                    {rc.suggestions?.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remediation Steps</p>
                                                            {rc.suggestions.map((s, j) => (
                                                                <div key={j} className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                                                                    {s}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(!graph.rootCauses || graph.rootCauses.length === 0) && (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-10 text-center">
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black text-emerald-800 mb-2">Neural Scan Perfect</h3>
                                <p className="text-sm text-emerald-600 max-w-md mx-auto font-medium">No behavioral anomalies or defect clusters detected. The system is operating within optimal parameters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
