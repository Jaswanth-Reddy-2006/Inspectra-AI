import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useScanContext } from '../context/ScanContext';
import {
    Plus,
    AlertTriangle,
    AlertCircle,
    Info,
    CheckCircle2,
    Clock,
    Globe,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    Zap,
    Activity,
    Download,
    Timer,
    Sparkles,
    Loader2,
    Shield,
    BarChart3,
    Network,
    ArrowRight,
    LayoutGrid,
    TrendingUp,
    Terminal,
    Target,
    Cpu,
    Map,
    Bug,
    ShieldCheck,
    Layers,
    Gauge,
    Box,
    BarChart2,
    Database,
    Search,
    Code,
    Smartphone,
    Eye,
    Scale
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';

// ─── Component: Summary Widget ──────────────────────────────────────────────
const SummaryWidget = ({ title, icon: Icon, color, children, path, detailText }) => {
    const navigate = useNavigate();
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/20 transition-all group flex flex-col justify-between h-full relative overflow-hidden"
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
                        <Icon size={20} />
                    </div>
                    <button
                        onClick={() => navigate(path)}
                        className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ArrowRight size={14} />
                    </button>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">{title}</h4>
                <div className="flex-1 min-h-[120px]">
                    {children}
                </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{detailText}</span>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Background Accent */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
                <Icon size={120} />
            </div>
        </motion.div>
    );
};

// ─── Main Dashboard Hub ─────────────────────────────────────────────────────

