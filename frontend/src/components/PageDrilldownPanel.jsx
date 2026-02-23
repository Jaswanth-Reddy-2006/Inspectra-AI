import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Globe,
    Clock,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Zap,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    ArrowUpRight,
    Copy,
    Activity,
    Shield,
    Terminal,
    Code
} from 'lucide-react';

// ─── Utility: Safe String Rendering ──────────────────────────────────────────
const safeString = (val, fallback = '—') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    try {
        return JSON.stringify(val);
    } catch (e) {
        return fallback;
    }
};

// ─── Page Intelligence Summary Generator ─────────────────────────────────────
function generatePageSummary(page) {
    if (!page) return '';

    const issueCount = page.issues?.length ?? 0;
    const sc = { critical: 0, high: 0, medium: 0, low: 0 };
    (page.issues || []).forEach(issue => {
        const s = (issue.severity || '').toLowerCase();
        if (s in sc) sc[s]++;
    });

    const score = page.score ?? 0;
    const stabilityLabel = score >= 80 ? 'Stable' : score >= 50 ? 'Needs Attention' : 'High Risk';

    const performanceNote = (page.loadTime ?? 0) > 3000
        ? 'Performance latency detected.'
        : 'Performance within parameters.';

    return `This page scored ${score}/100 (${stabilityLabel}). Identified ${issueCount} issues. ${performanceNote}`;
}

// ─── Remediation Recommendations ─────────────────────────────────────────────
function getRecommendations(page) {
    const sc = { critical: 0, high: 0, medium: 0, low: 0 };
    (page.issues || []).forEach(issue => {
        const s = (issue.severity || '').toLowerCase();
        if (s in sc) sc[s]++;
    });

    const recs = [];
    if (sc.critical > 0) {
        recs.push({
            icon: ShieldX, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100',
            title: 'Critical Failure Blockers',
            text: 'Immediate remediation required for blocking defects.'
        });
    }
    if (sc.high > 0) {
        recs.push({
            icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100',
            title: 'High Priority Repairs',
            text: 'Resolve standard violations to restore UX integrity.'
        });
    }
    if ((page.loadTime ?? 0) > 3000) {
        recs.push({
            icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100',
            title: 'Latency Optimization',
            text: 'Optimize resource loading to improve scores.'
        });
    }
    if (recs.length === 0) {
        recs.push({
            icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100',
            title: 'Clean Structural Health',
            text: 'No significant defects detected.'
        });
    }
    return recs;
}

const SEVERITY_GROUPS = ['Critical', 'High', 'Medium', 'Low'];
const severityConfig = {
    Critical: { badge: 'bg-rose-100 text-rose-600', dot: '#e11d48', icon: AlertCircle, headerBg: 'bg-rose-50/50', headerText: 'text-rose-700' },
    High: { badge: 'bg-orange-100 text-orange-600', dot: '#f97316', icon: AlertTriangle, headerBg: 'bg-orange-50/50', headerText: 'text-orange-700' },
    Medium: { badge: 'bg-amber-100 text-amber-700', dot: '#d97706', icon: AlertTriangle, headerBg: 'bg-amber-50/50', headerText: 'text-amber-700' },
    Low: { badge: 'bg-indigo-100 text-indigo-600', dot: '#4f46e5', icon: Info, headerBg: 'bg-indigo-50/50', headerText: 'text-indigo-700' },
};

const scoreBadgeColor = (s) => {
    if (s >= 80) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    if (s >= 50) return 'bg-amber-50 text-amber-600 border border-amber-100';
    return 'bg-rose-50 text-rose-600 border border-rose-100';
};

