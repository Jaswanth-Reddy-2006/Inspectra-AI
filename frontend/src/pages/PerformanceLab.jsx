import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gauge, Activity, Zap, AlertTriangle, ShieldCheck,
    Play, Pause, Square, TrendingUp, Cpu, Database,
    Network, Layout, Clock, ChevronRight, Info, AlertCircle,
    ArrowUpRight, BarChart3, Binary, Settings2
} from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip
} from 'recharts';

// --- Constants & Mock Data ---

const LOAD_PROFILES = {
    LIGHT: { users: 50, reqSec: 120, baselineLatency: 45, variance: 10, cpu: 12, mem: 400 },
    MODERATE: { users: 500, reqSec: 1200, baselineLatency: 180, variance: 40, cpu: 45, mem: 1200 },
    HEAVY: { users: 2500, reqSec: 8500, baselineLatency: 450, variance: 120, cpu: 82, mem: 4800 },
    CRITICAL: { users: 10000, reqSec: 25000, baselineLatency: 1200, variance: 500, cpu: 98, mem: 12000 }
};

const BOTTLENECK_TYPES = {
    CPU_SPIKE: { cause: 'Heavy SHA-256 Hashing', severity: 'High', confidence: 94, fix: 'Offload to Web Workers or background queue.' },
    MEM_LEAK: { cause: 'DOM Node Accumulation in ProductList', severity: 'Critical', confidence: 89, fix: 'Implement virtualization for large lists.' },
    DB_LATENCY: { cause: 'Unindexed Query on /api/forensics', severity: 'Medium', confidence: 91, fix: 'Add composite index to (agentId, timestamp).' },
    NETWORK_CONGESTION: { cause: 'Large Binary Payload (12MB)', severity: 'Medium', confidence: 85, fix: 'Enable GZIP compression or use WebP/AVIF.' }
};

// --- Sub-Components ---

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-indigo-400 shrink-0 shadow-2xl">
            <Icon size={16} strokeWidth={2.5} />
        </div>
        <div>
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none mb-1">{title}</h3>
            {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight opacity-70">{subtitle}</p>}
        </div>
    </div>
);

const ExecutiveMetric = ({ label, value, unit, status }) => {
    const isHealthy = status === 'Healthy';
    const isDegrading = status === 'Degrading';
    const indicatorColor = isHealthy ? 'bg-emerald-500 shadow-emerald-500/50' : isDegrading ? 'bg-amber-500 shadow-amber-500/50' : 'bg-rose-500 shadow-rose-500/50';

    return (
        <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            className="glass-card p-4 rounded-2xl border border-white/40 flex flex-col gap-1 transition-all hover:bg-white/80 hover:shadow-2xl hover:shadow-slate-200/50 group cursor-pointer"
        >
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
                <div className={`w-2 h-2 rounded-full ${indicatorColor} ${!isHealthy ? 'animate-pulse shadow-[0_0_12px_rgba(0,0,0,0.2)]' : ''}`} />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-2xl font-black tabular-nums tracking-tighter ${isHealthy ? 'text-slate-900' : isDegrading ? 'text-amber-600' : 'text-rose-600'}`}>{value}</span>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{unit}</span>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full mt-2 overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    className={`h-full rounded-full ${isHealthy ? 'bg-indigo-500' : isDegrading ? 'bg-amber-500' : 'bg-rose-500'}`}
                />
            </div>
        </motion.div>
    );
};

const LoadOption = ({ active, profile, label, onClick }) => (
    <button
        onClick={() => onClick(profile)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 w-full group ${active
            ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            }`}
    >
        <div className="flex flex-col items-start gap-0.5 text-left">
            <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-40' : 'opacity-60'}`}>{label}</span>
            <span className="text-[11px] font-bold leading-none">{LOAD_PROFILES[profile].users} Threads</span>
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-slate-100'}`}>
            <Activity size={14} className={active ? 'text-white' : 'text-slate-400'} />
        </div>
    </button>
);

// --- Main Page ---

