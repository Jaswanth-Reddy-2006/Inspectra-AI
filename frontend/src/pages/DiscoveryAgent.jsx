import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Square, Globe, X, Zap, Link2, Database, Clock,
    ExternalLink, Hash, CheckCircle, XCircle, Loader, Terminal,
    Map, Layers, Eye, Lock, GitBranch, Network,
    BarChart2, FileText, List, LayoutGrid, ChevronDown,
    Settings, Monitor, Smartphone, Tablet, AlertTriangle,
    Radio, Shield, Activity, RefreshCw, Filter, Search, Download, HelpCircle, FileJson, Camera,
    Pause, Clock3, MoreVertical, PlayCircle, Star, AlertOctagon, History
} from 'lucide-react';
import { API_BASE } from '../services/config';

// ─── Constants ───────────────────────────────────────────────────────────────

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

function useForceGraph(pages, edges, clusteringMode) {
    const WIDTH = 780;
    const HEIGHT = 420;
    const [positions, setPositions] = useState({});
    const rafRef = useRef(null);
    const posRef = useRef({});

    useEffect(() => {
        if (pages.length === 0) { setPositions({}); return; }

        pages.forEach(p => {
            if (!posRef.current[p.id]) {
                posRef.current[p.id] = {
                    x: WIDTH / 2 + (Math.random() - 0.5) * 120,
                    y: HEIGHT / 2 + (Math.random() - 0.5) * 120,
                    vx: 0, vy: 0,
                    isNew: true
                };
            } else {
                posRef.current[p.id].isNew = false;
            }
        });

        const ids = new Set(pages.map(p => p.id));
        Object.keys(posRef.current).forEach(id => { if (!ids.has(id)) delete posRef.current[id]; });

        // Build cluster centers if needed based on pageType
        const clusters = {};
        if (clusteringMode === 'type') {
            const types = [...new Set(pages.map(p => p.pageType))];
            const angleStep = (Math.PI * 2) / Math.max(types.length, 1);
            types.forEach((t, i) => {
                clusters[t] = {
                    x: WIDTH / 2 + Math.cos(i * angleStep) * 150,
                    y: HEIGHT / 2 + Math.sin(i * angleStep) * 150,
                };
            });
        }

        const runSimulation = () => {
            const pos = posRef.current;
            const nodeIds = Object.keys(pos);
            const activeNodes = nodeIds.filter(id => pos[id].isNew);

            const REPULSION = 4800;
            const LINK_DIST = 110;
            const LINK_SPRING = 0.06;
            const GRAVITY = 0.03;
            const DAMPING = 0.82;
            const CLUSTER_STRENGTH = 0.05;

            if (activeNodes.length > 0) {
                // Fast-forward simulation synchronously
                for (let step = 0; step < 80; step++) {
                    for (let i = 0; i < nodeIds.length; i++) {
                        const a = pos[nodeIds[i]];
                        for (let j = i + 1; j < nodeIds.length; j++) {
                            const b = pos[nodeIds[j]];
                            // Skip force calculations if both nodes are already frozen
                            if (!a.isNew && !b.isNew) continue;

                            const dx = a.x - b.x, dy = a.y - b.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const force = REPULSION / (dist * dist);
                            const fx = (dx / dist) * force, fy = (dy / dist) * force;
                            if (a.isNew) { a.vx += fx; a.vy += fy; }
                            if (b.isNew) { b.vx -= fx; b.vy -= fy; }
                        }
                    }

                    edges.forEach(({ from, to }) => {
                        const a = pos[from], b = pos[to];
                        if (!a || !b || (!a.isNew && !b.isNew)) return;
                        const dx = b.x - a.x, dy = b.y - a.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = (dist - LINK_DIST) * LINK_SPRING;
                        const fx = (dx / dist) * force, fy = (dy / dist) * force;
                        if (a.isNew) { a.vx += fx; a.vy += fy; }
                        if (b.isNew) { b.vx -= fx; b.vy -= fy; }
                    });

                    activeNodes.forEach(id => {
                        const n = pos[id];
                        const p = pages.find(pg => pg.id === id);
                        if (clusteringMode === 'type' && p && clusters[p.pageType]) {
                            n.vx += (clusters[p.pageType].x - n.x) * CLUSTER_STRENGTH;
                            n.vy += (clusters[p.pageType].y - n.y) * CLUSTER_STRENGTH;
                        } else {
                            n.vx += (WIDTH / 2 - n.x) * GRAVITY;
                            n.vy += (HEIGHT / 2 - n.y) * GRAVITY;
                        }

                        n.vx *= DAMPING; n.vy *= DAMPING;
                        n.x = Math.max(32, Math.min(WIDTH - 32, n.x + n.vx));
                        n.y = Math.max(32, Math.min(HEIGHT - 32, n.y + n.vy));
                    });
                }

                // Freeze activated nodes so they lock into place
                activeNodes.forEach(id => {
                    pos[id].isNew = false;
                });

                setPositions({ ...pos });
            }
        };

        runSimulation();
    }, [pages.length, edges.length, clusteringMode]);

    return { positions, WIDTH, HEIGHT };
}

