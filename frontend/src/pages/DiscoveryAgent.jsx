import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Globe, X, Zap, Link2, Database, Clock,
    ExternalLink, Hash, CheckCircle, XCircle, Loader, Terminal,
    Map, Layers, Eye, Lock, GitBranch, Network,
    BarChart2, FileText, List, LayoutGrid, ChevronDown,
    Settings, Monitor, Smartphone, Tablet, AlertTriangle,
    Radio, Shield, Activity, RefreshCw, Filter
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000';

const PAGE_TYPES = {
    form: { color: '#6366f1', bg: '#eef2ff', label: 'Form', icon: FileText },
    dashboard: { color: '#0ea5e9', bg: '#e0f2fe', label: 'Dashboard', icon: LayoutGrid },
    list: { color: '#10b981', bg: '#d1fae5', label: 'List', icon: List },
    wizard: { color: '#f59e0b', bg: '#fef3c7', label: 'Wizard', icon: Layers },
    report: { color: '#ec4899', bg: '#fce7f3', label: 'Report', icon: BarChart2 },
    auth: { color: '#8b5cf6', bg: '#ede9fe', label: 'Auth', icon: Lock },
    api: { color: '#14b8a6', bg: '#ccfbf1', label: 'API', icon: Database },
    unknown: { color: '#94a3b8', bg: '#f1f5f9', label: 'Page', icon: Globe },
};

const LOG_STYLES = {
    info: { color: '#6366f1', bg: '#eef2ff', icon: '●' },
    visiting: { color: '#0ea5e9', bg: '#e0f2fe', icon: '→' },
    found: { color: '#10b981', bg: '#d1fae5', icon: '✓' },
    api: { color: '#f59e0b', bg: '#fef3c7', icon: '⬡' },
    queued: { color: '#94a3b8', bg: '#f1f5f9', icon: '+' },
    error: { color: '#ef4444', bg: '#fee2e2', icon: '✗' },
    success: { color: '#10b981', bg: '#d1fae5', icon: '★' },
    warn: { color: '#f97316', bg: '#fff7ed', icon: '⚠' },
};

const STATUS_COLOR = (s) => s === 0 ? '#94a3b8' : s < 300 ? '#10b981' : s < 400 ? '#f59e0b' : '#ef4444';
const STATUS_BG = (s) => s === 0 ? '#f1f5f9' : s < 300 ? '#d1fae5' : s < 400 ? '#fef3c7' : '#fee2e2';

// ─── Force-directed graph (pure SVG, no external lib) ────────────────────────

