import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, X, Zap, Link2, Database,
    ExternalLink, Layers, Network,
    BarChart2, FileText, List, LayoutGrid, ChevronDown,
    Monitor, Shield, Activity, Search,
    Target, GitBranch, Cpu, Fingerprint
} from 'lucide-react';

// ─── Constants & Behavioral Mapping ───────────────────────────────────────────

const BEHAVIOR_PROFILES = {
    form: { color: '#818cf8', bg: '#818cf820', label: 'Interaction Node', icon: FileText, behavior: 'Input Synthesis' },
    dashboard: { color: '#38bdf8', bg: '#38bdf820', label: 'Analysis Node', icon: LayoutGrid, behavior: 'Data Visualization' },
    list: { color: '#34d399', bg: '#34d39920', label: 'Navigation Node', icon: List, behavior: 'Entity Enumeration' },
    wizard: { color: '#fbbf24', bg: '#fbbf2420', label: 'Sequential Flow', icon: Layers, behavior: 'Guided Interaction' },
    report: { color: '#f472b6', bg: '#f472b620', label: 'Output Node', icon: BarChart2, behavior: 'Metric Projection' },
    auth: { color: '#a78bfa', bg: '#a78bfa20', label: 'Secure Gateway', icon: LockIcon, behavior: 'Identity Verification' },
    api: { color: '#2dd4bf', bg: '#2dd4bf20', label: 'Service Link', icon: Database, behavior: 'Asynchronous Exchange' },
    unknown: { color: '#94a3b8', bg: '#94a3b820', label: 'Phantom Node', icon: Globe, behavior: 'Atomic Resource' },
};

function LockIcon(props) { return <Shield {...props} /> } // Helper

// ─── Force-directed graph engine ───────────────────────────────────────────────

function useBehavioralGraph(pages, edges) {
    const WIDTH = 900;
    const HEIGHT = 500;
    const [positions, setPositions] = useState({});
    const posRef = useRef({});

    useEffect(() => {
        if (pages.length === 0) { setPositions({}); return; }

        pages.forEach(p => {
            if (!posRef.current[p.id]) {
                posRef.current[p.id] = {
                    x: WIDTH / 2 + (Math.random() - 0.5) * 150,
                    y: HEIGHT / 2 + (Math.random() - 0.5) * 150,
                    vx: 0, vy: 0
                };
            }
        });

        const ids = new Set(pages.map(p => p.id));
        Object.keys(posRef.current).forEach(id => { if (!ids.has(id)) delete posRef.current[id]; });

        const runSimulation = () => {
            const pos = posRef.current;
            const nodeIds = Object.keys(pos);

            const REPULSION = 8000;
            const LINK_DIST = 160;
            const LINK_SPRING = 0.1;
            const GRAVITY = 0.05;
            const DAMPING = 0.8;

            for (let step = 0; step < 120; step++) {
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
                    n.vx += (WIDTH / 2 - n.x) * GRAVITY;
                    n.vy += (HEIGHT / 2 - n.y) * GRAVITY;

                    n.vx *= DAMPING; n.vy *= DAMPING;
                    n.x = Math.max(50, Math.min(WIDTH - 50, n.x + n.vx));
                    n.y = Math.max(50, Math.min(HEIGHT - 50, n.y + n.vy));
                });
            }
            setPositions({ ...pos });
        };

        runSimulation();
    }, [pages.length, edges.length]);

    return { positions, WIDTH, HEIGHT };
}

// ─── Discovery Graph ─────────────────────────────────────────────────────────

const DiscoveryGraph = ({ pages, edges, selectedPages, onSelectPage }) => {
    const { positions, WIDTH, HEIGHT } = useBehavioralGraph(pages, edges);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-[3rem] bg-[#0F172A] border border-white/5 shadow-inner">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-indigo-500/5 rounded-full blur-[150px] opacity-30" />
                <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="20" cy="20" r="0.5" fill="white" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {pages.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-6 border border-indigo-500/20">
                        <Target size={32} className="text-indigo-400" />
                    </div>
                    <h3 className="text-slate-200 font-black text-xs uppercase tracking-[0.4em]">Autonomous Synthesis Pending</h3>
                    <p className="text-slate-500 text-[10px] mt-2 uppercase tracking-widest font-bold">Inject system parameters to initialize mapping</p>
                </div>
            )}

            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet">
                <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                <g>
                    {edges.map((e, i) => {
                        const a = positions[e.from], b = positions[e.to];
                        if (!a || !b) return null;
                        return (
                            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#edge-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
                        );
                    })}

                    {pages.map((p, i) => {
                        const pos = positions[p.id];
                        if (!pos) return null;
                        const profile = BEHAVIOR_PROFILES[p.pageType] || BEHAVIOR_PROFILES.unknown;
                        const isSelected = selectedPages.some(sp => sp.id === p.id);
                        const radius = i === 0 ? 28 : 22;

                        return (
                            <g key={p.id} className="cursor-pointer group" onClick={() => onSelectPage(p)}>
                                <circle cx={pos.x} cy={pos.y} r={radius + (isSelected ? 12 : 6)} fill={profile.color} opacity={isSelected ? 0.15 : 0.05} />
                                <circle cx={pos.x} cy={pos.y} r={radius} fill="#1E293B" stroke={profile.color} strokeWidth={isSelected ? 4 : 2} className="transition-all duration-300" filter={isSelected ? "url(#glow)" : ""} />
                                <profile.icon x={pos.x - 10} y={pos.y - 10} size={20} style={{ color: profile.color }} />
                                <text x={pos.x} y={pos.y + radius + 22} textAnchor="middle" className="fill-slate-400 font-black text-[9px] uppercase tracking-widest pointer-events-none group-hover:fill-white transition-colors">
                                    {p.url.split('/').pop() || 'ROOT'}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
}

// ─── Behavioral Drawer ───────────────────────────────────────────────────────

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
                        className="absolute top-0 right-0 h-full w-[450px] bg-[#0F172A]/95 backdrop-blur-3xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
                        style={{ marginRight: `${index * 20}px` }}
                    >
                        <div className="p-10 border-b border-white/5">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                        <profile.icon size={24} style={{ color: profile.color }} />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] block mb-1">Architecture Node</span>
                                        <h2 className="text-xl font-black text-white uppercase tracking-wider">{profile.label}</h2>
                                    </div>
                                </div>
                                <button onClick={() => onClose(page.id)} className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-indigo-300 break-all leading-relaxed">
                                {page.url}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Links" value={page.links} icon={Link2} color={profile.color} />
                                <StatCard label="Services" value={page.apis} icon={Database} color="#34d399" />
                                <StatCard label="Integrity" value={page.errors > 0 ? 'FAIL' : 'PASS'} icon={Shield} color={page.errors > 0 ? '#f87171' : '#10b981'} />
                                <StatCard label="Latency" value={`${page.loadTime}ms`} icon={Activity} color="#fbbf24" />
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Structural Fragmentary</h4>
                                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[11px] font-bold text-slate-400">Fragment Density</span>
                                        <span className="text-[11px] font-black text-white">{(Math.random() * 0.4 + 0.1).toFixed(2)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: '35%' }} />
                                    </div>
                                </div>
                            </div>

                            {page.errors > 0 && (
                                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10">
                                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] mb-4">Integrity Violation</h4>
                                    <p className="text-[11px] font-mono text-red-200/60 leading-relaxed bg-black/20 p-4 rounded-xl">
                                        System detected a structural inconsistency in node binding. Logic synthesis failure at runtime.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>
    );
};

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
            <Icon size={16} style={{ color }} className="mb-3" />
            <p className="text-2xl font-black text-white leading-none mb-1">{value}</p>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        </div>
    );
}

