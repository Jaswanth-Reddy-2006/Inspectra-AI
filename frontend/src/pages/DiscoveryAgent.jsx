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
    Pause, Clock3, MoreVertical, PlayCircle, Star, AlertOctagon, History, MousePointer2, Users, Target
} from 'lucide-react';
import { API_BASE } from '../services/config';

// ─── Constants & Behavioral Mapping ───────────────────────────────────────────

const BEHAVIOR_PROFILES = {
    form: { color: '#818cf8', bg: '#818cf820', label: 'Interaction Node', icon: FileText, behavior: 'Input Synthesis' },
    dashboard: { color: '#38bdf8', bg: '#38bdf820', label: 'Analysis Node', icon: LayoutGrid, behavior: 'Data Visualization' },
    list: { color: '#34d399', bg: '#34d39920', label: 'Navigation Node', icon: List, behavior: 'Entity Enumeration' },
    wizard: { color: '#fbbf24', bg: '#fbbf2420', label: 'Sequential Flow', icon: Layers, behavior: 'Guided Interaction' },
    report: { color: '#f472b6', bg: '#f472b620', label: 'Output Node', icon: BarChart2, behavior: 'Metric Projection' },
    auth: { color: '#a78bfa', bg: '#a78bfa20', label: 'Secure Gateway', icon: Lock, behavior: 'Identity Verification' },
    api: { color: '#2dd4bf', bg: '#2dd4bf20', label: 'Service Link', icon: Database, behavior: 'Asynchronous Exchange' },
    unknown: { color: '#94a3b8', bg: '#94a3b820', label: 'Phantom Node', icon: Globe, behavior: 'Atomic Resource' },
};

const LOG_STYLES = {
    info: { color: '#818cf8', bg: '#818cf815', icon: '●' },
    visiting: { color: '#38bdf8', bg: '#38bdf815', icon: '→' },
    found: { color: '#34d399', bg: '#34d39915', icon: '✓' },
    api: { color: '#fbbf24', bg: '#fbbf2415', icon: '⬡' },
    queued: { color: '#94a3b8', bg: '#94a3b815', icon: '+' },
    error: { color: '#f87171', bg: '#f8717115', icon: '✗' },
    success: { color: '#34d399', bg: '#34d39915', icon: '★' },
    warn: { color: '#fb923c', bg: '#fb923c15', icon: '⚠' },
};

const STATUS_COLOR = (s) => s === 0 ? '#94a3b8' : s < 300 ? '#34d399' : s < 400 ? '#fbbf24' : '#f87171';
const STATUS_BG = (s) => s === 0 ? '#1e293b' : s < 300 ? '#064e3b40' : s < 400 ? '#78350f40' : '#7f1d1d40';

// ─── Force-directed graph engine ───────────────────────────────────────────────