function useForceGraph(pages, edges) {
    const WIDTH = 780;
    const HEIGHT = 420;
    const [positions, setPositions] = useState({});
    const rafRef = useRef(null);
    const posRef = useRef({});

    useEffect(() => {
        if (pages.length === 0) { setPositions({}); return; }

        // Initialize new nodes at center with small random offset
        pages.forEach(p => {
            if (!posRef.current[p.id]) {
                posRef.current[p.id] = {
                    x: WIDTH / 2 + (Math.random() - 0.5) * 120,
                    y: HEIGHT / 2 + (Math.random() - 0.5) * 120,
                    vx: 0, vy: 0,
                };
            }
        });

        // Remove stale nodes
        const ids = new Set(pages.map(p => p.id));
        Object.keys(posRef.current).forEach(id => { if (!ids.has(id)) delete posRef.current[id]; });

        const simulate = () => {
            const pos = posRef.current;
            const nodeIds = Object.keys(pos);
            const REPULSION = 4800;
            const LINK_DIST = 110;
            const LINK_SPRING = 0.06;
            const GRAVITY = 0.03;
            const DAMPING = 0.82;

            // Repulsion between all pairs
            for (let i = 0; i < nodeIds.length; i++) {
                for (let j = i + 1; j < nodeIds.length; j++) {
                    const a = pos[nodeIds[i]], b = pos[nodeIds[j]];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = REPULSION / (dist * dist);
                    const fx = (dx / dist) * force, fy = (dy / dist) * force;
                    a.vx += fx; a.vy += fy;
                    b.vx -= fx; b.vy -= fy;
                }
            }

            // Link attraction
            edges.forEach(({ from, to }) => {
                const a = pos[from], b = pos[to];
                if (!a || !b) return;
                const dx = b.x - a.x, dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = (dist - LINK_DIST) * LINK_SPRING;
                const fx = (dx / dist) * force, fy = (dy / dist) * force;
                a.vx += fx; a.vy += fy;
                b.vx -= fx; b.vy -= fy;
            });

            // Gravity to center + damping + boundary
            nodeIds.forEach(id => {
                const n = pos[id];
                n.vx += (WIDTH / 2 - n.x) * GRAVITY;
                n.vy += (HEIGHT / 2 - n.y) * GRAVITY;
                n.vx *= DAMPING; n.vy *= DAMPING;
                n.x = Math.max(32, Math.min(WIDTH - 32, n.x + n.vx));
                n.y = Math.max(32, Math.min(HEIGHT - 32, n.y + n.vy));
            });

            setPositions({ ...pos });
            rafRef.current = requestAnimationFrame(simulate);
        };

        rafRef.current = requestAnimationFrame(simulate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [pages.length, edges.length]);

    return { positions, WIDTH, HEIGHT };
}

// ─── Force Graph Component ────────────────────────────────────────────────────

const ForceGraph = ({ pages, edges, selectedPage, onSelectPage }) => {
    const { positions, WIDTH, HEIGHT } = useForceGraph(pages, edges);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const svgRef = useRef(null);
    const dragging = useRef(false);
    const last = useRef(null);

    const onWheel = (e) => {
        e.preventDefault();
        setScale(s => Math.min(2.8, Math.max(0.3, s - e.deltaY * 0.001)));
    };
    const onMd = (e) => {
        if (e.target === svgRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
            dragging.current = true;
            last.current = { x: e.clientX, y: e.clientY };
        }
    };
    const onMm = (e) => {
        if (!dragging.current) return;
        const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        last.current = { x: e.clientX, y: e.clientY };
    };
    const onMu = () => { dragging.current = false; };

    return (
        <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#fafbff]">
            {/* Grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <pattern id="dg" width="28" height="28" patternUnits="userSpaceOnUse">
                        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dg)" />
            </svg>

            {pages.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <Map size={28} className="text-indigo-300" />
                    </div>
                    <p className="text-slate-400 font-semibold text-sm">Crawl map appears here</p>
                    <p className="text-slate-300 text-xs mt-1">Start a scan to visualise the navigation graph</p>
                </div>
            )}

            <svg
                ref={svgRef}
                className="absolute inset-0 w-full h-full"
                style={{ cursor: dragging.current ? 'grabbing' : 'grab' }}
                onWheel={onWheel} onMouseDown={onMd} onMouseMove={onMm}
                onMouseUp={onMu} onMouseLeave={onMu}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#cbd5e1" />
                    </marker>
                </defs>
                <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                    {/* Edges */}
                    {edges.map((e, i) => {
                        const a = positions[e.from], b = positions[e.to];
                        if (!a || !b) return null;
                        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                            stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="4 3"
                            markerEnd="url(#arr)" opacity="0.7" />;
                    })}
                    {/* Nodes */}
                    {pages.map((p, i) => {
                        const pos = positions[p.id];
                        if (!pos) return null;
                        const pt = PAGE_TYPES[p.pageType] || PAGE_TYPES.unknown;
                        const isSelected = selectedPage?.id === p.id;
                        const isRoot = i === 0;
                        const r = isRoot ? 24 : 18;
                        return (
                            <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => onSelectPage(p)}>
                                {isSelected && <circle cx={pos.x} cy={pos.y} r={r + 9} fill={pt.color} opacity="0.13" />}
                                {isRoot && (
                                    <circle cx={pos.x} cy={pos.y} r={r + 13} fill={pt.color} opacity="0.07">
                                        <animate attributeName="r" values={`${r + 8};${r + 18};${r + 8}`} dur="2.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.1;0;0.1" dur="2.5s" repeatCount="indefinite" />
                                    </circle>
                                )}
                                <circle cx={pos.x} cy={pos.y} r={r}
                                    fill={isSelected ? pt.color : 'white'}
                                    stroke={pt.color} strokeWidth={isSelected ? 0 : 2.5}
                                    filter={isSelected ? `drop-shadow(0 0 8px ${pt.color}70)` : undefined}
                                />
                                {!isRoot && (
                                    <circle cx={pos.x + r - 5} cy={pos.y - r + 5} r={5} fill={pt.color} />
                                )}
                                <text x={pos.x} y={pos.y + r + 14} textAnchor="middle"
                                    fontSize="8" fontWeight="700" fill="#64748b" fontFamily="monospace">
                                    {(() => {
                                        try { const path = new URL(p.url).pathname; return path.length > 18 ? path.slice(0, 17) + '…' : path; }
                                        catch { return p.url.slice(0, 18); }
                                    })()}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 p-2.5 flex flex-wrap gap-x-3 gap-y-1.5 max-w-[260px] shadow-sm">
                {Object.entries(PAGE_TYPES).filter(([k]) => k !== 'unknown').map(([key, pt]) => (
                    <div key={key} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: pt.color }} />
                        <span className="text-[9px] font-semibold text-slate-500">{pt.label}</span>
                    </div>
                ))}
            </div>

            {/* Zoom controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1">
                {[{ l: '+', fn: () => setScale(s => Math.min(2.8, s + 0.15)) },
                { l: '−', fn: () => setScale(s => Math.max(0.3, s - 0.15)) },
                { l: '⟳', fn: () => { setPan({ x: 0, y: 0 }); setScale(1); } }].map(({ l, fn }) => (
                    <button key={l} onClick={fn}
                        className="w-7 h-7 bg-white border border-slate-200 rounded-lg text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center">
                        {l}
                    </button>
                ))}
            </div>
            <div className="absolute top-3 left-3 bg-white/80 px-2 py-1 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-400">
                {pages.length} nodes · Scroll=zoom · Drag=pan
            </div>
        </div>
    );
};

// ─── Page Insights Drawer ─────────────────────────────────────────────────────

const PageDrawer = ({ page, onClose }) => {
    if (!page) return null;
    const pt = PAGE_TYPES[page.pageType] || PAGE_TYPES.unknown;
    const Icon = pt.icon;
    return (
        <AnimatePresence>
            <motion.div
                key="drawer"
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                className="absolute right-0 top-0 h-full w-[280px] bg-white border-l border-slate-100 shadow-2xl z-20 flex flex-col overflow-y-auto"
            >
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: pt.bg }}>
                                <Icon size={15} style={{ color: pt.color }} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-wider" style={{ color: pt.color }}>{pt.label}</span>
                        </div>
                        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                    <p className="font-mono text-xs font-bold text-slate-800 break-all leading-relaxed">{page.url}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: STATUS_BG(page.statusCode), color: STATUS_COLOR(page.statusCode) }}>
                            {page.statusCode || '—'}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-mono text-slate-400">{page.loadTime ? `${page.loadTime}ms` : '—'}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-semibold text-slate-500">Depth {page.depth}</span>
                    </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                    {[
                        { label: 'Links', value: page.links ?? '—', icon: Link2, color: '#10b981' },
                        { label: 'APIs', value: page.apis ?? '—', icon: Database, color: '#0ea5e9' },
                        { label: 'Forms', value: page.forms ?? '—', icon: FileText, color: '#6366f1' },
                        { label: 'Errors', value: page.errors ?? '—', icon: XCircle, color: '#ef4444' },
                    ].map(({ label, value, icon: Ic, color }) => (
                        <div key={label} className="bg-slate-50 rounded-xl p-3">
                            <Ic size={14} style={{ color }} className="mb-1" />
                            <p className="text-base font-black text-slate-900">{value}</p>
                            <p className="text-[10px] font-semibold text-slate-400">{label}</p>
                        </div>
                    ))}
                </div>
                {page.title && (
                    <div className="px-4 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Page Title</p>
                        <p className="text-xs text-slate-700 font-medium">{page.title}</p>
                    </div>
                )}
                {page.error && (
                    <div className="mx-4 mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[10px] font-black text-red-400 uppercase mb-1">Error</p>
                        <p className="text-xs text-red-700 font-mono break-all">{page.error}</p>
                    </div>
                )}
                {page.discoveredFrom && (
                    <div className="px-4 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Discovered From</p>
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{page.discoveredFrom}</span>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Log Console ──────────────────────────────────────────────────────────────

const LogConsole = ({ logs, isScanning }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, [logs.length]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-700">Crawl Console</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{logs.length} events</span>
                </div>
                {isScanning && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            </div>
            <div ref={ref} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 bg-[#0f172a] font-mono"
                style={{ scrollBehavior: 'smooth' }}>
                {logs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <Terminal size={20} className="text-slate-600 mb-2" />
                        <p className="text-slate-500 text-xs">Logs stream here during scan</p>
                    </div>
                )}
                {logs.map((log, i) => {
                    const s = LOG_STYLES[log.level] || LOG_STYLES.info;
                    return (
                        <div key={i} className="flex items-start gap-2 py-0.5">
                            <span className="text-[11px] font-black mt-0.5 shrink-0" style={{ color: s.color }}>{s.icon}</span>
                            <span className="text-[11px] leading-relaxed break-all" style={{ color: log.level === 'error' ? '#fca5a5' : log.level === 'success' ? '#86efac' : log.level === 'found' ? '#6ee7b7' : '#94a3b8' }}>
                                {log.text}
                            </span>
                        </div>
                    );
                })}
                {isScanning && (
                    <div className="flex items-center gap-2 py-0.5">
                        <Loader size={10} className="text-indigo-400 animate-spin shrink-0" />
                        <span className="text-[11px] text-slate-500 animate-pulse">Processing…</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Discovered Pages Table ───────────────────────────────────────────────────

const PagesTable = ({ pages, selectedPage, onSelectPage }) => {
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState({ key: null, dir: 1 });
    const typeOptions = ['all', ...Object.keys(PAGE_TYPES).filter(k => pages.some(p => p.pageType === k))];

    const filtered = useMemo(() => {
        let rows = filter === 'all' ? pages : pages.filter(p => p.pageType === filter);
        if (sort.key) {
            rows = [...rows].sort((a, b) => {
                const av = a[sort.key] ?? 0, bv = b[sort.key] ?? 0;
                return (av > bv ? 1 : -1) * sort.dir;
            });
        }
        return rows;
    }, [pages, filter, sort]);

    const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key ? -s.dir : 1 }));

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 flex-wrap shrink-0">
                <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-slate-400" />
                    <span className="text-xs font-black text-slate-600">Filter:</span>
                </div>
                {typeOptions.map(t => {
                    const pt = PAGE_TYPES[t];
                    return (
                        <button key={t} onClick={() => setFilter(t)}
                            className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-colors capitalize ${filter === t ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            style={filter === t ? { background: pt?.color || '#6366f1' } : {}}>
                            {t}
                        </button>
                    );
                })}
                <span className="ml-auto text-[10px] text-slate-400 font-semibold">{filtered.length} pages</span>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-xs">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 border-b border-slate-100 text-left">
                            {[
                                { label: 'URL', key: 'url' },
                                { label: 'Status', key: 'statusCode' },
                                { label: 'Type', key: 'pageType' },
                                { label: 'Load Time', key: 'loadTime' },
                                { label: 'Depth', key: 'depth' },
                                { label: 'Links / APIs', key: null },
                                { label: 'Errors', key: 'errors' },
                            ].map(({ label, key }) => (
                                <th key={label}
                                    onClick={() => key && toggleSort(key)}
                                    className={`px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap ${key ? 'cursor-pointer hover:text-slate-600 select-none' : ''}`}>
                                    {label} {key && sort.key === key ? (sort.dir === 1 ? '↑' : '↓') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-10 text-slate-300 text-xs font-semibold">No pages discovered yet</td></tr>
                        )}
                        {filtered.map((p) => {
                            const pt = PAGE_TYPES[p.pageType] || PAGE_TYPES.unknown;
                            const Icon = pt.icon;
                            const isSelected = selectedPage?.id === p.id;
                            return (
                                <tr key={p.id}
                                    onClick={() => onSelectPage(p)}
                                    className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                                    <td className="px-3 py-2.5 max-w-[200px]">
                                        <p className="font-mono text-slate-700 font-medium truncate"
                                            title={p.url}>
                                            {(() => { try { return new URL(p.url).pathname || '/'; } catch { return p.url; } })()}
                                        </p>
                                        {p.title && <p className="text-slate-400 text-[10px] truncate mt-0.5">{p.title}</p>}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className="px-1.5 py-0.5 rounded-md font-black"
                                            style={{ background: STATUS_BG(p.statusCode), color: STATUS_COLOR(p.statusCode) }}>
                                            {p.statusCode || '—'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: pt.bg }}>
                                                <Icon size={10} style={{ color: pt.color }} />
                                            </div>
                                            <span className="font-semibold text-slate-600">{pt.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 font-mono text-slate-500">
                                        {p.loadTime ? `${p.loadTime}ms` : '—'}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <span className="font-bold text-slate-500">{p.depth}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-500">
                                        {p.links ?? '—'} / {p.apis ?? '—'}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {p.errors > 0
                                            ? <span className="text-red-500 font-black">{p.errors}</span>
                                            : <span className="text-green-500 font-bold">0</span>
                                        }
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Config Panel ─────────────────────────────────────────────────────────────

const ConfigPanel = ({ config, onChange, disabled }) => {
    const devices = [
        { id: 'desktop', icon: Monitor, label: 'Desktop' },
        { id: 'mobile', icon: Smartphone, label: 'Mobile' },
        { id: 'tablet', icon: Tablet, label: 'Tablet' },
    ];
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end"
        >
            {/* Crawl Depth */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Crawl Depth</label>
                <div className="flex items-center gap-2">
                    <input type="range" min="1" max="10" value={config.maxDepth} disabled={disabled}
                        onChange={e => onChange('maxDepth', Number(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer" />
                    <span className="text-sm font-black text-indigo-600 w-4 text-center">{config.maxDepth}</span>
                </div>
            </div>

            {/* Max Pages */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Max Pages</label>
                <div className="flex items-center gap-2">
                    <input type="range" min="5" max="50" step="5" value={config.maxPages} disabled={disabled}
                        onChange={e => onChange('maxPages', Number(e.target.value))}
                        className="flex-1 accent-indigo-500 cursor-pointer" />
                    <span className="text-sm font-black text-indigo-600 w-6 text-center">{config.maxPages}</span>
                </div>
            </div>

            {/* Device Profile */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Device</label>
                <div className="flex gap-1">
                    {devices.map(d => {
                        const Icon = d.icon;
                        const active = config.deviceProfile === d.id;
                        return (
                            <button key={d.id} onClick={() => onChange('deviceProfile', d.id)} disabled={disabled}
                                title={d.label}
                                className={`flex-1 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                <Icon size={13} />
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Subdomains Toggle */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Include Subdomains</label>
                <button
                    onClick={() => onChange('includeSubdomains', !config.includeSubdomains)}
                    disabled={disabled}
                    className={`w-10 h-6 rounded-full transition-all relative ${config.includeSubdomains ? 'bg-green-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.includeSubdomains ? 'left-5' : 'left-1'}`} />
                </button>
            </div>

            {/* Auth Required Toggle */}
            <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Auth Required</label>
                <button
                    onClick={() => onChange('requiresAuth', !config.requiresAuth)}
                    disabled={disabled}
                    className={`w-10 h-6 rounded-full transition-all relative ${config.requiresAuth ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.requiresAuth ? 'left-5' : 'left-1'}`} />
                </button>
            </div>

            {/* Status */}
            <div className="flex flex-col justify-end">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Profile</label>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Shield size={12} className="text-indigo-400" />
                    {config.deviceProfile} · depth {config.maxDepth}
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DiscoveryAgent() {
    const { targetUrl: url } = useTargetUrl();
    const [isScanning, setIsScanning] = useState(false);
    const [scanDone, setScanDone] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState({ maxDepth: 3, maxPages: 20, includeSubdomains: false, requiresAuth: false, deviceProfile: 'desktop' });
    const [pages, setPages] = useState([]);
    const [edges, setEdges] = useState([]);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [selectedPage, setSelectedPage] = useState(null);
    const [showDrawer, setShowDrawer] = useState(false);
    const [activeTab, setActiveTab] = useState('graph');
    const [elapsed, setElapsed] = useState(0);
    const [error, setError] = useState(null);

    const timerRef = useRef(null);
    const abortRef = useRef(null);
    const scanStart = useRef(null);

    const handleConfigChange = (key, val) => setConfig(c => ({ ...c, [key]: val }));

    const handleSelectPage = (p) => {
        setSelectedPage(p);
        setShowDrawer(true);
    };

    const startScan = useCallback(async () => {
        if (!url) return;
        setIsScanning(true);
        setScanDone(false);
        setPages([]);
        setEdges([]);
        setLogs([]);
        setProgress(2);
        setProgressStage('Launching browser…');
        setSelectedPage(null);
        setShowDrawer(false);
        setError(null);
        setElapsed(0);
        scanStart.current = Date.now();

        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - scanStart.current) / 1000));
        }, 1000);

        // Use fetch with SSE
        try {
            abortRef.current = new AbortController();
            const response = await fetch(`${API_BASE}/api/discovery/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, ...config }),
                signal: abortRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        if (event.type === 'log') {
                            setLogs(prev => [...prev, { level: event.level, text: event.text }]);
                        } else if (event.type === 'page') {
                            setPages(prev => [...prev, event.page]);
                        } else if (event.type === 'progress') {
                            setProgress(event.value);
                            setProgressStage(event.stage || '');
                        } else if (event.type === 'done') {
                            if (event.edges) setEdges(event.edges);
                            setProgress(100);
                            setProgressStage(event.success ? 'Scan complete' : 'Scan failed');
                            if (!event.success && event.error) setError(event.error);
                        } else if (event.type === 'error') {
                            setError(event.message);
                        }
                    } catch (_) { /* malformed SSE line */ }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                const msg = err.message || 'Connection failed';
                setError(msg);
                setLogs(prev => [...prev, { level: 'error', text: `Fatal: ${msg}` }]);
            }
        } finally {
            clearInterval(timerRef.current);
            setIsScanning(false);
            setScanDone(true);
        }
    }, [url, config]);

    const stopScan = useCallback(() => {
        if (abortRef.current) abortRef.current.abort();
        clearInterval(timerRef.current);
        setIsScanning(false);
        setScanDone(pages.length > 0);
        setProgressStage('Stopped');
        setLogs(prev => [...prev, { level: 'warn', text: '⏹ Scan stopped by user' }]);
    }, [pages.length]);

    useEffect(() => () => {
        clearInterval(timerRef.current);
        if (abortRef.current) abortRef.current.abort();
    }, []);

    const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const stats = useMemo(() => ({
        total: pages.length,
        apis: pages.reduce((a, p) => a + (p.apis || 0), 0),
        errors: pages.reduce((a, p) => a + (p.errors || 0), 0),
        types: Object.fromEntries(Object.keys(PAGE_TYPES).map(k => [k, pages.filter(p => p.pageType === k).length])),
    }), [pages]);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">

            {/* ── Top Input Bar ──────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 flex-wrap shadow-sm">
                {/* URL */}
                <div className="flex-1 min-w-[300px] flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5
                    focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
                    <Globe size={15} className="text-slate-400 shrink-0" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !isScanning && startScan()}
                        placeholder="https://your-app.com"
                        disabled={isScanning}
                        className="flex-1 bg-transparent text-sm font-mono text-slate-800 placeholder-slate-400 outline-none"
                    />
                    {url && !isScanning && (
                        <button onClick={() => setUrl('')} className="text-slate-300 hover:text-slate-500 transition-colors">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Config toggle */}
                <button
                    onClick={() => setShowConfig(v => !v)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${showConfig ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    <Settings size={14} />
                    Config
                    <ChevronDown size={12} className={`transition-transform ${showConfig ? 'rotate-180' : ''}`} />
                </button>

                {/* Run / Stop */}
                {!isScanning ? (
                    <button
                        onClick={startScan}
                        disabled={!url}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                        <Play size={15} strokeWidth={3} />
                        Start Scan
                    </button>
                ) : (
                    <button
                        onClick={stopScan}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-red-200 hover:scale-[1.02] active:scale-95 whitespace-nowrap">
                        <Square size={14} strokeWidth={3} fill="currentColor" />
                        Stop
                    </button>
                )}

                {/* Status */}
                {(isScanning || scanDone) && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${isScanning ? 'bg-indigo-50 text-indigo-600' : error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {isScanning
                            ? <><Loader size={12} className="animate-spin" /> {progressStage || 'Scanning'} · {fmt(elapsed)}</>
                            : error
                                ? <><XCircle size={12} /> {error.slice(0, 40)}</>
                                : <><CheckCircle size={12} /> Done · {fmt(elapsed)}</>
                        }
                    </div>
                )}
            </div>

            {/* ── Config Panel (expandable) ─────────────────────────────── */}
            <AnimatePresence>
                {showConfig && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-white border-b border-slate-100 px-6 py-4">
                        <ConfigPanel config={config} onChange={handleConfigChange} disabled={isScanning} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Progress Bar ─────────────────────────────────────────── */}
            {(isScanning || (scanDone && progress > 0)) && (
                <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            className="h-1.5 rounded-full"
                            style={{ background: error ? '#ef4444' : 'linear-gradient(90deg, #6366f1, #0ea5e9)' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-8 text-right">{progress}%</span>
                    {progressStage && <span className="text-[10px] text-slate-400 font-semibold hidden sm:block">{progressStage}</span>}
                </div>
            )}

            {/* ── Metric Cards ─────────────────────────────────────────── */}
            <div className="px-6 pt-4 pb-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Pages Found', value: stats.total, color: '#6366f1', bg: '#eef2ff', icon: Map, sub: 'BFS discovered' },
                    { label: 'API Calls', value: stats.apis, color: '#0ea5e9', bg: '#e0f2fe', icon: Database, sub: 'Intercepted' },
                    { label: 'Graph Edges', value: edges.length, color: '#10b981', bg: '#d1fae5', icon: GitBranch, sub: 'Connections' },
                    { label: 'Page Errors', value: stats.errors, color: '#ef4444', bg: '#fee2e2', icon: AlertTriangle, sub: 'JS / Network' },
                ].map((m, i) => (
                    <motion.div key={m.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                            <m.icon size={18} style={{ color: m.color }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
                            <p className="text-xl font-black text-slate-900">{m.value}</p>
                            <p className="text-[10px] text-slate-400">{m.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Main Body ────────────────────────────────────────────── */}
            <div className="flex-1 px-6 pb-6 flex gap-4 min-h-0 overflow-hidden">

                {/* Left: Graph + Table tabs */}
                <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
                    {/* Tab switcher */}
                    <div className="flex gap-2">
                        {[{ id: 'graph', icon: Map, label: 'Force Graph' }, { id: 'table', icon: List, label: 'Pages Table' }].map(t => {
                            const Icon = t.icon;
                            return (
                                <button key={t.id} onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    <Icon size={13} />{t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
                        {activeTab === 'graph' ? (
                            <>
                                <ForceGraph pages={pages} edges={edges} selectedPage={selectedPage} onSelectPage={handleSelectPage} />
                                {showDrawer && selectedPage && (
                                    <PageDrawer page={selectedPage} onClose={() => { setShowDrawer(false); setSelectedPage(null); }} />
                                )}
                            </>
                        ) : (
                            <PagesTable pages={pages} selectedPage={selectedPage} onSelectPage={handleSelectPage} />
                        )}
                    </div>
                </div>

                {/* Right: Log Console */}
                <div className="w-[300px] bg-white rounded-2xl border border-slate-100 shadow-sm shrink-0 flex flex-col overflow-hidden">
                    <LogConsole logs={logs} isScanning={isScanning} />
                    {/* Log legend */}
                    <div className="px-3 py-2.5 border-t border-slate-800 bg-[#0f172a] grid grid-cols-3 gap-1.5">
                        {Object.entries(LOG_STYLES).slice(0, 6).map(([key, s]) => (
                            <div key={key} className="flex items-center gap-1" title={key}>
                                <span className="text-[10px] shrink-0 font-black" style={{ color: s.color }}>{s.icon}</span>
                                <span className="text-[9px] text-slate-500 font-semibold capitalize truncate">{key}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