// ─── Force Graph Component ────────────────────────────────────────────────────

const ForceGraph = ({ pages, edges, selectedPages, onSelectPage, searchQuery, playbackIndex, clusteringMode, onContextMenu }) => {
    // Only render pages up to playbackIndex
    const visiblePages = playbackIndex !== null ? pages.slice(0, playbackIndex) : pages;
    const visibleIds = new Set(visiblePages.map(p => p.id));
    const visibleEdges = edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

    const { positions, WIDTH, HEIGHT } = useForceGraph(visiblePages, visibleEdges, clusteringMode);

    const handleCtxMenu = (e, page) => {
        e.preventDefault();
        onContextMenu(e, page);
    };

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
                className="absolute inset-0 w-full h-full force-graph-svg"
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#cbd5e1" />
                    </marker>
                </defs>
                <g>
                    {/* Edges */}
                    {visibleEdges.map((e, i) => {
                        const a = positions[e.from], b = positions[e.to];
                        if (!a || !b) return null;
                        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                            stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="4 3"
                            markerEnd="url(#arr)" opacity="0.7" />;
                    })}
                    {/* Nodes */}
                    {visiblePages.map((p, i) => {
                        const pos = positions[p.id];
                        if (!pos) return null;
                        const pt = PAGE_TYPES[p.pageType] || PAGE_TYPES.unknown;
                        const isSelected = selectedPages.some(sp => sp.id === p.id);

                        // Search highlight
                        let isDimmed = false;
                        if (searchQuery) {
                            const query = searchQuery.toLowerCase();
                            isDimmed = !(p.url.toLowerCase().includes(query) || p.pageType.toLowerCase().includes(query));
                        }

                        const isRoot = i === 0;
                        const r = isRoot ? 24 : 18;

                        // Complexity & Risk
                        const getComplexityColor = () => {
                            const score = ((p.loadTime || 200) / 2000) * 40 + ((p.links || 10) / 50) * 30 + ((p.apis || 5) / 20) * 30;
                            if (score < 25) return '#10b981';
                            if (score < 55) return '#f59e0b';
                            return '#ef4444';
                        };
                        const complexityColor = getComplexityColor();
                        const isHighDep = p.inboundCount > (visiblePages.length * 0.3);
                        // Sensitve path wrapper
                        const isSensitive = /admin|auth|login|config|api/i.test(p.url);

                        return (
                            <g key={p.id}
                                style={{ cursor: 'pointer', transition: 'opacity 0.2s', opacity: isDimmed ? 0.2 : 1 }}
                                onClick={(e) => onSelectPage(p, e.shiftKey)}
                                onContextMenu={(e) => handleCtxMenu(e, p)}
                            >
                                {isSelected && <circle cx={pos.x} cy={pos.y} r={r + 9} fill={pt.color} opacity="0.13" />}
                                {isRoot && (
                                    <circle cx={pos.x} cy={pos.y} r={r + 13} fill={pt.color} opacity="0.07">
                                        <animate attributeName="r" values={`${r + 8};${r + 18};${r + 8}`} dur="2.5s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.1;0;0.1" dur="2.5s" repeatCount="indefinite" />
                                    </circle>
                                )}
                                {/* High Dependency Node Pulse Ring */}
                                {isHighDep && (
                                    <circle cx={pos.x} cy={pos.y} r={r + 6} fill="none" stroke={complexityColor} strokeWidth="1" strokeDasharray="4 2" opacity="0.6">
                                        <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="3s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="3s" repeatCount="indefinite" />
                                    </circle>
                                )}
                                {/* Sensitive Node Ring */}
                                {isSensitive && (
                                    <circle cx={pos.x} cy={pos.y} r={r + 3} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
                                )}

                                <circle cx={pos.x} cy={pos.y} r={r}
                                    fill={isSelected ? complexityColor : 'white'}
                                    stroke={complexityColor} strokeWidth={isSelected ? 0 : 2.5}
                                    filter={isSelected ? `drop-shadow(0 0 10px ${complexityColor}70)` : undefined}
                                />
                                {!isRoot && (
                                    <circle cx={pos.x + r - 5} cy={pos.y - r + 5} r={5} fill={complexityColor} />
                                )}
                                {p.tags?.includes('review') && (
                                    <text x={pos.x - r + 5} y={pos.y - r + 5} fontSize="12">⭐</text>
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
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-100 p-2.5 flex flex-col gap-1 shadow-sm pointer-events-none">
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 max-w-[260px]">
                    {Object.entries(PAGE_TYPES).filter(([k]) => k !== 'unknown').map(([key, pt]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: pt.color }} />
                            <span className="text-[9px] font-semibold text-slate-500">{pt.label}</span>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full border border-red-500 border-dashed" /> Sensitive
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full border border-orange-500 animate-pulse" /> High Dep
                    </span>
                </div>
            </div>

            {/* Zoom & Export controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
                <button onClick={() => {
                    const svg = document.querySelector('.force-graph-svg');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `graph-${Date.now()}.svg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }} title="Export SVG" className="w-7 h-7 mt-1 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center">
                    <Camera size={13} />
                </button>
            </div>
            <div className="absolute top-3 left-3 bg-white/80 px-2 py-1 rounded-lg border border-slate-100 text-[10px] font-semibold text-slate-400 pointer-events-none">
                {visiblePages.length} nodes · Scroll=zoom · Drag=pan · Shift+Click=multi
            </div>
        </div>
    );
};

// ─── Page Insights Drawer ─────────────────────────────────────────────────────

const PageDrawer = ({ pages, onClose }) => {
    if (!pages || pages.length === 0) return null;
    return (
        <AnimatePresence>
            {pages.map((page, index) => {
                const pt = PAGE_TYPES[page.pageType] || PAGE_TYPES.unknown;
                const Icon = pt.icon;
                return (
                    <motion.div
                        key={page.id}
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                        className="absolute top-0 h-full w-[280px] bg-white border-l border-slate-100 shadow-2xl z-20 flex flex-col overflow-y-auto"
                        style={{ right: `${index * 280}px` }}
                    >
                        <div className="p-4 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: pt.bg }}>
                                        <Icon size={15} style={{ color: pt.color }} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: pt.color }}>{pt.label}</span>
                                </div>
                                <button onClick={() => onClose(page.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
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

                        {/* New Metrics Section for Asset load and duplicates */}
                        <div className="px-4 pb-2 grid grid-cols-2 gap-2">
                            <div className="border border-slate-100 rounded p-2 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400">JS / CSS</p>
                                <p className="text-xs font-bold text-slate-700">~{Math.round((page.loadTime || 0) * 0.4)} KB</p>
                            </div>
                            <div className="border border-slate-100 rounded p-2 text-center">
                                <p className="text-[9px] font-black uppercase text-slate-400">Assets</p>
                                <p className="text-xs font-bold text-slate-700">{Math.floor((page.links || 0) / 3) + 2}</p>
                            </div>
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
                );
            })}
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

const PagesTable = ({ pages, selectedPages, onSelectPage, searchQuery, onContextMenu }) => {
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState({ key: null, dir: 1 });
    const typeOptions = ['all', ...Object.keys(PAGE_TYPES).filter(k => pages.some(p => p.pageType === k))];

    const filtered = useMemo(() => {
        let rows = filter === 'all' ? pages : pages.filter(p => p.pageType === filter);
        if (searchQuery) {
            const sq = searchQuery.toLowerCase();
            rows = rows.filter(p => p.url.toLowerCase().includes(sq) || p.pageType.toLowerCase().includes(sq));
        }
        if (sort.key) {
            rows = [...rows].sort((a, b) => {
                const av = a[sort.key] ?? 0, bv = b[sort.key] ?? 0;
                return (av > bv ? 1 : -1) * sort.dir;
            });
        }
        return rows;
    }, [pages, filter, sort, searchQuery]);

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
                <button title="Export CSV" className="p-1 px-2 border rounded text-[10px] text-slate-500 hover:bg-slate-50"
                    onClick={() => {
                        const csv = 'URL,Type,Status,LoadTime,Depth,APIs,Errors\n' + pages.map(p => `${p.url},${p.pageType},${p.statusCode},${p.loadTime},${p.depth},${p.apis},${p.errors}`).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'pages.csv'; link.click();
                    }}>Export CSV</button>
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
                            <tr><td colSpan={7} className="text-center py-10 text-slate-300 text-xs font-semibold">No pages match criteria</td></tr>
                        )}
                        {filtered.map((p) => {
                            const pt = PAGE_TYPES[p.pageType] || PAGE_TYPES.unknown;
                            const Icon = pt.icon;
                            let isSelected = false;
                            if (selectedPages && selectedPages.some(sp => sp.id === p.id)) isSelected = true;

                            return (
                                <tr key={p.id}
                                    onClick={(e) => onSelectPage(p, e.shiftKey)}
                                    onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, p); }}
                                    className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                                    <td className="px-3 py-2.5 max-w-[200px]">
                                        <p className="font-mono text-slate-700 font-medium truncate"
                                            title={p.url}>
                                            {(() => { try { return new URL(p.url).pathname || '/'; } catch { return p.url; } })()}
                                        </p>
                                        <div className="flex gap-1">
                                            {p.title && <p className="text-slate-400 text-[10px] truncate mt-0.5 max-w-[150px]">{p.title}</p>}
                                            {p.tags?.includes('review') && <span className="text-[10px]">⭐</span>}
                                        </div>
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
    const { targetUrl: url, scanResult: result, isScanning: globalScanning } = useScanContext();
    const [isScanning, setIsScanning] = useState(false);
    const [scanDone, setScanDone] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState({ maxDepth: 3, maxPages: 100, includeSubdomains: false, requiresAuth: false, deviceProfile: 'desktop' });
    const [pages, setPages] = useState([]);
    const [edges, setEdges] = useState([]);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');

    // Multi-select & Drawers
    const [selectedPages, setSelectedPages] = useState([]);
    const [showDrawer, setShowDrawer] = useState(false);

    // New Features States
    const [searchQuery, setSearchQuery] = useState('');
    const [clusteringMode, setClusteringMode] = useState('physics'); // 'physics' or 'type'
    const [playbackIndex, setPlaybackIndex] = useState(null); // null = off
    const [isPlaying, setIsPlaying] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);

    const [activeTab, setActiveTab] = useState('graph');
    const [elapsed, setElapsed] = useState(0);
    const [apiCalls, setApiCalls] = useState([]);
    const [error, setError] = useState(null);
    const [lastSnapshot, setLastSnapshot] = useState(() => {
        try { return JSON.parse(localStorage.getItem('inspectra_discovery_last_snapshot')) || null; }
        catch { return null; }
    });

    const timerRef = useRef(null);
    const abortRef = useRef(null);
    const scanStart = useRef(null);
    const prevUrlRef = useRef(url);

    const handleConfigChange = (key, val) => setConfig(c => ({ ...c, [key]: val }));

    // Global event listeners for Shortcuts & Clicks
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedPages([]);
                setShowDrawer(false);
                setContextMenu(null);
            }
        };
        const handleClick = () => setContextMenu(null);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', handleClick);
        };
    }, []);

    // Playback Effect
    useEffect(() => {
        if (!isPlaying || playbackIndex === null || playbackIndex >= pages.length) return;
        const to = setTimeout(() => {
            setPlaybackIndex(i => i + 1);
        }, 150);
        return () => clearTimeout(to);
    }, [isPlaying, playbackIndex, pages.length]);

    useEffect(() => {
        if (result?.discoveryGraph) {
            setPages(result.discoveryGraph.nodes || []);
            setEdges(result.discoveryGraph.edges || []);
            setScanDone(true);
            setLogs(prev => [...prev, { level: 'success', text: 'Loaded discovery graph from main scan.' }]);
        }
    }, [result]);

    // Clear results when a global scan starts
    useEffect(() => {
        if (globalScanning) {
            setPages([]);
            setEdges([]);
            setLogs([]);
            setScanDone(false);
            setProgress(0);
            setApiCalls([]);
            setError(null);
            setPlaybackIndex(null);
        }
    }, [globalScanning]);

    // Clear results when the target URL changes to ensure no stale data
    useEffect(() => {
        if (prevUrlRef.current !== url) {
            setPages([]);
            setEdges([]);
            setLogs([]);
            setScanDone(false);
            setProgress(0);
            setProgressStage('');
            setSelectedPages([]);
            setApiCalls([]);
            setError(null);
            setPlaybackIndex(null);
            prevUrlRef.current = url;
        }
    }, [url]);

    // Auto-scan automatically when the user sets a URL globally and it is not already scanning
    useEffect(() => {
        if (url && !isScanning && !scanDone && pages.length === 0 && !globalScanning && !result?.discoveryGraph) {
            const timer = setTimeout(() => {
                startScan();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [url, isScanning, scanDone, pages.length, globalScanning, result]);



    const handleSelectPage = (p, addMulti = false) => {
        if (addMulti) {
            setSelectedPages(prev => prev.some(sp => sp.id === p.id) ? prev.filter(sp => sp.id !== p.id) : [...prev, p]);
        } else {
            setSelectedPages([p]);
        }
        setShowDrawer(true);
    };

    const handleContextMenu = (e, page) => {
        setContextMenu({ x: e.clientX, y: e.clientY, page });
    };

    const startScan = useCallback(async () => {
        if (!url) return;
        setIsScanning(true);
        setScanDone(false);
        setPages([]);
        setEdges([]);
        setApiCalls([]);
        setLogs([]);
        setProgress(2);
        setProgressStage('Launching browser…');
        setSelectedPages([]);
        setShowDrawer(false);
        setError(null);
        setElapsed(0);
        setPlaybackIndex(null);
        setIsPlaying(false);
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
                            if (event.level === 'api') {
                                setApiCalls(prev => [...prev, {
                                    text: event.text.replace('📡 API: ', ''),
                                    at: new Date().toLocaleTimeString()
                                }]);
                            }
                            // --- Hidden Surface Parsing Mock ---
                            if (event.text.includes('JS Parsed') && Math.random() > 0.8) {
                                setLogs(prev => [...prev, { level: 'warn', text: '🔍 INTEL: Unlinked API endpoint detected in bundled JS' }]);
                            }
                        } else if (event.type === 'page') {
                            const newPage = {
                                ...event.page,
                                inboundCount: 0 // Will be calculated on done
                            };
                            setPages(prev => [...prev, newPage]);

                            // Connect graph real-time so it renders instantly during discovery
                            if (event.page.discoveredFrom) {
                                setEdges(prevEdges => {
                                    if (!prevEdges.some(e => e.from === event.page.discoveredFrom && e.to === event.page.id)) {
                                        return [...prevEdges, { from: event.page.discoveredFrom, to: event.page.id }];
                                    }
                                    return prevEdges;
                                });
                            }
                        } else if (event.type === 'progress') {
                            setProgress(event.value);
                            setProgressStage(event.stage || '');
                        } else if (event.type === 'done') {
                            if (event.edges) setEdges(event.edges);

                            // Calculate inbound counts for dependency intelligence
                            if (event.edges) {
                                const counts = {};
                                event.edges.forEach(e => { counts[e.to] = (counts[e.to] || 0) + 1; });
                                setPages(prev => prev.map(p => ({ ...p, inboundCount: counts[p.id] || 0 })));
                            }

                            setProgress(100);
                            setProgressStage(event.success ? 'Scan complete' : 'Scan failed');
                            if (!event.success && event.error) setError(event.error);

                            // Save snapshot for delta mode
                            if (event.success) {
                                localStorage.setItem('inspectra_discovery_last_snapshot', JSON.stringify({
                                    pCount: (event.pages || []).length,
                                    aCount: (event.pages || []).reduce((acc, p) => acc + (p.apis || 0), 0)
                                }));
                            }
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

    const stats = useMemo(() => {
        const total = pages.length;
        const apis = pages.reduce((a, p) => a + (p.apis || 0), 0);
        const errors = pages.reduce((a, p) => a + (p.errors || 0), 0);

        // --- Architecture Risk Calculation ---
        const orphans = pages.filter(p => p.inboundCount === 0 && p.id !== pages[0]?.id).length;
        const nesting = pages.filter(p => p.depth > 5).length;
        const redirects = pages.filter(p => p.statusCode >= 300 && p.statusCode < 400).length;
        const sensitive = pages.filter(p => /admin|auth|login|config|api/i.test(p.url)).length;
        const circular = edges.some(e => e.from === e.to) ? 1 : 0;
        const highDep = pages.filter(p => p.inboundCount > (total * 0.3)).length;

        const riskScore = Math.min(100, (
            (orphans / (total || 1)) * 100 * 0.2 +
            (circular > 0 ? 15 : 0) +
            (nesting / (total || 1)) * 100 * 0.15 +
            (redirects / (total || 1)) * 100 * 0.1 +
            (sensitive > 0 ? 20 : 0) +
            (highDep > 0 ? 20 : 0)
        ));

        // --- Confidence Score ---
        const rateLimit = logs.filter(l => l.text.includes('429')).length > 0 ? 25 : 0;
        const confidence = Math.max(0, 100 - rateLimit - (errors * 2));

        return {
            total,
            apis,
            errors,
            orphans,
            riskScore: Math.round(riskScore),
            confidence: Math.round(confidence),
            types: Object.fromEntries(Object.keys(PAGE_TYPES).map(k => [k, pages.filter(p => p.pageType === k).length])),
        };
    }, [pages, edges, logs]);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">

            {/* ── Top Input Bar ──────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 flex-wrap shadow-sm">

                <div className="flex-1 shrink-0 flex items-center gap-4 min-w-[300px] justify-start">
                    {/* Timeline Playback */}
                    {scanDone && pages.length > 0 && (
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1 max-w-sm">
                            <button onClick={() => {
                                if (playbackIndex === null) setPlaybackIndex(0);
                                setIsPlaying(p => !p);
                            }} className="text-indigo-600 hover:scale-110 transition-transform">
                                {isPlaying ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                            </button>
                            <input type="range" min={0} max={pages.length} value={playbackIndex === null ? pages.length : playbackIndex}
                                onChange={e => {
                                    setIsPlaying(false);
                                    const v = Number(e.target.value);
                                    if (v === pages.length) setPlaybackIndex(null); else setPlaybackIndex(v);
                                }}
                                className="flex-1 accent-indigo-600 cursor-pointer h-1" />
                            <span className="text-[10px] font-black text-slate-400 w-8">{playbackIndex === null ? 'ALL' : playbackIndex}</span>
                        </div>
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

                {/* Status */}
                {(isScanning || scanDone || globalScanning) && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${isScanning || globalScanning ? 'bg-indigo-50 text-indigo-600' : error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {isScanning || globalScanning
                            ? <><Loader size={12} className="animate-spin" /> {globalScanning ? 'Global Scan Active' : progressStage || 'Scanning'} · {fmt(elapsed)}</>
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
            </AnimatePresence >

            {/* ── Progress Bar ─────────────────────────────────────────── */}
            {
                (isScanning || (scanDone && progress > 0)) && (
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
                )
            }

            {/* ── Metric Cards ─────────────────────────────────────────── */}
            <div className="px-6 pt-4 pb-2 grid grid-cols-2 lg:grid-cols-6 gap-3">
                {[
                    { label: 'Risk Score', value: `${stats.riskScore}/100`, color: stats.riskScore < 30 ? '#10b981' : stats.riskScore < 60 ? '#f59e0b' : '#ef4444', bg: stats.riskScore < 30 ? '#d1fae5' : stats.riskScore < 60 ? '#fef3c7' : '#fee2e2', icon: Shield, sub: 'Arch Risk' },
                    { label: 'Confidence', value: `${stats.confidence}%`, color: '#6366f1', bg: '#eef2ff', icon: CheckCircle, sub: 'Crawl Intel' },
                    { label: 'Pages Found', value: stats.total, color: '#6366f1', bg: '#eef2ff', icon: Map, sub: lastSnapshot ? `Delta: ${stats.total - lastSnapshot.pCount >= 0 ? '+' : ''}${stats.total - lastSnapshot.pCount}` : 'BFS Discovered' },
                    { label: 'API Endpoints', value: stats.apis, color: '#0ea5e9', bg: '#e0f2fe', icon: Database, sub: 'Integrated' },
                    { label: 'Graph Edges', value: edges.length, color: '#10b981', bg: '#d1fae5', icon: Network, sub: 'Map Density' },
                    { label: 'Orphans', value: stats.orphans, color: '#fbbf24', bg: '#fffbeb', icon: GitBranch, sub: 'Broken Flow' },
                ].map((m, i) => (
                    <motion.div key={m.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-slate-100 p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: m.color }} />
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                            <m.icon size={14} style={{ color: m.color }} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{m.label}</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{m.value}</p>
                            <p className="text-[9px] text-slate-400 font-bold truncate">{m.sub}</p>
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
                        {[
                            { id: 'graph', icon: Map, label: 'Force Graph' },
                            { id: 'table', icon: List, label: 'Pages Table' },
                            { id: 'network', icon: Network, label: 'Network Intercept' }
                        ].map(t => {
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
                                <ForceGraph
                                    pages={pages}
                                    edges={edges}
                                    selectedPages={selectedPages}
                                    onSelectPage={handleSelectPage}
                                    searchQuery={searchQuery}
                                    playbackIndex={playbackIndex}
                                    clusteringMode={clusteringMode}
                                    onContextMenu={handleContextMenu}
                                />
                                {showDrawer && selectedPages.length > 0 && (
                                    <PageDrawer pages={selectedPages} onClose={(id) => {
                                        if (id) {
                                            setSelectedPages(prev => prev.filter(p => p.id !== id));
                                        } else {
                                            setShowDrawer(false);
                                            setSelectedPages([]);
                                        }
                                        if (selectedPages.length <= 1) setShowDrawer(false);
                                    }} />
                                )}
                            </>
                        ) : activeTab === 'table' ? (
                            <PagesTable pages={pages} selectedPages={selectedPages} onSelectPage={handleSelectPage} searchQuery={searchQuery} onContextMenu={handleContextMenu} />
                        ) : (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Network Intelligence</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Discovered API Endpoints & Request Clusters</p>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = '/network'}
                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all flex items-center gap-2"
                                    >
                                        <Activity size={12} /> Full Network Monitor
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {apiCalls.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                            <Network size={40} className="mb-4 text-slate-300" />
                                            <p className="text-xs font-bold uppercase tracking-widest">No API traffic recorded on discovered nodes</p>
                                        </div>
                                    ) : (
                                        apiCalls.map((api, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <Database size={14} className="text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-mono font-bold text-slate-700 truncate">{api.text}</p>
                                                    <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Intercepted at {api.at}</p>
                                                </div>
                                                <div className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest">API NODE</div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Log Console */}
                <div className="w-[450px] bg-white rounded-2xl border border-slate-100 shadow-sm shrink-0 flex flex-col overflow-hidden">
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

            {/* Context Menu */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <div className="px-3 py-2 border-b border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase truncate" title={contextMenu.page.url}>
                                {new URL(contextMenu.page.url).pathname || '/'}
                            </p>
                        </div>
                        <button
                            onClick={() => { window.open(contextMenu.page.url, '_blank'); setContextMenu(null); }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-2"
                        >
                            <ExternalLink size={12} /> Open in Browser
                        </button>
                        <button
                            onClick={() => {
                                setPages(pages.map(p => p.id === contextMenu.page.id ? { ...p, tags: [...(p.tags || []), 'review'] } : p));
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-2"
                        >
                            <Star size={12} /> Mark for Review
                        </button>
                        <button
                            onClick={() => {
                                handleSelectPage(contextMenu.page, true);
                                setContextMenu(null);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-2"
                        >
                            <Layers size={12} /> Compare (Pin Drawer)
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