function useBehavioralGraph(pages, edges, clusteringMode) {
    const WIDTH = 900;
    const HEIGHT = 500;
    const [positions, setPositions] = useState({});
    const rafRef = useRef(null);
    const posRef = useRef({});

    useEffect(() => {
        if (pages.length === 0) { setPositions({}); return; }

        pages.forEach(p => {
            if (!posRef.current[p.id]) {
                posRef.current[p.id] = {
                    x: WIDTH / 2 + (Math.random() - 0.5) * 150,
                    y: HEIGHT / 2 + (Math.random() - 0.5) * 150,
                    vx: 0, vy: 0,
                    isNew: true
                };
            } else {
                posRef.current[p.id].isNew = false;
            }
        });

        const ids = new Set(pages.map(p => p.id));
        Object.keys(posRef.current).forEach(id => { if (!ids.has(id)) delete posRef.current[id]; });

        const clusters = {};
        if (clusteringMode === 'type') {
            const types = [...new Set(pages.map(p => p.pageType))];
            const angleStep = (Math.PI * 2) / Math.max(types.length, 1);
            types.forEach((t, i) => {
                clusters[t] = {
                    x: WIDTH / 2 + Math.cos(i * angleStep) * 200,
                    y: HEIGHT / 2 + Math.sin(i * angleStep) * 200,
                };
            });
        }

        const runSimulation = () => {
            const pos = posRef.current;
            const nodeIds = Object.keys(pos);
            const activeNodes = nodeIds.filter(id => pos[id].isNew);

            const REPULSION = 6000;
            const LINK_DIST = 140;
            const LINK_SPRING = 0.08;
            const GRAVITY = 0.04;
            const DAMPING = 0.85;

            if (activeNodes.length > 0 || true) {
                for (let step = 0; step < 100; step++) {
                    for (let i = 0; i < nodeIds.length; i++) {
                        const a = pos[nodeIds[i]];
                        for (let j = i + 1; j < nodeIds.length; j++) {
                            const b = pos[nodeIds[j]];
                            const dx = a.x - b.x, dy = a.y - b.y;
                            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                            const force = REPULSION / (dist * dist);
                            const fx = (dx / dist) * force, fy = (dy / dist) * force;
                            a.vx += fx; a.vy += fy;
                            b.vx -= fx; b.vy -= fy;
                        }
                    }

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

                    nodeIds.forEach(id => {
                        const n = pos[id];
                        const p = pages.find(pg => pg.id === id);
                        if (clusteringMode === 'type' && p && clusters[p.pageType]) {
                            n.vx += (clusters[p.pageType].x - n.x) * 0.08;
                            n.vy += (clusters[p.pageType].y - n.y) * 0.08;
                        } else {
                            n.vx += (WIDTH / 2 - n.x) * GRAVITY;
                            n.vy += (HEIGHT / 2 - n.y) * GRAVITY;
                        }

                        n.vx *= DAMPING; n.vy *= DAMPING;
                        n.x = Math.max(50, Math.min(WIDTH - 50, n.x + n.vx));
                        n.y = Math.max(50, Math.min(HEIGHT - 50, n.y + n.vy));
                    });
                }
                setPositions({ ...pos });
            }
        };

        runSimulation();
    }, [pages.length, edges.length, clusteringMode]);

    return { positions, WIDTH, HEIGHT };
}

// ─── Behavioral Force Visualizer ─────────────────────────────────────────────

