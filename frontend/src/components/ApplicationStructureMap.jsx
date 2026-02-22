import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Activity, Info, AlertCircle } from 'lucide-react';

/**
 * Utility: Converts scan result into graph data (nodes and edges)
 */
const buildGraphData = (result) => {
    if (!result || !result.pages) return { nodes: [], links: [] };

    const nodes = result.pages.map((page, index) => ({
        id: index,
        url: page.url,
        score: page.score || 0,
        issueCount: page.issues?.length || 0,
        criticalCount: page.issues?.filter(i => (i.severity || '').toLowerCase() === 'critical').length || 0,
        type: index === 0 ? 'root' : 'page'
    }));

    const links = [];
    if (nodes.length > 1) {
        for (let i = 1; i < nodes.length; i++) {
            links.push({ source: 0, target: i });
        }
    }

    return { nodes, links };
};

const getNodeColor = (score) => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
};

const ApplicationStructureMap = ({ result }) => {
    const [hoveredNode, setHoveredNode] = useState(null);
    const { nodes, links } = useMemo(() => buildGraphData(result), [result]);

    if (!nodes || nodes.length === 0) {
        return null;
    }

    // Layout configuration
    const width = 600;
    const height = 450;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    const positionedNodes = nodes.map((node, i) => {
        if (i === 0) return { ...node, x: centerX, y: centerY };

        const angle = (2 * Math.PI * (i - 1)) / (nodes.length - 1);
        return {
            ...node,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
            <div className="p-4 sm:p-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Globe size={16} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Diagnostic Architecture Map</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Node size reflects issue density</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Stable</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase">Warning</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
                        <span className="text-[10px] font-black text-slate-900 uppercase">Critical</span>
                    </div>
                </div>
            </div>

            <div className="relative p-6 sm:p-10 bg-slate-50/30 flex items-center justify-center min-h-[450px]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-[800px] drop-shadow-sm overflow-visible">
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Render Lines */}
                    {links.map((link, i) => {
                        const source = positionedNodes[link.source];
                        const target = positionedNodes[link.target];
                        return (
                            <motion.line
                                key={`link-${i}`}
                                x1={source.x} y1={source.y}
                                x2={target.x} y2={target.y}
                                stroke="#e2e8f0"
                                strokeWidth="2"
                                strokeDasharray="6 4"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 0.8 }}
                                transition={{ duration: 1.5, delay: i * 0.1 }}
                            />
                        );
                    })}

                    {/* Render Nodes */}
                    {positionedNodes.map((node, i) => {
                        // Node radius proportional to issue count (base 14, max 28)
                        const radius = Math.min(14 + (node.issueCount * 2), 32);
                        const isCriticalNode = node.criticalCount > 2 || node.score < 40;

                        return (
                            <g key={`node-${i}`} className="cursor-pointer group">
                                {isCriticalNode && (
                                    <motion.circle
                                        cx={node.x} cy={node.y}
                                        r={radius + 4}
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                )}
                                <motion.circle
                                    cx={node.x} cy={node.y}
                                    r={radius}
                                    fill={getNodeColor(node.score)}
                                    stroke="white"
                                    strokeWidth="4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileHover={{ scale: 1.15, strokeWidth: 5 }}
                                    transition={{ type: 'spring', damping: 15, delay: i * 0.05 }}
                                    onMouseEnter={() => setHoveredNode(node)}
                                    onMouseLeave={() => setHoveredNode(null)}
                                    filter={isCriticalNode ? "url(#glow)" : ""}
                                />
                                {i === 0 && (
                                    <Globe
                                        x={node.x - 10}
                                        y={node.y - 10}
                                        size={20}
                                        className="text-white pointer-events-none drop-shadow-md"
                                    />
                                )}
                                {node.issueCount > 0 && i !== 0 && (
                                    <text
                                        x={node.x}
                                        y={node.y + 4}
                                        textAnchor="middle"
                                        className="text-[10px] font-black fill-white pointer-events-none"
                                        style={{ fontSize: Math.min(10, radius / 2) }}
                                    >
                                        {node.issueCount}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Tooltip Overlay */}
                <AnimatePresence>
                    {hoveredNode && (
                        <motion.div
                            initial={{ opacity: 0, y: 15, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0 }}
                            className="absolute bottom-10 left-1/2 bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-6 min-w-[320px] max-w-[90%]"
                        >
                            <div className="flex items-center gap-4 border-r border-slate-800 pr-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${hoveredNode.score >= 80 ? 'bg-emerald-500/10' : hoveredNode.score >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                                    <Activity size={24} className={hoveredNode.score >= 80 ? 'text-emerald-400' : hoveredNode.score >= 50 ? 'text-amber-400' : 'text-red-400'} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Asset Health</p>
                                    <p className="text-xs font-bold truncate max-w-[200px] mb-1">{hoveredNode.url}</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${hoveredNode.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : hoveredNode.score >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {hoveredNode.score}/100
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Issues</p>
                                    <p className="text-xl font-black text-white leading-none">{hoveredNode.issueCount}</p>
                                </div>
                                {hoveredNode.criticalCount > 0 && (
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-0.5">Critical</p>
                                        <p className="text-xl font-black text-red-400 leading-none">{hoveredNode.criticalCount}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!hoveredNode && (
                    <div className="absolute top-8 left-8 flex items-center gap-2.5 bg-white/60 p-2.5 pr-4 rounded-xl border border-slate-100 backdrop-blur-md shadow-sm">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Info size={14} className="text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Hover nodes to view risk density metrics</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ApplicationStructureMap;