const PerformanceLab = () => {
    const [isTesting, setIsTesting] = useState(false);
    const [currentProfile, setCurrentProfile] = useState('LIGHT');
    const [timeRange, setTimeRange] = useState('Real-time');
    const [metrics, setMetrics] = useState({
        score: 98, latency: 42, stability: 99.4, throughput: 124, errors: 0.02, cpu: 12, mem: 420
    });
    const [history, setHistory] = useState([]);
    const [logs, setLogs] = useState([]);
    const [bottlenecks, setBottlenecks] = useState([]);
    const [testDuration, setTestDuration] = useState(0);

    // Simulation Engine
    useEffect(() => {
        let interval;
        if (isTesting) {
            interval = setInterval(() => {
                const profile = LOAD_PROFILES[currentProfile];
                const noise = Math.random() * profile.variance;

                setMetrics(prev => {
                    const newLatency = Math.round(profile.baselineLatency + noise);
                    const newCpu = Math.min(99, Math.round(profile.cpu + (Math.random() * 5)));
                    const newMem = Math.round(profile.mem + (Math.random() * profile.mem * 0.05));

                    if (newCpu > 80 && !bottlenecks.some(b => b.type === 'CPU_SPIKE')) handleBottleneck('CPU_SPIKE');
                    if (newLatency > 1000 && !bottlenecks.some(b => b.type === 'DB_LATENCY')) handleBottleneck('DB_LATENCY');

                    return {
                        score: Math.max(0, 100 - (newLatency / 20) - (newCpu / 4)),
                        latency: newLatency,
                        stability: Math.max(70, 100 - (profile.users / 200)),
                        throughput: Math.round(profile.reqSec + (Math.random() * profile.reqSec * 0.1)),
                        errors: profile.users > 5000 ? 2.4 : 0.02,
                        cpu: newCpu,
                        mem: newMem
                    };
                });

                setHistory(prev => [...prev, {
                    time: new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
                    cpu: profile.cpu + (Math.random() * 5),
                    mem: profile.mem / 100,
                    latency: profile.baselineLatency + noise
                }].slice(-30));

                setTestDuration(d => d + 1);
            }, 1000);
        } else {
            setMetrics(prev => ({ ...prev, cpu: 5, latency: 25, throughput: 0, score: 99 }));
        }
        return () => clearInterval(interval);
    }, [isTesting, currentProfile, bottlenecks]);

    const handleBottleneck = (type) => {
        const b = { ...BOTTLENECK_TYPES[type], id: Math.random(), timestamp: new Date().toLocaleTimeString() };
        setBottlenecks(prev => [b, ...prev].slice(0, 3));
        addLog(`System`, `Anomaly detected: ${type.replace('_', ' ')} logic`, 'WARNING');
    };

    const addLog = useCallback((source, message, severity) => {
        setLogs(prev => [
            { id: Math.random(), time: new Date().toLocaleTimeString(), source, message, severity },
            ...prev
        ].slice(0, 50));
    }, []);

    const toggleTest = () => setIsTesting(!isTesting);
    const stopTest = () => {
        setIsTesting(false);
        setTestDuration(0);
    };

    const stressLevel = useMemo(() => {
        if (metrics.cpu > 80) return { label: 'CRITICAL', color: 'text-rose-500' };
        if (metrics.cpu > 40) return { label: 'MODERATE', color: 'text-amber-500' };
        return { label: 'OPTIMAL', color: 'text-emerald-500' };
    }, [metrics.cpu]);

    return (
        <div className="max-w-[1700px] mx-auto p-4 lg:p-6 space-y-5 min-h-screen bg-[#f1f4f9] text-slate-900 relative overflow-hidden">
            {/* Elite Mesh Background Integration */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[140px]" />
                <div className="grid-bg absolute inset-0 opacity-[0.03]" />
            </div>

            <div className="relative z-10 space-y-6">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900">Performance Lab</h1>
                    </div>
                </div>

                {/* Metric Overview Strip */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                    <ExecutiveMetric label="Efficiency" value={Math.round(metrics.score)} unit="Score" status={metrics.score > 85 ? 'Healthy' : metrics.score > 60 ? 'Degrading' : 'Bottleneck'} />
                    <ExecutiveMetric label="Response" value={metrics.latency} unit="ms" status={metrics.latency < 200 ? 'Healthy' : metrics.latency < 600 ? 'Degrading' : 'Bottleneck'} />
                    <ExecutiveMetric label="Node Stability" value={metrics.stability.toFixed(1)} unit="%" status={metrics.stability > 98 ? 'Healthy' : 'Degrading'} />
                    <ExecutiveMetric label="Throughput" value={metrics.throughput} unit="rq/s" status="Healthy" />
                    <ExecutiveMetric label="Failure Rate" value={metrics.errors} unit="%" status={metrics.errors < 1 ? 'Healthy' : 'Bottleneck'} />
                    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between group overflow-hidden relative border border-white/50 shadow-xl shadow-slate-200/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">System Intensity</span>
                            <div className="p-1 px-2 bg-slate-900 text-white text-[8px] font-black rounded-lg">LIVE</div>
                        </div>
                        <div className="space-y-3 mt-auto relative z-10">
                            <div className="flex justify-between items-baseline">
                                <span className="text-3xl font-black tabular-nums tracking-tighter text-slate-900">{metrics.cpu}%</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${metrics.cpu > 80 ? 'text-rose-500' : 'text-indigo-400'}`}>
                                    {metrics.cpu > 80 ? 'Overload' : 'Optimal'}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden p-[2px] backdrop-blur-md">
                                <motion.div
                                    animate={{ width: `${metrics.cpu}%` }}
                                    className={`h-full rounded-full ${metrics.cpu > 80 ? 'bg-rose-500' : 'bg-indigo-600'} shadow-[0_0_10px_rgba(79,70,229,0.3)]`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">

                    {/* 1. PRIMARY MONITORING AREA (Center Column Logic, but visual hierarchy first) */}
                    <div className="lg:col-span-7 space-y-3">

                        {/* Utilization Graph */}
                        <div className="glass-card rounded-3xl overflow-hidden flex flex-col min-h-[300px] border border-white/60 shadow-2xl shadow-slate-200/50">
                            <div className="p-5 border-b border-slate-100/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <SectionHeader icon={BarChart3} title="Resource Matrix" subtitle="Real-time Node Saturation Analytics" />

                                <div className="flex items-center gap-3">
                                    {/* Elite Controls */}
                                    <div className="flex items-center gap-2 bg-white/40 p-1 rounded-2xl border border-white shadow-inner">
                                        <button
                                            onClick={toggleTest}
                                            className={`h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-lg ${isTesting
                                                ? 'bg-rose-500 text-white shadow-rose-200'
                                                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isTesting ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                                {isTesting ? 'Halt Engine' : 'Energize Load'}
                                            </div>
                                        </button>

                                        {isTesting && (
                                            <button
                                                onClick={stopTest}
                                                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                title="Terminate Session"
                                            >
                                                <Square size={10} fill="currentColor" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                                        <Clock size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black tabular-nums font-mono text-slate-600">
                                            {Math.floor(testDuration / 60)}:{(testDuration % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>

                                    <div className="w-px h-6 bg-slate-200 hidden lg:block" />

                                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                        {['Real-time', '5m', '15m'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTimeRange(t)}
                                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === t ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-3 pt-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeWidth={1} />
                                        <XAxis
                                            dataKey="time"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }}
                                            minTickGap={40}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }}
                                            dx={-10}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', background: '#fff' }}
                                            labelStyle={{ display: 'none' }}
                                        />
                                        <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={2} dot={false} fillOpacity={1} fill="url(#colorCpu)" name="CPU (%)" animationDuration={1000} />
                                        <Area type="monotone" dataKey="mem" stroke="#10b981" strokeWidth={2} dot={false} fillOpacity={1} fill="url(#colorMem)" name="Mem (GB)" animationDuration={1000} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-4 gap-px bg-slate-50 border-t border-slate-50">
                                {[
                                    { label: 'CPU Usage', val: metrics.cpu, unit: '%', icon: Cpu, color: 'text-indigo-500' },
                                    { label: 'System Memory', val: (metrics.mem / 1024).toFixed(1), unit: 'GB', icon: Database, color: 'text-emerald-500' },
                                    { label: 'Frontend Load', val: (metrics.latency * 0.15).toFixed(0), unit: 'ms', icon: Layout, color: 'text-amber-500' },
                                    { label: 'Backend Latency', val: (metrics.latency * 0.85).toFixed(0), unit: 'ms', icon: Network, color: 'text-rose-500' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white p-2.5 flex flex-col gap-0.5 first:pl-4 last:pr-4">
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <s.icon size={11} className={s.color} />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-slate-800 tracking-tighter tabular-nums">{s.val}</span>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{s.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Telemetry Stream */}
                        <div className="glass-card rounded-xl overflow-hidden flex flex-col h-[200px]">
                            <div className="px-4 py-2 border-b border-slate-100/50 flex items-center justify-between">
                                <SectionHeader icon={Binary} title="Telemetry Trace" subtitle="Live High-Frequency Feed" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded text-center">
                                        {logs.length} EVENTS
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                                {logs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 opacity-50 grayscale">
                                        <Activity size={32} />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Idle - Requesting Load Signal</p>
                                    </div>
                                ) : (
                                    logs.map(log => (
                                        <div key={log.id} className="grid grid-cols-12 gap-3 group items-start opacity-80 hover:opacity-100 transition-opacity">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="col-span-12 flex gap-3 p-2.5 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-200/50 hover:bg-white transition-all cursor-default"
                                            >
                                                <div className="shrink-0 pt-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${log.severity === 'CRITICAL' ? 'bg-rose-500' : log.severity === 'WARNING' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-medium text-slate-400 font-mono">{log.time}</span>
                                                        <span className="text-[10px] font-bold text-slate-900 uppercase opacity-40">[{log.source}]</span>
                                                    </div>
                                                    <p className="text-[11px] font-medium text-slate-600 font-mono">{log.message}</p>
                                                </div>
                                            </motion.div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Scalability Forecast Integration */}
                        <div className="glass-card-dark rounded-2xl p-5 text-white space-y-3 shadow-2xl shadow-indigo-900/20">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={12} className="text-indigo-400" />
                                <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">Scale Projection</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-colors hover:bg-white/20">
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Saturation</p>
                                        <p className="text-xs font-black text-white mt-1">45k Concurrent</p>
                                    </div>
                                    <ArrowUpRight size={12} className="text-white/30" />
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between group transition-colors hover:bg-white/20">
                                    <div>
                                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Latency Delta</p>
                                        <p className="text-xs font-black text-white mt-1">+14% Degradation</p>
                                    </div>
                                    <ArrowUpRight size={12} className="text-white/30" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. CONTROLS & ANALYSIS (Right Sidebar) */}
                    <div className="lg:col-span-5 space-y-4">

                        {/* Controls */}
                        <div className="glass-card rounded-xl p-4 flex flex-col gap-4">
                            <SectionHeader icon={Settings2} title="Simulator Config" subtitle="Stress Parameters" />

                            <div className="space-y-1.5">
                                <LoadOption active={currentProfile === 'LIGHT'} profile="LIGHT" label="Nominal Flow" onClick={setCurrentProfile} />
                                <LoadOption active={currentProfile === 'MODERATE'} profile="MODERATE" label="Cluster Surge" onClick={setCurrentProfile} />
                                <LoadOption active={currentProfile === 'HEAVY'} profile="HEAVY" label="Deep Stress" onClick={setCurrentProfile} />
                                <LoadOption active={currentProfile === 'CRITICAL'} profile="CRITICAL" label="Peak Threshold" onClick={setCurrentProfile} />
                            </div>

                        </div>

                        <div className="glass-card rounded-xl flex flex-col overflow-hidden max-h-[350px]">
                            <div className="p-4 border-b border-slate-100/50">
                                <SectionHeader icon={AlertCircle} title="Detection Engine" subtitle="Heuristic Signature Analysis" />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {bottlenecks.length === 0 ? (
                                        <div className="h-32 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-lg">
                                            <ShieldCheck size={20} className="text-slate-300 mb-2" />
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Monitoring Active</p>
                                        </div>
                                    ) : (
                                        bottlenecks.map(b => (
                                            <motion.div
                                                key={b.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className={`p-4 rounded-lg border flex flex-col gap-2 transition-all ${b.severity === 'Critical' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${b.severity === 'Critical' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
                                                        }`}>
                                                        {b.severity}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{b.confidence}% MATCH</span>
                                                </div>

                                                <p className="text-xs font-bold text-slate-700 leading-tight">{b.cause}</p>

                                                <div className="pt-2 border-t border-slate-200/50">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Zap size={10} className="text-indigo-500" />
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Recommendation</span>
                                                    </div>
                                                    <p className="text-[10px] font-medium text-slate-500 leading-snug">{b.fix}</p>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Global Style Inject for Recharts Grid & Scrollbars */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .recharts-cartesian-grid-horizontal line { stroke: #f1f5f9; stroke-width: 1; stroke-dasharray: 0; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
                @keyframes pulse-soft {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(0.98); }
                }
                .glass-card {
                    background: rgba(255, 255, 255, 0.45);
                    backdrop-filter: blur(30px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.4);
                    box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05);
                }
                .glass-card-dark {
                    background: rgba(15, 23, 42, 0.9);
                    backdrop-filter: blur(30px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px -1px rgba(0, 0, 0, 0.3);
                }
                .grid-bg {
                    background-image: radial-gradient(rgba(15, 23, 42, 0.15) 1px, transparent 1px);
                    background-size: 32px 32px;
                }
            `}} />
        </div>
    );
};

export default PerformanceLab;