const DiscoveryGraph = ({ pages, edges, selectedPages, onSelectPage, searchQuery, playbackIndex, clusteringMode, onContextMenu }) => {
    const visiblePages = playbackIndex !== null ? pages.slice(0, playbackIndex) : pages;
    const visibleIds = new Set(visiblePages.map(p => p.id));
    const visibleEdges = edges.filter(e => visibleIds.has(e.from) && visibleIds.has(e.to));

    const { positions, WIDTH, HEIGHT } = useBehavioralGraph(visiblePages, visibleEdges, clusteringMode);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] bg-[#0F172A] border border-white/5 group/graph">
            {/* Neural Mesh Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/5 rounded-full blur-[120px] opacity-20" />
                <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
                    <pattern id="neural-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="30" cy="30" r="0.8" fill="white" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#neural-grid)" />
                </svg>
            </div>

            {pages.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]"
                    >
                        <Target size={40} className="text-indigo-400" />
                    </motion.div>
                    <h3 className="text-slate-200 font-black text-xs uppercase tracking-[0.4em]">Awaiting Simulation</h3>
                    <p className="text-slate-500 text-[10px] mt-3 uppercase tracking-widest font-bold">Inject URL to initialize behavioral mapping</p>
                </div>
            )}

            <svg
                className="absolute inset-0 w-full h-full cursor-move"
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="neural-link" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <g>
                    {/* Neuronal Connections (Edges) */}
                    {visibleEdges.map((e, i) => {
                        const a = positions[e.from], b = positions[e.to];
                        if (!a || !b) return null;
                        return (
                            <g key={i}>
                                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                    stroke="url(#neural-link)" strokeWidth="1" strokeDasharray="5 5" opacity="0.4" />
                                <motion.circle
                                    r="2" fill="#818cf8"
                                    animate={{
                                        cx: [a.x, b.x],
                                        cy: [a.y, b.y],
                                        opacity: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2 + Math.random() * 2,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: Math.random() * 2
                                    }}
                                />
                            </g>
                        );
                    })}

                    {/* Behavioral Hubs (Nodes) */}
                    {visiblePages.map((p, i) => {
                        const pos = positions[p.id];
                        if (!pos) return null;
                        const profile = BEHAVIOR_PROFILES[p.pageType] || BEHAVIOR_PROFILES.unknown;
                        const isSelected = selectedPages.some(sp => sp.id === p.id);
                        const isRoot = i === 0;
                        const radius = isRoot ? 24 : 18;

                        const threatLevel = (p.errors > 0 ? 0.8 : 0) + ((p.loadTime || 0) > 1000 ? 0.2 : 0);
                        const nodeColor = threatLevel > 0.5 ? '#f87171' : profile.color;

                        return (
                            <g key={p.id}
                                className="cursor-pointer transition-all duration-300"
                                onClick={(e) => onSelectPage(p, e.shiftKey)}
                                onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, p); }}
                            >
                                {isSelected && (
                                    <circle cx={pos.x} cy={pos.y} r={radius + 15} fill={nodeColor} opacity="0.1">
                                        <animate attributeName="r" values={`${radius + 10};${radius + 25};${radius + 10}`} dur="3s" repeatCount="indefinite" />
                                    </circle>
                                )}

                                <circle cx={pos.x} cy={pos.y} r={radius}
                                    fill={isSelected ? nodeColor : '#1E293B'}
                                    stroke={nodeColor} strokeWidth={isSelected ? 3 : 2}
                                    className="transition-all"
                                    filter={isSelected ? "url(#neon-glow)" : ""}
                                />

                                {p.errors > 0 && (
                                    <circle cx={pos.x} cy={pos.y} r={radius + 4} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6">
                                        <animateTransform attributeName="transform" type="rotate" from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`} dur="4s" repeatCount="indefinite" />
                                    </circle>
                                )}

                                <profile.icon x={pos.x - 8} y={pos.y - 8} size={16}
                                    style={{ color: isSelected ? 'white' : nodeColor }} />

                                <text x={pos.x} y={pos.y + radius + 20} textAnchor="middle"
                                    className="fill-slate-500 font-black text-[8px] uppercase tracking-widest pointer-events-none">
                                    {(() => {
                                        try { const path = new URL(p.url).pathname; return path.length > 15 ? path.slice(0, 14) + '…' : (path === '/' ? '/ROOT' : path); }
                                        catch { return p.url.slice(0, 15); }
                                    })()}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Float HUD - Indicators */}
            <div className="absolute top-8 left-8 flex flex-col gap-3 pointer-events-none">
                <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <Users size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Neural Synthesis Active</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {Object.values(BEHAVIOR_PROFILES).slice(0, 4).map(p => (
                        <div key={p.label} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0F172A]/80 border border-white/5 whitespace-nowrap">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{p.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Behavioral Intelligence Drawer ──────────────────────────────────────────

const BehavioralDrawer = ({ pages, onClose }) => {
    if (!pages || pages.length === 0) return null;
    return (
        <AnimatePresence>
            {pages.map((page, index) => {
                const profile = BEHAVIOR_PROFILES[page.pageType] || BEHAVIOR_PROFILES.unknown;
                return (
                    <motion.div
                        key={page.id}
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        className="absolute top-0 right-0 h-full w-[400px] bg-[#0F172A]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50 flex flex-col"
                        style={{ marginRight: `${index * 40}px` }}
                    >
                        <div className="p-10 border-b border-white/5 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                                        <profile.icon size={24} style={{ color: profile.color }} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-1">Behavior Profile</span>
                                        <h2 className="text-xl font-black text-white uppercase tracking-wider">{profile.label}</h2>
                                    </div>
                                </div>
                                <button onClick={() => onClose(page.id)} className="w-12 h-12 rounded-2xl hover:bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-xs text-slate-300 break-all leading-relaxed relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: profile.color }} />
                                {page.url}
                                <ExternalLink size={12} className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Response Latency</p>
                                    <p className="text-lg font-black text-white tabular-nums">{page.loadTime || '---'}<span className="text-[10px] text-slate-500 ml-1">ms</span></p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Node Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR(page.statusCode) }} />
                                        <p className="text-lg font-black text-white tabular-nums">{page.statusCode || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                            <section>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Structural Density</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Outbound Links', value: page.links, icon: Link2, color: '#818cf8' },
                                        { label: 'Service Calls', value: page.apis, icon: Database, color: '#34d399' },
                                        { label: 'Input Fields', value: page.forms, icon: FileText, color: '#fbbf24' },
                                        { label: 'Integrity Flaws', value: page.errors, icon: AlertTriangle, color: '#f87171' },
                                    ].map(stat => (
                                        <div key={stat.label} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:border-white/20 transition-all">
                                            <stat.icon size={16} style={{ color: stat.color }} className="mb-3" />
                                            <p className="text-2xl font-black text-white leading-none mb-1">{stat.value ?? 0}</p>
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {page.title && (
                                <section>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Semantic Identity</h4>
                                    <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                        <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"{page.title}"</p>
                                    </div>
                                </section>
                            )}

                            {page.error && (
                                <section>
                                    <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertOctagon size={14} className="text-red-400" />
                                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">Runtime Exception</h4>
                                        </div>
                                        <p className="text-[11px] font-mono text-red-200/80 leading-relaxed break-all bg-black/40 p-4 rounded-xl border border-red-500/10">
                                            {page.error}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>
    );
};

// ─── Main Application Container ──────────────────────────────────────────────

export default function DiscoveryAgent() {
    const { targetUrl: url, scanResult: result, isScanning: globalScanning } = useScanContext();
    const [isScanning, setIsScanning] = useState(false);
    const [scanDone, setScanDone] = useState(false);
    const [pages, setPages] = useState([]);
    const [edges, setEdges] = useState([]);
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [progressStage, setProgressStage] = useState('');
    const [selectedPages, setSelectedPages] = useState([]);
    const [activeTab, setActiveTab] = useState('graph');
    const [elapsed, setElapsed] = useState(0);
    const [contextMenu, setContextMenu] = useState(null);

    const timerRef = useRef(null);
    const abortRef = useRef(null);
    const scanStart = useRef(null);

    // Initial state setup from Context
    useEffect(() => {
        if (result?.discoveryGraph) {
            setPages(result.discoveryGraph.nodes || []);
            setEdges(result.discoveryGraph.edges || []);
            setScanDone(true);
        }
    }, [result]);

    const startDiscovery = useCallback(async () => {
        if (!url || isScanning) return;

        setIsScanning(true);
        setPages([]);
        setEdges([]);
        setLogs([]);
        setProgress(2);
        setProgressStage('Initializing Behavioral Agents...');
        scanStart.current = Date.now();

        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - scanStart.current) / 1000));
        }, 1000);

        try {
            abortRef.current = new AbortController();
            const response = await fetch(`${API_BASE}/api/discovery/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, maxDepth: 2, maxPages: 25 }),
                signal: abortRef.current.signal,
            });

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
                            setLogs(prev => [...prev, { level: event.level, text: event.text }].slice(-100));
                        } else if (event.type === 'page') {
                            setPages(prev => [...prev, event.page]);
                            if (event.page.discoveredFrom) {
                                setEdges(prev => [...prev, { from: event.page.discoveredFrom, to: event.page.id }]);
                            }
                        } else if (event.type === 'progress') {
                            setProgress(event.value);
                            setProgressStage(event.stage);
                        } else if (event.type === 'done') {
                            if (event.edges) setEdges(event.edges);
                            setIsScanning(false);
                            setScanDone(true);
                        }
                    } catch (e) { }
                }
            }
        } catch (err) {
            setIsScanning(false);
        } finally {
            clearInterval(timerRef.current);
        }
    }, [url]);

    const stopDiscovery = () => {
        if (abortRef.current) abortRef.current.abort();
        setIsScanning(false);
        clearInterval(timerRef.current);
    };

    const fmt = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

    return (
        <div className="flex flex-col h-screen bg-[#0F172A] text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/20">
            {/* Page Grain Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-20 contrast-150 mix-blend-overlay z-[100]" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

            <div className="flex flex-col h-full max-w-[1900px] w-full mx-auto p-10 gap-10">

                {/* ADVANCED HEADER */}
                <header className="flex items-end justify-between shrink-0 relative z-10 transition-all">
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-6 mb-4">
                            <h1 className="text-4xl font-black text-white uppercase tracking-[0.2em] leading-none drop-shadow-2xl">Behavioral Discovery</h1>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${isScanning ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400 animate-pulse' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                                {isScanning ? 'Neural Scan Active' : 'Engines Idle'}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800 pr-4">Structural Intelligence v4.0</span>
                            <p className="text-[11px] font-mono text-slate-500 flex items-center gap-2 italic">
                                <Activity size={12} className="text-indigo-500" /> Auto-Recursive Path Synthesis & Interaction Mapping
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-end border-r border-white/5 pr-8">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Session Duration</span>
                            <span className="text-xl font-black text-white tabular-nums">{fmt(elapsed)}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {isScanning ? (
                                <button onClick={stopDiscovery} className="h-14 px-8 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                                    Halt Discovery
                                </button>
                            ) : (
                                <button onClick={startDiscovery} className="h-14 px-10 rounded-2xl bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                    <Play size={14} fill="white" /> Launch Exploration
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* INTELLIGENCE METRICS STRIP */}
                <div className="grid grid-cols-5 gap-8 shrink-0 relative z-10">
                    {[
                        { label: 'Neural Nodes', value: pages.length, sub: 'Discovered Architecture', icon: GitBranch, color: '#818cf8' },
                        { label: 'Edge Links', value: edges.length, sub: 'Connectivity Density', icon: Network, color: '#34d399' },
                        { label: 'Service Hubs', value: pages.reduce((a, p) => a + (p.apis || 0), 0), sub: 'API Convergence', icon: Database, color: '#fbbf24' },
                        { label: 'Behavioral Depth', value: pages.length > 0 ? Math.max(...pages.map(p => p.depth || 0)) : 0, sub: 'Breadth Analysis', icon: Layers, color: '#f472b6' },
                        { label: 'Structural Risk', value: `${pages.some(p => p.errors > 0) ? 'Critical' : 'Nominal'}`, sub: 'Integrity Rating', icon: Shield, color: '#f87171' },
                    ].map(metric => (
                        <div key={metric.label} className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 flex flex-col group hover:bg-white/[0.05] transition-all relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full opacity-30" style={{ background: metric.color }} />
                            <div className="flex items-center justify-between mb-4">
                                <metric.icon size={18} style={{ color: metric.color }} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{metric.label}</span>
                            </div>
                            <div className="text-3xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-left">{metric.value}</div>
                            <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{metric.sub}</div>
                        </div>
                    ))}
                </div>

                {/* INTERACTIVE VISUALIZER AREA */}
                <div className="flex-1 flex flex-col gap-8 min-h-0 relative z-10 bg-white/[0.02] border border-white/5 rounded-[3rem] p-1 shadow-2xl overflow-hidden">
                    <div className="absolute top-8 left-10 z-20 flex gap-4">
                        <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 flex gap-1">
                            <button onClick={() => setActiveTab('graph')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'graph' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>Map View</button>
                            <button onClick={() => setActiveTab('table')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'table' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}>Table Matrix</button>
                        </div>
                    </div>

                    {isScanning && (
                        <div className="absolute top-8 right-10 z-20 flex flex-col items-end gap-3 text-right">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono animate-pulse">{progressStage}</span>
                                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                    <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" animate={{ width: `${progress}%` }} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest max-w-[200px] leading-tight">Syncing behavior logs from agent cluster...</p>
                        </div>
                    )}

                    <div className="flex-1 relative overflow-hidden">
                        {activeTab === 'graph' ? (
                            <DiscoveryGraph
                                pages={pages}
                                edges={edges}
                                selectedPages={selectedPages}
                                onSelectPage={(p, m) => { setSelectedPages(m ? [...selectedPages, p] : [p]); }}
                                onContextMenu={(e, p) => setContextMenu({ x: e.clientX, y: e.clientY, page: p })}
                            />
                        ) : (
                            <div className="h-full w-full overflow-auto p-10 custom-scrollbar bg-[#0F172A]">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-[#0F172A] border-b border-white/5 z-10">
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <th className="px-6 py-6">Interaction Path</th>
                                            <th className="px-6 py-6">Status</th>
                                            <th className="px-6 py-6">Type Cluster</th>
                                            <th className="px-6 py-6">Latency</th>
                                            <th className="px-6 py-6">Sub-Calls</th>
                                            <th className="px-6 py-6">Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pages.map(p => {
                                            const profile = BEHAVIOR_PROFILES[p.pageType] || BEHAVIOR_PROFILES.unknown;
                                            return (
                                                <tr key={p.id} onClick={() => setSelectedPages([p])} className="group hover:bg-white/[0.03] cursor-pointer transition-colors">
                                                    <td className="px-6 py-6 font-mono text-xs text-slate-300 font-bold max-w-[300px] truncate">{p.url}</td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black border" style={{ color: STATUS_COLOR(p.statusCode), borderColor: `${STATUS_COLOR(p.statusCode)}33`, background: `${STATUS_COLOR(p.statusCode)}11` }}>
                                                            {p.statusCode}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <profile.icon size={14} style={{ color: profile.color }} />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile.label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 font-mono text-[10px] text-slate-500 font-bold">{p.loadTime}ms</td>
                                                    <td className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">L·{p.links} / A·{p.apis}</td>
                                                    <td className="px-6 py-6">
                                                        <div className={`w-2 h-2 rounded-full ${p.errors > 0 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-emerald-500/20'}`} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <BehavioralDrawer pages={selectedPages} onClose={(id) => setSelectedPages(prev => prev.filter(p => p.id !== id))} />

                        {/* LIVE FEED OVERLAY */}
                        <div className="absolute bottom-10 left-10 w-[350px] space-y-3 pointer-events-none z-30">
                            <AnimatePresence>
                                {logs.slice(-3).reverse().map((log, i) => (
                                    <motion.div key={log.text + i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="p-4 bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex items-start gap-4">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: LOG_STYLES[log.level]?.color || '#6366f1' }} />
                                        <p className="text-[11px] font-mono text-slate-300 font-bold leading-relaxed break-all">{log.text}</p>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTEXT MENU */}
            <AnimatePresence>
                {contextMenu && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed z-[100] w-64 bg-[#0F172A]/90 backdrop-blur-3xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/10 p-5" style={{ top: contextMenu.y, left: contextMenu.x }}>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 pb-4 border-b border-white/5 truncate">{contextMenu.page.url}</p>
                        <button onClick={() => { window.open(contextMenu.page.url, '_blank'); setContextMenu(null); }} className="w-full flex items-center justify-between text-left p-3 rounded-xl hover:bg-white/5 text-[11px] font-black text-indigo-400 uppercase tracking-widest transition-all">
                            Origins Inspect <ExternalLink size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}} />
        </div>
    );
}