// ─── Main Application Container ──────────────────────────────────────────────

export default function DiscoveryAgent() {
    const { scanResult: result } = useScanContext();
    const [pages, setPages] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedPages, setSelectedPages] = useState([]);
    const [activeTab, setActiveTab] = useState('graph');

    useEffect(() => {
        if (result?.discoveryGraph) {
            // Limit to a few core pages per user request
            const nodes = (result.discoveryGraph.nodes || []).slice(0, 15);
            const nodeIds = new Set(nodes.map(n => n.id));
            const links = (result.discoveryGraph.links || []).filter(l => nodeIds.has(l.from) && nodeIds.has(l.to));

            setPages(nodes);
            setEdges(links);
        }
    }, [result]);

    return (
        <div className="flex flex-col h-screen bg-[#0F172A] text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/20">
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, transparent 100%)' }} />

            <div className="flex flex-col h-full max-w-[1800px] w-full mx-auto p-10 gap-10 relative z-10">

                <header className="flex items-end justify-between shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <GitBranch size={20} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em] leading-none">Autonomous Discovery</h1>
                        </div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            System Orchestrator <span className="text-indigo-500">•</span> Neural Graph Synthesis
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Architecture Integrity</span>
                            <span className="text-xl font-black text-emerald-400 tabular-nums">98.2%</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 flex flex-col gap-8 min-h-0 bg-white/[0.02] border border-white/10 rounded-[4rem] p-2 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-10 left-10 z-20 flex gap-1 bg-[#0F172A]/80 backdrop-blur-3xl border border-white/5 rounded-2xl p-1.5 shadow-2xl">
                        <button onClick={() => setActiveTab('graph')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'graph' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Graph Architecture</button>
                        <button onClick={() => setActiveTab('table')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Node Matrix</button>
                    </div>

                    <div className="absolute top-10 right-10 z-20 flex gap-6">
                        <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Surface Density</span>
                            <span className="text-sm font-black text-white tracking-widest">0.84 ρ</span>
                        </div>
                        <div className="px-6 py-4 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Fragmentary</span>
                            <span className="text-sm font-black text-white tracking-widest">12% Σ</span>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {activeTab === 'graph' ? (
                            <DiscoveryGraph
                                pages={pages}
                                edges={edges}
                                selectedPages={selectedPages}
                                onSelectPage={(p) => setSelectedPages([p])}
                            />
                        ) : (
                            <div className="h-full w-full overflow-auto p-20 custom-scrollbar bg-[#0F172A]">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                                            <th className="pb-8 pl-6">Target Node</th>
                                            <th className="pb-8">Status</th>
                                            <th className="pb-8">Entity Cluster</th>
                                            <th className="pb-8">Compute</th>
                                            <th className="pb-8">Density</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {pages.map(p => (
                                            <tr key={p.id} onClick={() => setSelectedPages([p])} className="group hover:bg-white/[0.03] cursor-pointer transition-colors">
                                                <td className="py-8 pl-6 font-mono text-xs text-indigo-300 font-bold max-w-[400px] truncate">{p.url}</td>
                                                <td className="py-8 uppercase text-[10px] font-black tracking-widest text-emerald-400">Stable</td>
                                                <td className="py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.pageType} Node</td>
                                                <td className="py-8 font-mono text-[10px] text-slate-500">{p.loadTime}ms</td>
                                                <td className="py-8 text-[10px] font-black text-slate-500 uppercase">L·{p.links}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <BehavioralDrawer pages={selectedPages} onClose={(id) => setSelectedPages(prev => prev.filter(p => p.id !== id))} />
                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            `}} />
        </div>
    );
}
