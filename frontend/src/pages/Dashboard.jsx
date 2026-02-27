import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useScanContext } from '../context/ScanContext';
import {
    Activity, Shield, ShieldCheck, Bug, Layers, Globe, Download, ArrowRight,
    Cpu, Map, Gauge, Zap, Box, BarChart2, CheckCircle2, AlertTriangle, Search, Target
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie
} from 'recharts';

// ─── Component: Cyber Widget ──────────────────────────────────────────────────
const CyberWidget = ({ title, icon: Icon, colorClass, children, onClick }) => {
    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
            onClick={onClick}
            className="bg-[#1E293B]/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col justify-between h-full relative overflow-hidden group cursor-pointer transition-all"
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={`flex items-center gap-3 ${colorClass}`}>
                        <div className="p-2 bg-[#0F172A] rounded-lg border border-slate-700/50">
                            <Icon size={18} />
                        </div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">{title}</h4>
                    </div>
                    <ArrowRight size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="flex-1 min-h-[140px]">
                    {children}
                </div>
            </div>
            {/* Subtle glow effect behind the card */}
            <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-current ${colorClass}`} style={{ pointerEvents: 'none' }} />
        </motion.div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = () => {
    const navigate = useNavigate();
    const { scanResult, targetUrl, isScanning, isProcessing } = useScanContext();

    const result = useMemo(() => scanResult || {}, [scanResult]);

    // Mock Data for charts if no real data is present
    const bugData = useMemo(() => [
        { name: 'Logic', value: result.issuesSummary?.stats?.medium || 4, color: '#FCD34D' },
        { name: 'Visual', value: result.issuesSummary?.stats?.high || 10, color: '#F97316' },
        { name: 'Perf', value: result.issuesSummary?.stats?.critical || 6, color: '#EF4444' },
    ], [result]);

    const agentData = useMemo(() => [
        { time: 'T-4', load: 20 }, { time: 'T-3', load: 45 }, { time: 'T-2', load: 30 }, { time: 'T-1', load: 85 }, { time: 'Now', load: 60 },
    ], []);

    const behavioralData = useMemo(() => [
        { metric: 'Discovery', score: 98, fill: '#10B981' },
        { metric: 'Interaction', score: 85, fill: '#6366F1' },
        { metric: 'Logic', score: 92, fill: '#8B5CF6' }
    ], []);

    if ((isScanning || isProcessing) && !scanResult) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-8 bg-[#0F172A] text-white">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                    <div className="w-20 h-20 rounded-2xl border-2 border-indigo-500/30 border-t-indigo-500 flex items-center justify-center">
                        <Activity size={32} className="text-indigo-400" />
                    </div>
                </motion.div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-200">Synthesizing Platform Intelligence...</h2>
                    <p className="text-slate-500 font-mono text-sm">Deep inspection active across core intelligence modules.</p>
                </div>
            </div>
        );
    }

    const overallScore = result.issuesSummary?.qualityIntelligence?.overallQualityScore || 91;

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300 p-6 lg:p-10 space-y-10 selection:bg-indigo-500/30">
            {/* Header / Executive Summary */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-slate-800 pb-8">
                <div className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-100 tracking-tight">Application Summary</h1>
                    <div className="flex items-center gap-3 text-sm font-mono text-slate-400">
                        <Globe size={14} className="text-blue-400" />
                        <span className="text-blue-300">{targetUrl || 'Waiting for Target URL...'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#1E293B] border border-slate-700 hover:border-slate-8000 text-slate-200 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all">
                        <Download size={14} /> Export Intel Report
                    </button>
                </div>
            </div>

            {/* Core Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1E293B]/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase">System Grade</span>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">{overallScore}</span>
                        <span className="text-sm font-bold text-indigo-400">/ 100</span>
                    </div>
                </div>
                <div className="bg-[#1E293B]/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Risk Level</span>
                    <div className="mt-2 text-3xl font-black text-amber-400 uppercase">
                        {result.issuesSummary?.qualityIntelligence?.riskLevel || 'MODERATE'}
                    </div>
                </div>
                <div className="bg-[#1E293B]/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Total Anomalies</span>
                    <div className="mt-2 text-3xl font-black text-rose-400">
                        {result.issuesSummary?.stats?.totalDefects || 14}
                    </div>
                </div>
                <div className="bg-[#1E293B]/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Analyzed Nodes</span>
                    <div className="mt-2 text-3xl font-black text-blue-400">
                        {result.issuesSummary?.stats?.totalPages || 42}
                    </div>
                </div>
            </div>

            {/* Analytical Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* AI Agents */}
                <CyberWidget title="Agent Telemetry" icon={Cpu} colorClass="text-indigo-400" onClick={() => navigate('/agents')}>
                    <div className="h-full w-full flex flex-col justify-between">
                        <ResponsiveContainer width="100%" height={90}>
                            <AreaChart data={agentData}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818CF8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="load" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                            <span>12 Active Clusters</span>
                            <span className="text-indigo-300">98.4% Success</span>
                        </div>
                    </div>
                </CyberWidget>

                {/* Bug Detection */}
                <CyberWidget title="Defect Distribution" icon={Bug} colorClass="text-rose-400" onClick={() => navigate('/bugs')}>
                    <div className="h-full w-full flex items-center justify-between gap-4">
                        <div className="w-1/2 h-full">
                            <ResponsiveContainer width="100%" height={120}>
                                <BarChart data={bugData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                                        {bugData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 flex flex-col gap-2">
                            {bugData.map(b => (
                                <div key={b.name} className="flex justify-between items-center border-b border-slate-700/50 pb-1">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">{b.name}</span>
                                    <span className="text-xs font-mono font-bold text-slate-200">{b.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CyberWidget>

                {/* Behavioral Discovery */}
                <CyberWidget title="Discovery Matrix" icon={Map} colorClass="text-blue-400" onClick={() => navigate('/discovery')}>
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 border border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-2 border border-blue-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                            <Target size={24} className="text-blue-400" />
                        </div>
                        <p className="mt-4 text-[10px] font-mono text-slate-400 uppercase text-center">Neural Mapping Deep Scan Active.<br />{result.issuesSummary?.stats?.totalPages || 42} interaction nodes indexed.</p>
                    </div>
                </CyberWidget>

                {/* Hygiene Classification */}
                <CyberWidget title="Architectural Hygiene" icon={ShieldCheck} colorClass="text-emerald-400" onClick={() => navigate('/hygiene')}>
                    <div className="flex items-center justify-between h-full">
                        <div className="relative w-24 h-24">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={[{ value: 82 }, { value: 18 }]} innerRadius={30} outerRadius={40} dataKey="value" stroke="none">
                                        <Cell fill="#10B981" />
                                        <Cell fill="#1E293B" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-black text-emerald-400">82%</span>
                            </div>
                        </div>
                        <div className="flex-1 ml-4 space-y-2">
                            <div className="text-[10px] font-mono text-slate-400 uppercase">DOM Health</div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[82%]" /></div>
                            <div className="text-[10px] font-mono text-slate-400 uppercase mt-2">Semantic Compliance</div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-[95%]" /></div>
                        </div>
                    </div>
                </CyberWidget>

                {/* Network Resilience */}
                <CyberWidget title="Network Integrity" icon={Zap} colorClass="text-violet-400" onClick={() => navigate('/dashboard')}>
                    <div className="flex flex-col justify-center h-full gap-3">
                        {behavioralData.map(d => (
                            <div key={d.metric} className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-slate-400 w-16 uppercase">{d.metric}</span>
                                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full" style={{ width: `${d.score}%`, backgroundColor: d.fill }} />
                                </div>
                                <span className="text-[10px] text-slate-200 font-mono w-6 text-right">{d.score}</span>
                            </div>
                        ))}
                    </div>
                </CyberWidget>

                {/* Device Architecture */}
                <CyberWidget title="Device Matrix" icon={Box} colorClass="text-cyan-400" onClick={() => navigate('/device')}>
                    <div className="flex items-center justify-around h-full">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-16 border-2 border-slate-700 rounded-md flex items-center justify-center relative">
                                <div className="absolute top-1 w-3 h-0.5 bg-slate-700 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500">Mobile</span>
                            </div>
                            <CheckCircle2 size={12} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-12 border-2 border-slate-700 rounded-md flex items-center justify-center" >
                                <span className="text-[10px] font-bold text-slate-500">Tablet</span>
                            </div>
                            <CheckCircle2 size={12} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-20 h-14 border-2 border-cyan-500/50 bg-cyan-500/5 rounded-md flex flex-col items-center justify-center relative">
                                <span className="text-[10px] font-bold text-cyan-400 block -mt-1">Desktop</span>
                                <div className="absolute bottom-[-4px] w-8 h-1 bg-cyan-700 rounded-sm" />
                            </div>
                            <AlertTriangle size={12} className="text-amber-500 mt-1" />
                        </div>
                    </div>
                </CyberWidget>

                {/* Quality Engineering */}
                <CyberWidget title="Quality Pipeline" icon={Layers} colorClass="text-amber-400" onClick={() => navigate('/quality')}>
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-mono text-slate-300">Pipeline Sync Active</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed px-4">
                            All heuristic validations passed. Readiness score optimized for production deployment.
                        </p>
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/30 px-3 py-1 rounded bg-amber-500/10">
                            Readiness: {result.issuesSummary?.qualityIntelligence?.readiness || 85}%
                        </div>
                    </div>
                </CyberWidget>

                {/* Structural Analysis */}
                <CyberWidget title="Structural Fragility" icon={Target} colorClass="text-rose-500" onClick={() => navigate('/discovery')}>
                    <div className="flex items-center justify-center h-full">
                        <div className="relative w-full px-4">
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
                                <span>Static Nodes</span>
                                <span>Interaction Hubs</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 w-[40%]" />
                            </div>
                            <p className="text-center mt-4 text-[11px] text-slate-400 uppercase tracking-widest font-black">42% Architectural Saturation</p>
                        </div>
                    </div>
                </CyberWidget>

                {/* Defect Scoring */}
                <CyberWidget title="Priority Matrix" icon={BarChart2} colorClass="text-pink-400" onClick={() => navigate('/scoring')}>
                    <div className="grid grid-cols-2 gap-2 h-full py-2 px-4">
                        {[
                            { l: 'Critical', n: result.issuesSummary?.stats?.critical || 2, c: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
                            { l: 'High', n: result.issuesSummary?.stats?.high || 4, c: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
                            { l: 'Medium', n: result.issuesSummary?.stats?.medium || 6, c: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
                            { l: 'Low', n: result.issuesSummary?.stats?.low || 2, c: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                        ].map(s => (
                            <div key={s.l} className={`${s.c} border rounded-xl flex flex-col items-center justify-center p-2`}>
                                <span className="text-xl font-black">{s.n}</span>
                                <span className="text-[9px] font-mono uppercase opacity-80 mt-1">{s.l}</span>
                            </div>
                        ))}
                    </div>
                </CyberWidget>
            </div>

            <div className="pt-8 text-center">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">Engineered for Autonomy</p>
            </div>
        </div>
    );
};

export default Dashboard;