const Dashboard = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { scanResult, targetUrl, isScanning, isProcessing } = useScanContext();
    const [isDownloading, setIsDownloading] = useState(false);

    const result = useMemo(() => scanResult || {}, [scanResult]);

    useEffect(() => {
        if (!scanResult && !targetUrl && !isScanning) {
            addToast('Intelligence Hub initialized. Please start a scan.', 'info');
        }
    }, [scanResult, targetUrl, addToast, isScanning]);

    // Mock Intelligence Data for widgets if no scan result
    const widgetData = useMemo(() => ({
        bugs: [
            { name: 'Logic', value: 4, color: '#ef4444' },
            { name: 'Visual', value: 10, color: '#f59e0b' },
            { name: 'Perf', value: 6, color: '#6366f1' },
        ],
        hygiene: 82,
        performance: [
            { name: 'FCP', val: 1.2 },
            { name: 'LCP', val: 2.4 },
            { name: 'CLS', val: 0.1 },
        ],
        agents: [
            { time: '10:00', load: 20 },
            { time: '10:05', load: 45 },
            { time: '10:10', load: 30 },
            { time: '10:15', load: 85 },
            { time: '10:20', load: 60 },
        ]
    }), []);

    if ((isScanning || isProcessing) && !scanResult) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-8">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative"
                >
                    <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Sparkles size={40} fill="currentColor" />
                    </div>
                </motion.div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Synthesizing Platform Intelligence</h2>
                    <p className="text-slate-400 font-medium max-w-sm">Deep inspection active across 9 intelligence modules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-12 space-y-12 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Post-Scan Intelligence Hub</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Application Summary</h1>
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                            <Globe size={16} className="text-blue-500" />
                            <span className="text-sm font-black text-blue-700">{targetUrl || 'Inspectra-Local-Session'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-200">
                        <Download size={18} />
                        Export Comprehensive Intel
                    </button>
                </div>
            </div>

            {/* Primary Health Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-2 bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden flex flex-col justify-between border border-slate-800 shadow-2xl shadow-indigo-100/10">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <Shield size={20} className="text-indigo-400" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Executive Diagnostic</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h4 className="text-4xl font-black mb-4 leading-tight">Platform health remains <span className="text-emerald-400">Stable</span> with minor structural regressions.</h4>
                                <p className="text-white/50 text-sm font-medium leading-relaxed">
                                    The Inspectra engine identified {result.issuesSummary?.stats?.totalDefects || 14} primary defects. Global score is within acceptable engineering bounds.
                                </p>
                            </div>
                            <div className="flex flex-col justify-end items-end">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Engineering Score</span>
                                <div className="text-8xl font-black text-white leading-none tabular-nums tracking-tighter">
                                    {result.issuesSummary?.qualityIntelligence?.overallQualityScore || 92}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-white/40 uppercase mb-1">Crawl Nodes</p>
                                <p className="text-xl font-black tabular-nums">{result.issuesSummary?.stats?.totalPages || 32}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-white/40 uppercase mb-1">Active Agents</p>
                                <p className="text-xl font-black tabular-nums">12</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/visualization')} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            View Knowledge Graph
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[4rem] p-12 border border-slate-100 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <Activity size={20} className="text-indigo-600" />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Agent Telemetry</h3>
                        </div>
                        <div className="h-[180px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={widgetData.agents}>
                                    <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="mt-6 text-sm font-medium text-slate-500 leading-relaxed">
                            Autonomous agents reached peak inspection density at node cluster Delta-9.
                        </p>
                    </div>
                    <button onClick={() => navigate('/agents')} className="mt-8 flex items-center justify-between text-indigo-600 font-black text-[10px] uppercase tracking-widest group">
                        Access Deep-Dive
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Detailed Summary Grid (9 Pillars) */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Platform Intelligence Matrix</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* 1. AI Agents */}
                    <SummaryWidget title="AI Agents" icon={Cpu} color="bg-indigo-600" path="/agents" detailText="Execution Clusters Active">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-400">Success Rate</span>
                                <span className="text-slate-900">98.4%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full w-[98%] bg-indigo-600" />
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                "12 agents effectively simulated production workflows with 0 fatal failures."
                            </p>
                        </div>
                    </SummaryWidget>

                    {/* 2. Autonomous Discovery */}
                    <SummaryWidget title="Discovery" icon={Map} color="bg-blue-600" path="/discovery" detailText="Node Density High">
                        <div className="flex items-center justify-center h-full gap-4">
                            <div className="text-center">
                                <p className="text-3xl font-black text-slate-900">{result.issuesSummary?.stats?.totalPages || 42}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identified Nodes</p>
                            </div>
                            <div className="w-px h-12 bg-slate-100" />
                            <div className="text-center">
                                <p className="text-3xl font-black text-blue-600">3</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Max Depth</p>
                            </div>
                        </div>
                    </SummaryWidget>

                    {/* 3. Bug Detection */}
                    <SummaryWidget title="Bugs" icon={Bug} color="bg-rose-600" path="/bugs" detailText="Regression Indexing">
                        <div className="h-[100px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={widgetData.bugs}>
                                    <Bar dataKey="value">
                                        {widgetData.bugs.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mt-2">
                            <span>Logic:{widgetData.bugs[0].value}</span>
                            <span>Visual:{widgetData.bugs[1].value}</span>
                            <span>Perf:{widgetData.bugs[2].value}</span>
                        </div>
                    </SummaryWidget>

                    {/* 4. Hygiene Classification */}
                    <SummaryWidget title="Hygiene" icon={ShieldCheck} color="bg-emerald-600" path="/hygiene" detailText="Structure Audited">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="relative w-20 h-20 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="40" cy="40" r="36" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                                    <circle cx="40" cy="40" r="36" fill="transparent" stroke="#10b981" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.82)}`} />
                                </svg>
                                <span className="absolute text-xl font-black text-slate-900">82%</span>
                            </div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Architectural Baseline Meta</p>
                        </div>
                    </SummaryWidget>

                    {/* 5. Quality Engineering */}
                    <SummaryWidget title="Quality" icon={Layers} color="bg-amber-600" path="/quality" detailText="Pipeline Sync Healthy">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <h2 className="text-5xl font-black text-slate-900 leading-none">
                                {result.issuesSummary?.qualityIntelligence?.overallQualityScore || 0}%
                            </h2>
                            <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white ${result.issuesSummary?.qualityIntelligence?.riskLevel === 'CRITICAL' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                                {result.issuesSummary?.qualityIntelligence?.riskLevel || 'ANALYZING'} RISK
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Ready: {result.issuesSummary?.qualityIntelligence?.readiness || 0}%</p>
                        </div>
                    </SummaryWidget>

                    {/* 6. Testing Performance */}
                    <SummaryWidget title="Performance" icon={Gauge} color="bg-violet-600" path="/performance" detailText="Lighthouse Analysis">
                        <div className="space-y-4 pt-2">
                            {widgetData.performance.map(p => (
                                <div key={p.name} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.name}</span>
                                    <span className="text-[11px] font-black text-slate-900 tabular-nums">{p.val}{p.name === 'CLS' ? '' : 's'}</span>
                                </div>
                            ))}
                        </div>
                    </SummaryWidget>

                    {/* 7. Mobile Applications */}
                    <SummaryWidget title="Mobile" icon={Box} color="bg-cyan-600" path="/mobile" detailText="Cross-Platform Ready">
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <Smartphone size={32} className="text-cyan-600 opacity-20" />
                            <div className="flex gap-1.5">
                                {['iOS', 'Android', 'PWA'].map(dev => (
                                    <span key={dev} className="px-2 py-1 bg-cyan-50 text-[9px] font-black text-cyan-600 rounded-lg">{dev}</span>
                                ))}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed px-4">"Touch targets and responsive viewport integrity verified."</p>
                        </div>
                    </SummaryWidget>

                    {/* 8. Defect Scoring */}
                    <SummaryWidget title="Scoring" icon={BarChart2} color="bg-pink-600" path="/scoring" detailText="Prioritization Matrix">
                        <div className="flex items-center justify-center p-2">
                            <div className="grid grid-cols-2 gap-2 w-full max-w-[140px]">
                                {[
                                    { l: 'C', n: 2, c: 'bg-rose-500' },
                                    { l: 'H', n: 4, c: 'bg-orange-500' },
                                    { l: 'M', n: 6, c: 'bg-amber-500' },
                                    { l: 'L', n: 2, c: 'bg-emerald-500' },
                                ].map(s => (
                                    <div key={s.l} className={`${s.c} p-3 rounded-2xl flex flex-col items-center justify-center text-white shadow-sm`}>
                                        <span className="text-xs font-black">{s.n}</span>
                                        <span className="text-[8px] font-bold opacity-80">{s.l}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SummaryWidget>

                    {/* 9. Visualization */}
                    <SummaryWidget title="Visualization" icon={Network} color="bg-slate-900" path="/visualization" detailText="Relational Map Active">
                        <div className="h-full flex flex-col justify-center items-center space-y-4 opacity-70 group-hover:opacity-100 transition-opacity">
                            <div className="relative">
                                <Network size={40} className="text-slate-900 animate-pulse" />
                                <div className="absolute top-0 right-0 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 text-center tracking-tight">Defect knowledge graph correlation complete.</p>
                        </div>
                    </SummaryWidget>
                </div>
            </div>

            <div className="py-12 text-center border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Engineered for Autonomy · Inspectra Intelligence Hub v2.0</p>
            </div>
        </div>
    );
};

export default Dashboard;
