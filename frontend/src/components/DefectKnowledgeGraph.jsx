import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Orbit, Zap, AlertCircle, Database, ArrowRight } from 'lucide-react';

const DefectKnowledgeGraph = ({ data }) => {
    const containerRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 350 });
    const [hoveredNode, setHoveredNode] = useState(null);

    // ─── Force-Directed Simulation Logic ─────────────────────────────────────
    useEffect(() => {
        if (!data || !data.nodes || !data.links) return;

        // Intelligently select a subset of nodes and preserve relational structure
        const pages = data.nodes.filter(n => n.type === 'page').slice(0, 15);
        const clusters = data.nodes.filter(n => n.type !== 'page').slice(0, 5);
        const rawNodes = [...pages, ...clusters];
        const nodeIds = new Set(rawNodes.map(n => n.id));

        // Prioritize page-to-page links to show "routing"
        const rawLinks = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target)).slice(0, 40);

        const width = containerRef.current?.offsetWidth || 800;
        const height = 400; // Increased height for better spread
        setDimensions({ width, height });

        // Initialize node positions with better spread and hierarchy
        const rootNode = pages.sort((a, b) => a.id.length - b.id.length)[0];

        let simNodes = rawNodes.map((n, i) => {
            const isPage = n.type === 'page';
            const nodeSize = isPage ? 50 + Math.min(30, (n.criticalCount || 0) * 5) : 40;

            return {
                ...n,
                isRoot: rootNode && n.id === rootNode.id,
                size: nodeSize,
                x: n.id === (rootNode?.id) ? 100 : width / 2 + (Math.cos(i) * 300),
                y: n.id === (rootNode?.id) ? height / 2 : height / 2 + (Math.sin(i) * 150),
                vx: 0,
                vy: 0
            };
        });

        const iterations = 220;
        const repulsionForce = 22000;
        const attractionForce = 0.25;
        const damping = 0.55;

        for (let i = 0; i < iterations; i++) {
            // Repulsion
            for (let j = 0; j < simNodes.length; j++) {
                for (let k = j + 1; k < simNodes.length; k++) {
                    const n1 = simNodes[j];
                    const n2 = simNodes[k];
                    const dx = n1.x - n2.x;
                    const dy = n1.y - n2.y;
                    const distSq = dx * dx + dy * dy || 1;
                    const dist = Math.sqrt(distSq);

                    const force = repulsionForce / distSq;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    n1.vx += fx; n1.vy += fy;
                    n2.vx -= fx; n2.vy -= fy;
                }
            }

            // Attraction
            rawLinks.forEach(link => {
                const s = simNodes.find(n => n.id === link.source);
                const t = simNodes.find(n => n.id === link.target);
                if (s && t) {
                    const dx = t.x - s.x;
                    const dy = t.y - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = (dist - 200) * attractionForce;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    s.vx += fx; s.vy += fy;
                    t.vx -= fx; t.vy -= fy;
                }
            });

            // Update positions
            simNodes.forEach(n => {
                if (n.isRoot) {
                    n.vx += (150 - n.x) * 0.08;
                    n.vy += (height / 2 - n.y) * 0.08;
                } else {
                    n.vx += (width * 0.6 - n.x) * 0.01;
                    n.vy += (height / 2 - n.y) * 0.01;
                }

                n.x += n.vx;
                n.y += n.vy;
                n.vx *= damping;
                n.vy *= damping;

                n.x = Math.max(n.size, Math.min(width - n.size, n.x));
                n.y = Math.max(n.size, Math.min(height - n.size, n.y));
            });
        }

        setNodes(simNodes);
        setLinks(rawLinks);
    }, [data]);

    if (!data || !data.nodes) return null;

    return (
        <div className="relative group/graph">
            {/* Visual Aura */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-blue-600/20 rounded-[3rem] blur-xl opacity-0 group-hover/graph:opacity-100 transition-opacity duration-1000" />

            <div
                ref={containerRef}
                className="relative bg-slate-900 rounded-[2.5rem] p-6 border border-white/10 shadow-2xl min-h-[450px]"
            >
                {/* Background Tech Mesh */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />
                <div className="absolute inset-0 bg-radial-gradient from-blue-500/5 to-transparent pointer-events-none" />

                {/* Header Section */}
                <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative overflow-hidden group">
                            <Orbit size={24} className="text-indigo-400 animate-spin-slow" />
                            <div className="absolute inset-0 bg-indigo-500/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Defect Knowledge Engine</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Relational Intelligence Mapping</span>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Autonomous Core</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="px-5 py-2.5 bg-slate-800/50 rounded-2xl border border-slate-700 backdrop-blur-md flex items-center gap-3">
                            <Zap size={14} className="text-amber-400 fill-amber-400/20" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Neural Link Sync: Active</span>
                        </div>
                    </div>
                </div>

                {/* Interactive Simulation Layer */}
                <div className="relative" style={{ height: dimensions.height }}>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="28"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                            </marker>

                            <linearGradient id="linkGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="1" />
                            </linearGradient>

                            <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                            </linearGradient>
                        </defs>

                        {links.map((link, i) => {
                            const s = nodes.find(n => n.id === link.source);
                            const t = nodes.find(n => n.id === link.target);
                            if (!s || !t) return null;

                            const isPageToPage = s.type === 'page' && t.type === 'page';
                            const isHighlighted = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode);
                            const isActive = !hoveredNode || isHighlighted;

                            return (
                                <g key={`link-group-${i}`} className="transition-opacity duration-300" style={{ opacity: isActive ? 1 : 0.05 }}>
                                    {/* Connection Line */}
                                    <motion.line
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{
                                            pathLength: 1,
                                            opacity: 1,
                                            stroke: isHighlighted ? 'url(#linkGradActive)' : 'url(#linkGrad)'
                                        }}
                                        transition={{ duration: 1.5, delay: i * 0.01 }}
                                        x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                        strokeWidth={isHighlighted ? (isPageToPage ? "4" : "3") : (isPageToPage ? "2" : "1")}
                                        strokeDasharray={isPageToPage ? "0" : "4 2"}
                                        markerEnd="url(#arrowhead)"
                                        className={isHighlighted ? "text-indigo-400" : (isPageToPage ? "text-indigo-500/30" : "text-indigo-900/20")}
                                    />

                                    {/* Moving Data Particle */}
                                    {isHighlighted && (
                                        <motion.circle
                                            r="2.5"
                                            fill="#fff"
                                            animate={{
                                                cx: [s.x, t.x],
                                                cy: [s.y, t.y],
                                            }}
                                            transition={{
                                                duration: 1.2,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                            style={{ filter: 'drop-shadow(0 0 5px #6366f1)' }}
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    <AnimatePresence>
                        {nodes.map((node, i) => {
                            const isPage = node.type === 'page';
                            const isRelated = hoveredNode && (
                                node.id === hoveredNode ||
                                links.some(l => (l.source === hoveredNode && l.target === node.id) || (l.target === hoveredNode && l.source === node.id))
                            );
                            const isActive = !hoveredNode || isRelated;

                            return (
                                <motion.div
                                    key={node.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: isActive ? 1 : 0.7,
                                        opacity: isActive ? 1 : 0.2
                                    }}
                                    onMouseEnter={() => setHoveredNode(node.id)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    className="absolute cursor-pointer z-20"
                                    style={{
                                        x: node.x - node.size / 2,
                                        y: node.y - node.size / 2,
                                        width: node.size,
                                        height: node.size
                                    }}
                                >
                                    <div className={`w-full h-full rounded-2xl flex flex-col items-center justify-center gap-1 border backdrop-blur-xl transition-all shadow-2xl relative
                                        ${isPage
                                            ? (node.criticalCount > 0 ? 'bg-rose-500/10 border-rose-500/50 text-rose-100 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.1)]')
                                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]'}`}
                                        style={{
                                            width: node.size,
                                            height: node.size,
                                            borderColor: hoveredNode === node.id ? (node.criticalCount > 0 ? '#fb7185' : '#818cf8') : undefined,
                                            borderWidth: (node.criticalCount || 0) > 0 ? '2px' : '1px'
                                        }}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-transform ${hoveredNode === node.id ? 'scale-100' : 'scale-[0.7]'} ${isPage ? (node.criticalCount > 0 ? 'bg-rose-500/20' : 'bg-indigo-500/20') : 'bg-emerald-500/20'}`}>
                                            {isPage ? (node.isRoot ? <Orbit size={16} className={node.criticalCount > 0 ? "text-rose-400" : "text-indigo-400"} /> : <Database size={14} />) : <AlertCircle size={14} />}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-center px-1 line-clamp-1 max-w-full">
                                            {node.isRoot ? 'ROOT' : (node.id.split('/').pop() || node.id)}
                                        </span>

                                        {/* Tooltip on Hover */}
                                        <AnimatePresence>
                                            {hoveredNode === node.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                                    animate={{ opacity: 1, y: -60, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="absolute whitespace-nowrap bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] pointer-events-none"
                                                >
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={`w-2 h-2 rounded-full ${isPage ? (node.criticalCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500') : 'bg-emerald-500'}`} />
                                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                                                            {isPage ? 'Asset Intelligence' : 'Defect Pattern'}
                                                        </p>
                                                    </div>
                                                    <p className="text-xs font-black text-white mb-3 max-w-[200px] truncate">{node.id}</p>

                                                    {isPage && (
                                                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                                                            <div>
                                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Health Score</p>
                                                                <p className={`text-sm font-black ${node.score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{node.score}%</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Critical Defects</p>
                                                                <p className={`text-sm font-black ${node.criticalCount > 0 ? 'text-rose-500' : 'text-white/60'}`}>{node.criticalCount || 0}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Neural Pulse Inner */}
                                    {isPage && (node.criticalCount > 0 || node.isRoot) && (
                                        <>
                                            <motion.div
                                                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                                                transition={{ duration: node.criticalCount > 0 ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
                                                className={`absolute inset-0 rounded-[1.5rem] ${node.criticalCount > 0 ? 'bg-rose-400/20 shadow-[0_0_40px_rgba(244,63,94,0.4)]' : 'bg-indigo-400/20 shadow-[0_0_30px_rgba(99,102,241,0.3)]'} -z-10`}
                                                style={{ width: node.size, height: node.size }}
                                            />
                                        </>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Footer Insight Legend */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 border-t border-white/5 pt-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Database size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Source Assets</p>
                            <p className="text-lg font-black text-white">{nodes.filter(n => n.type === 'page').length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Defect Clusters</p>
                            <p className="text-lg font-black text-white">{nodes.filter(n => n.type !== 'page').length}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Share2 size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Correlated Links</p>
                            <p className="text-lg font-black text-white">{links.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div >
    );
};

export default DefectKnowledgeGraph;
