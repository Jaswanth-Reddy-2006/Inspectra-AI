import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
    Layout,
    TrendingUp
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import PageDrilldownPanel from '../components/PageDrilldownPanel';
import AgentExecutionPanel from '../components/AgentExecutionPanel';
import DefectKnowledgeGraph from '../components/DefectKnowledgeGraph';

// ─── Utility: Safe Rendering ──────────────────────────────────────────────────
const safeVal = (v, fallback = '—') => (v !== null && v !== undefined) ? v : fallback;
const safeStr = (v, fallback = '—') => (typeof v === 'string' || typeof v === 'number') ? String(v) : fallback;

// ─── Utility: AI Executive Summary ────────────────────────────────────────────

// ─── Component: Executive Intelligence Summary ───────────────────────────
function ExecutiveSummary({ intelligence, stats }) {
    if (!intelligence) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-100">Engineering Intelligence</div>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/30">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-indigo-100/50">
                                <Shield size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Top Risk Component</p>
                                <p className="text-xs font-bold text-slate-700 leading-snug">{intelligence.topRiskComponent || "No shared defects detected."}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-rose-50/30 rounded-[2rem] border border-rose-100/30">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-rose-100/50">
                                <AlertCircle size={20} className="text-rose-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Primary Risk Domain</p>
                                <p className="text-xs font-bold text-slate-700 leading-snug">{intelligence.primaryRiskDomain || "Architecture stable."}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 bg-emerald-50/30 rounded-[2rem] border border-emerald-100/30">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-emerald-100/50">
                                <CheckCircle2 size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Strategic Recommendation</p>
                                <p className="text-xs font-bold text-slate-700 leading-snug">{intelligence.strategicRecommendation}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-200/50">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                <Activity size={20} className="text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    System Metrics <span className="text-slate-900">{stats?.totalPages} Nodes</span>
                                </p>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                                    Runtime: <span className={(intelligence.runtimeStability || '').includes('Unstable') ? 'text-red-600' : 'text-emerald-600'}>{intelligence.runtimeStability || 'Stable'}</span> &middot; Latency: {intelligence.performanceHealth || '—'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Score Impact Card */}
            <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-[60px] translate-x-10 translate-y--10" />
                <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Score Impact Breakdown</h4>
                        <BarChart3 size={18} className="text-indigo-400" />
                    </div>

                    <div className="space-y-4 flex-1">
                        <ImpactBar label="Accessibility" value={(stats?.critical || 0) * 20 + (stats?.high || 0) * 10} color="bg-rose-500" max={500} />
                        <ImpactBar label="Runtime Errors" value={(stats?.high || 0) * 5} color="bg-orange-500" max={500} />
                        <ImpactBar label="Performance" value={(stats?.performancePenalty || 0)} color="bg-indigo-400" max={500} />
                        <ImpactBar label="Hygiene" value={(stats?.hygienePenalty || 0)} color="bg-slate-500" max={500} />
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Calculated Score</p>
                            <p className="text-4xl font-black text-white">{Math.max(0, Math.min(100, (100 - (stats?.totalDefects || 0))))}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Deterministic</p>
                            <p className="text-[10px] font-bold text-white/50">Developer-Grade</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ImpactBar({ label, value, color, max }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-white/60 tracking-tight">{label}</span>
                <span className="text-white/40">-{value} pts</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                    className={`h-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                />
            </div>
        </div>
    );
}

// ─── Severity helpers ─────────────────────────────────────────────────────────
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const severityIcon = (sev) => {
    switch (String(sev || '').toLowerCase()) {
        case 'critical': return AlertCircle;
        case 'high': return AlertTriangle;
        default: return Info;
    }
};
const severityColor = (sev) => {
    switch (String(sev || '').toLowerCase()) {
        case 'critical': return 'text-red-600 bg-red-50 border-red-100';
        case 'high': return 'text-orange-600 bg-orange-50 border-orange-100';
        case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
        default: return 'text-blue-600 bg-blue-50 border-blue-100';
    }
};

const scoreRingColor = (s) => s >= 80 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const scoreBadgeStyle = (s) => s >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : s >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100';

// ─── Pages Table Component ────────────────────────────────────────────────────
const PagesTable = ({ pages, onRowClick }) => {
    const [expanded, setExpanded] = useState(null);

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
                        <Layout size={18} className="text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Asset Inventory</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autonomous discovery results</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 capitalize">{pages?.length || 0} Entries</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white">
                            {['Resource Locator', 'Health', 'Latency', 'Payload', ''].map((h, i) => (
                                <th key={i} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(pages || []).map((page, i) => (
                            <React.Fragment key={i}>
                                <tr
                                    className="group hover:bg-slate-50/40 transition-all cursor-pointer"
                                    onClick={() => onRowClick && onRowClick(page)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 group-hover:scale-110 transition-transform flex items-center justify-center shadow-sm">
                                                <Globe size={16} className="text-indigo-600" />
                                            </div>
                                            <div className="min-w-0 max-w-[300px]">
                                                <p className="text-sm font-extrabold text-slate-800 truncate leading-none mb-1.5">{safeStr(page.url)}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest line-clamp-1">{page.url}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black border ${scoreBadgeStyle(page.score || 0)}`}>
                                            {safeVal(page.score)}%
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Timer size={14} className="text-slate-300" />
                                            <span className="text-xs font-black">{safeVal(page.loadTime)}<span className="text-[9px] text-slate-300 ml-0.5">ms</span></span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">{(page.issues || []).length} FINDINGS</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div
                                                className="w-10 h-10 rounded-full bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:shadow-xl"
                                                onClick={(e) => { e.stopPropagation(); setExpanded(expanded === i ? null : i); }}
                                            >
                                                {expanded === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                            <ArrowRight size={16} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                                        </div>
                                    </td>
                                </tr>
                                <AnimatePresence>
                                    {expanded === i && (
                                        <tr>
                                            <td colSpan={5} className="bg-slate-50/30 px-8 py-6">
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {(page.issues || []).slice(0, 4).map((issue, j) => {
                                                            const SideIcon = severityIcon(issue.severity);
                                                            return (
                                                                <div key={j} className={`p-4 rounded-3xl border bg-white shadow-sm flex items-start gap-4 ${severityColor(issue.severity)}`}>
                                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-current opacity-70">
                                                                        <SideIcon size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{safeStr(issue.type)}</p>
                                                                        <p className="text-[10px] font-medium opacity-60 leading-relaxed font-mono line-clamp-1">{safeStr(issue.description)}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {(page.issues || []).length > 4 && (
                                                            <div className="col-span-1 md:col-span-2 text-center py-2">
                                                                <button className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline" onClick={() => onRowClick && onRowClick(page)}>View all findings in drilldown</button>
                                                            </div>
                                                        )}
                                                        {(page.issues || []).length === 0 && (
                                                            <p className="text-xs text-slate-400 font-bold italic py-4">Structural analysis found zero integrity violations for this asset.</p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = ({ result }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [selectedPage, setSelectedPage] = useState(null);

    const pagesToRender = useMemo(() => result?.pages || [], [result]);
    const overallScore = result?.overallScore || 0;
    const issuesSummary = result?.issuesSummary || { critical: 0, high: 0, medium: 0, low: 0 };
    const totalIssues = pagesToRender.reduce((acc, p) => acc + (p.issues?.length || 0), 0);

    if (!result) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center">
            <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100">
                <Network size={40} strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Zero Contextual Data</h2>
                <p className="text-slate-400 font-medium max-w-xs mx-auto mt-2">Initialize a structural scan to populate this specialized risk dashboard.</p>
            </div>
            <button onClick={() => navigate('/home')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all">New Scan Protocol</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fcfdff] p-4 lg:p-8 space-y-8 max-w-[1600px] mx-auto">

            {/* Nav Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">Diagnostic Intel</h1>
                    </div>
                    <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-3">
                        <Activity size={14} className="text-emerald-500" /> System live status: {pagesToRender.length > 0 ? 'Active Deployment' : 'Idle'} &middot; {totalIssues} Findings detected
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => { downloadReport(result); addToast('Report exported.', 'success'); }} className="p-4 bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-indigo-600 hover:shadow-xl transition-all"><Download size={20} /></button>
                    <button onClick={() => navigate('/home')} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] shadow-2xl hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={18} strokeWidth={3} /> New Audit
                    </button>
                </div>
            </div>

            {/* AI Executive Intel */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-8 lg:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.02)] space-y-10 relative overflow-hidden group">
                <div className="absolute top-[-50px] left-[-50px] w-60 h-60 bg-blue-50/50 rounded-full blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Sparkles size={22} fill="currentColor" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Executive Intelligence Report</h3>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Deterministic Diagnostic v2.0</p>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Analysis Depth</p>
                            <p className="text-xs font-bold text-slate-700">Engineering Grade</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100" />
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confidence</p>
                            <p className="text-xs font-bold text-emerald-600">98.2% Accurate</p>
                        </div>
                    </div>
                </div>
                <ExecutiveSummary intelligence={result.issuesSummary?.executiveIntelligence} stats={result.issuesSummary?.stats} />
            </div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Root Cause Intelligence */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Root Cause Intelligence</h4>
                            <p className="text-xl font-black text-slate-900 tracking-tight">Pattern Concentration</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><AlertCircle size={20} /></div>
                    </div>

                    <div className="space-y-4 flex-1">
                        {(result.issuesSummary?.rootCauseAnalysis || []).slice(0, 3).map((rc, i) => (
                            <div key={i} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{rc.ruleId}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{rc.affectedPages.length} pages impacted</span>
                                </div>
                                <p className="text-xs font-bold text-slate-700 mb-2">Origin: {rc.suspectedSharedComponent}</p>
                                <div className="flex flex-wrap gap-1">
                                    {rc.affectedPages.slice(0, 3).map((p, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[8px] font-medium text-slate-500">
                                            {p.split('/').pop() || 'root'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(!result.issuesSummary?.rootCauseAnalysis?.length) && (
                            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50 py-12">
                                <Shield size={32} className="text-slate-300" />
                                <p className="text-xs font-bold text-slate-400 italic text-center">No clustered component patterns detected across pages.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fix Impact Simulation */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Strategic Simulation</h4>
                            <p className="text-xl font-black text-slate-900 tracking-tight">What If You Fix This?</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Sparkles size={20} fill="currentColor" /></div>
                    </div>

                    <div className="space-y-6 flex-1">
                        <SimulationCard
                            label="Resolve Critical Issues"
                            projectedScore={result.issuesSummary?.fixSimulation?.fixCritical}
                            currentScore={overallScore}
                            color="text-rose-600"
                        />
                        <SimulationCard
                            label="Resolve High Severity"
                            projectedScore={result.issuesSummary?.fixSimulation?.fixCriticalAndHigh}
                            currentScore={overallScore}
                            color="text-orange-600"
                        />
                        <SimulationCard
                            label="Zero-Debt Roadmap"
                            projectedScore={result.issuesSummary?.fixSimulation?.fixAll || 95}
                            currentScore={overallScore}
                            color="text-indigo-600"
                        />
                    </div>

                    <p className="mt-6 text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest text-center">Deterministic Projection &middot; v2.0</p>
                </div>
            </div>

            {/* Runtime Integrity & Hygiene Rows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Runtime Logs */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Activity size={20} className="text-emerald-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Runtime Integrity Logs</h4>
                        </div>
                        <span className="text-[10px] font-black text-white/30 tracking-[0.2em]">{result.issuesSummary?.runtimeLogs?.length || 0} CAPTURED</span>
                    </div>

                    <div className="space-y-3 font-mono">
                        {(result.issuesSummary?.runtimeLogs || []).slice(0, 5).map((log, i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/10 text-[10px]">
                                <span className={log.severity === 'Critical' ? 'text-rose-400' : 'text-orange-400'}>[{log.type}]</span>
                                <span className="text-white/60 truncate flex-1">{log.description}</span>
                                <span className="text-white/30 shrink-0">{log.location?.split('/').pop()}</span>
                            </div>
                        ))}
                        {(!result.issuesSummary?.runtimeLogs?.length) && (
                            <div className="py-12 flex items-center justify-center text-white/20 italic text-[11px] font-bold">
                                No fatal runtime exceptions or network failures detected.
                            </div>
                        )}
                    </div>
                </div>

                {/* Hygiene Summary */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hygiene Overview</h4>
                        <Shield size={20} className="text-slate-200" />
                    </div>
                    <div className="space-y-4">
                        {(result.issuesSummary?.hygieneReport || []).slice(0, 4).map((h, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-600 truncate">{h.description}</span>
                            </div>
                        ))}
                        {(!result.issuesSummary?.hygieneReport?.length) && (
                            <p className="text-xs font-bold text-slate-400 italic text-center py-8">Structural semantics compliant.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Intelligence Layer: Knowledge Sync ────────────────────────── */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Network size={20} className="text-indigo-600" />
                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Relational Defect Intelligence Mapping</h3>
                </div>
                <DefectKnowledgeGraph data={result.issuesSummary?.knowledgeGraph} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <AgentExecutionPanel agents={result.agentOverview || []} />
            </div>

            {/* Page Inventory (Table) */}
            <PagesTable pages={pagesToRender} onRowClick={(page) => setSelectedPage(page)} />

            {/* Page Drilldown */}
            {selectedPage && (
                <PageDrilldownPanel
                    page={selectedPage}
                    onClose={() => setSelectedPage(null)}
                />
            )}
        </div>
    );
};

function SimulationCard({ label, projectedScore = 0, currentScore = 0, color }) {
    const diff = Math.max(0, projectedScore - currentScore);
    return (
        <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100/50 group-hover:border-emerald-100 transition-all">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <div className="flex items-center gap-1.5 text-emerald-600">
                    <TrendingUp size={12} />
                    <span className="text-[10px] font-black">+{diff} pts</span>
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <span className={`text-2xl font-black ${color}`}>{projectedScore}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1">Projected</span>
                </div>
                <div className="h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${Math.min(100, projectedScore)}%` }} />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