// ─── Issue Details Component ──────────────────────────────────────────────────
const IssueDetails = ({ issue }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const snippet = issue?.element?.htmlSnippet;
        if (snippet) {
            navigator.clipboard.writeText(String(snippet)).catch(() => { });
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!issue) return null;

    return (
        <div className="mt-3 p-5 bg-slate-900 rounded-2xl space-y-5 border border-slate-800 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                <Terminal size={60} className="text-white" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                        <ShieldAlert size={10} className="text-rose-400" />
                        Root Context
                    </p>
                    <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                        {safeString(issue.severityReason || 'Standard quality violation enforced by engine.')}
                    </p>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                        <Activity size={10} className="text-sky-400" />
                        Impact Analysis
                    </p>
                    <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                        {safeString(issue.impactExplanation || 'Potential degradation of user interaction or accessibility standards.')}
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Element Selector</p>
                <code className="block text-[11px] font-mono text-indigo-300 break-all bg-indigo-950/40 p-3 rounded-xl border border-indigo-900/30">
                    {safeString(issue.element?.selector, 'Global Document Event')}
                </code>
            </div>

            {issue.element?.htmlSnippet && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Source Snapshot</p>
                        <button onClick={handleCopy} className="text-[9px] font-black text-slate-400 hover:text-white uppercase flex items-center gap-1 transition-colors">
                            {copied ? 'Copied' : <><Copy size={10} /> Copy</>}
                        </button>
                    </div>
                    <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto p-4 bg-black/40 rounded-xl border border-emerald-900/30 max-h-40 scrollbar-thin">
                        {safeString(issue.element.htmlSnippet)}
                    </pre>
                </div>
            )}

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                    <Sparkles size={11} />
                    Intelligence Remediation
                </p>
                <p className="text-[14px] text-blue-100 leading-relaxed font-bold">
                    {safeString(issue.fixSuggestion, 'Consult system documentation for remediation steps.')}
                </p>
                {issue.codeExampleFix && (
                    <div className="mt-3 pt-3 border-t border-blue-500/10">
                        <p className="text-[9px] font-black text-blue-400/60 uppercase mb-2">Refactored Implementation</p>
                        <pre className="text-[11px] font-mono text-blue-300 p-3 bg-blue-950/40 rounded-lg">
                            {safeString(issue.codeExampleFix)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Issue Group Component ──────────────────────────────────────────────────
const IssueGroup = ({ label, issues }) => {
    const [open, setOpen] = useState(label === 'Critical' || label === 'High');
    const [expandedIssue, setExpandedIssue] = useState(null);
    const cfg = severityConfig[label] || severityConfig['Low'];
    const Icon = cfg.icon;

    if (!issues?.length) return null;

    return (
        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
            <button
                onClick={() => setOpen(!open)}
                className={`w-full flex items-center justify-between px-5 py-4 ${cfg.headerBg} hover:opacity-80 transition-all`}
            >
                <div className="flex items-center gap-3">
                    <Icon size={16} className={cfg.headerText} />
                    <span className={`text-xs font-black uppercase tracking-widest ${cfg.headerText}`}>{label}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${cfg.badge}`}>{issues.length}</span>
                </div>
                {open ? <ChevronUp size={16} className={cfg.headerText} /> : <ChevronDown size={16} className={cfg.headerText} />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white">
                        <div className="divide-y divide-slate-50">
                            {issues.map((issue, i) => {
                                const isSelected = expandedIssue === i;
                                return (
                                    <div key={i} className="flex flex-col">
                                        <div
                                            className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-50/50' : ''}`}
                                            onClick={() => setExpandedIssue(isSelected ? null : i)}
                                        >
                                            <div className="w-2 h-2 rounded-full mt-2 shrink-0 shadow-sm" style={{ background: cfg.dot }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-800 tracking-tight">{safeString(issue.type)}</p>
                                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-1">{safeString(issue.description)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${cfg.badge}`}>
                                                    {safeString(issue.severity)}
                                                </span>
                                                {isSelected ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-5 pb-5 overflow-hidden">
                                                    <IssueDetails issue={issue} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const PageDrilldownPanel = ({ page, onClose }) => {
    if (!page) return null;

    const score = page.score ?? 0;
    const recommendations = getRecommendations(page);
    const summary = generatePageSummary(page);

    const grouped = {};
    SEVERITY_GROUPS.forEach(s => { grouped[s] = []; });
    (page.issues || []).forEach(issue => {
        const sev = (issue.severity || 'low').toLowerCase();
        const label = sev.charAt(0).toUpperCase() + sev.slice(1);
        const key = SEVERITY_GROUPS.includes(label) ? label : 'Low';
        grouped[key].push(issue);
    });

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[100]"
                onClick={onClose}
            />

            <motion.div
                key="panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[560px] bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.05)] z-[101] flex flex-col border-l border-slate-100"
            >
                {/* Header */}
                <div className="px-8 py-7 border-b border-slate-50 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                            <Globe size={22} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Deep Asset Drilldown</h2>
                            <p className="text-sm font-black text-slate-800 truncate" title={page.url}>{page.url}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Score Stats Bar */}
                <div className="px-8 py-4 bg-[#fcfdff] border-b border-slate-100 flex items-center gap-4 overflow-x-auto scrollbar-none">
                    <div className={`px-4 py-2 rounded-2xl text-[11px] font-black ${scoreBadgeColor(score)} whitespace-nowrap`}>
                        GRADE: {score}/100
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{page.loadTime || '—'} MS</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                        <Zap size={12} className="text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{page.perf?.fcp || '—'} FCP</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm shrink-0">
                        <Terminal size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{(page.issues || []).length} LOGS</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-200">

                    {/* Transparency Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Shield size={16} className="text-slate-900" />
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Transparency Breakdown</h3>
                        </div>
                        <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6 space-y-3">
                            {[
                                { label: 'Base Quality Credit', val: 100, color: 'text-slate-400' },
                                { label: 'A11y & Structural Debt', val: -(page.scoreBreakdown?.critical + page.scoreBreakdown?.high + page.scoreBreakdown?.medium + page.scoreBreakdown?.low || 0), color: 'text-rose-600' },
                                { label: 'Performance Latency', val: -(page.scoreBreakdown?.performance || 0), color: 'text-amber-600' },
                                { label: 'System Hygiene Penalty', val: -(page.scoreBreakdown?.hygiene || 0), color: 'text-indigo-600' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-500">{item.label}</span>
                                    <span className={`font-black ${item.color}`}>{item.val > 0 ? `+${item.val}` : item.val}</span>
                                </div>
                            ))}
                            <div className="h-px bg-slate-200/50 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-800">Final Health Grade</span>
                                <span className="text-lg font-black text-slate-900">{score}<span className="text-xs text-slate-400">/100</span></span>
                            </div>
                        </div>
                    </div>

                    {/* AI Assessment */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles size={16} className="text-indigo-500" />
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Autonomous Assessment</h3>
                        </div>
                        <div className="bg-indigo-600 text-white rounded-[2rem] p-7 shadow-xl shadow-indigo-100 relative overflow-hidden">
                            <Activity className="absolute bottom-[-20px] right-[-20px] text-white/5" size={140} />
                            <p className="text-[13px] font-bold leading-relaxed relative z-10">{summary}</p>
                        </div>
                    </div>

                    {/* Issue Clusters */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Code size={16} className="text-slate-900" />
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Defect Clusters</h3>
                        </div>
                        <div className="space-y-3">
                            {SEVERITY_GROUPS.map(label => (
                                <IssueGroup key={label} label={label} issues={grouped[label] || []} />
                            ))}
                        </div>
                    </div>

                    {/* Strategic Priority */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Zap size={16} className="text-amber-500" />
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Strategic Priority</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {recommendations.map((rec, i) => (
                                <div key={i} className={`p-5 rounded-[1.5rem] border ${rec.bg} ${rec.border} flex items-start gap-4`}>
                                    <rec.icon size={18} className={rec.color} />
                                    <div>
                                        <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${rec.color}`}>{rec.title}</p>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">{rec.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-10" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PageDrilldownPanel;
