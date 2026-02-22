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
} from 'lucide-react';

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
    const stabilityLabel =
        score >= 80 ? 'Stable' :
            score >= 50 ? 'Needs Attention' :
                'High Risk';

    const performanceNote =
        (page.loadTime ?? 0) > 4000
            ? 'Page exhibits slow loading performance which may impact user experience and SEO rankings.'
            : 'Page load performance appears within acceptable thresholds.';

    const criticalNote =
        sc.critical > 0
            ? `${sc.critical} critical issue${sc.critical > 1 ? 's' : ''} require immediate remediation.`
            : 'No critical issues detected on this page.';

    return [
        `This page scored ${score}/100, indicating a ${stabilityLabel} state.`,
        `Inspectra AI identified ${issueCount} issue${issueCount !== 1 ? 's' : ''}: ${sc.critical} critical, ${sc.high} high, ${sc.medium} medium, and ${sc.low} low severity.`,
        performanceNote,
        criticalNote,
    ].join(' ');
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
            icon: ShieldX,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-100',
            title: 'Immediate Action Required',
            text: 'Investigate JavaScript runtime failures and critical accessibility violations. These issues may be blocking users entirely.',
        });
    }
    if (sc.high > 0) {
        recs.push({
            icon: ShieldAlert,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            title: 'High-Severity Defects Detected',
            text: 'Prioritize these findings to prevent user disruption. High-severity issues often stem from console errors or broken network requests.',
        });
    }
    if ((page.loadTime ?? 0) > 4000) {
        recs.push({
            icon: Zap,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            title: 'Performance Optimization Needed',
            text: 'Reduce blocking scripts, defer non-critical JavaScript, compress heavy assets, and consider a CDN for static resources.',
        });
    }
    if (sc.medium > 0) {
        recs.push({
            icon: AlertTriangle,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            border: 'border-yellow-100',
            title: 'Medium-Severity Issues Present',
            text: 'Address these in your next sprint. Often include missing ARIA labels, slow resource loads, or moderate accessibility gaps.',
        });
    }
    if (recs.length === 0) {
        recs.push({
            icon: ShieldCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            title: 'Page is Structurally Stable',
            text: 'No defects detected on this page. Continue monitoring on subsequent scans to maintain this quality standard.',
        });
    }
    return recs;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEVERITY_GROUPS = ['Critical', 'High', 'Medium', 'Low'];

const severityConfig = {
    Critical: { badge: 'bg-red-100 text-red-600', dot: '#ef4444', icon: AlertCircle, headerBg: 'bg-red-50', headerText: 'text-red-700' },
    High: { badge: 'bg-orange-100 text-orange-600', dot: '#f97316', icon: AlertTriangle, headerBg: 'bg-orange-50', headerText: 'text-orange-700' },
    Medium: { badge: 'bg-yellow-100 text-yellow-700', dot: '#eab308', icon: AlertTriangle, headerBg: 'bg-yellow-50', headerText: 'text-yellow-700' },
    Low: { badge: 'bg-blue-100 text-blue-600', dot: '#2563eb', icon: Info, headerBg: 'bg-blue-50', headerText: 'text-blue-700' },
};

const scoreBadgeColor = (s) => {
    if (s >= 80) return 'bg-emerald-100 text-emerald-700';
    if (s >= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-600';
};

const stabilityConfig = (s) => {
    if (s >= 80) return { label: 'Stable', cls: 'bg-emerald-100 text-emerald-700', icon: ShieldCheck };
    if (s >= 50) return { label: 'Needs Attention', cls: 'bg-amber-100 text-amber-700', icon: ShieldAlert };
    return { label: 'High Risk', cls: 'bg-red-100 text-red-600', icon: ShieldX };
};

// ─── Collapsible Issue Group ──────────────────────────────────────────────────

const IssueDetails = ({ issue }) => {
    return (
        <div className="mt-2.5 p-3.5 bg-slate-900 rounded-xl space-y-4 border border-slate-800">
            {/* Selector */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={10} className="text-blue-400" />
                    Target Selector
                </p>
                <code className="block text-[11px] font-mono text-blue-300 break-all bg-blue-950/30 p-2 rounded border border-blue-900/30">
                    {issue.element?.selector || 'N/A'}
                </code>
            </div>

            {/* HTML Snippet */}
            <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={10} className="text-amber-400" />
                    HTML Snippet
                </p>
                <div className="relative group">
                    <pre className="text-[11px] font-mono text-emerald-400 overflow-x-auto p-2 bg-emerald-950/20 rounded border border-emerald-900/20 max-h-32">
                        {issue.element?.html || 'Snippet not available'}
                    </pre>
                </div>
            </div>

            {/* Fix Suggestion */}
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={10} />
                    Suggested Fix
                </p>
                <p className="text-[12px] text-blue-100 leading-relaxed font-medium">
                    {issue.fixSuggestion}
                </p>
            </div>

            {/* Help URL */}
            {issue.helpUrl && (
                <a
                    href={issue.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
                >
                    Learn more in Documentation
                    <Globe size={10} />
                </a>
            )}
        </div>
    );
};

const IssueGroup = ({ label, issues }) => {
    const [open, setOpen] = useState(label === 'Critical' || label === 'High');
    const [expandedIssue, setExpandedIssue] = useState(null);
    const cfg = severityConfig[label];
    const Icon = cfg.icon;

    if (issues.length === 0) return null;

    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <button
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center justify-between px-4 py-3 ${cfg.headerBg} hover:opacity-90 transition-opacity`}
            >
                <div className="flex items-center gap-2.5">
                    <Icon size={14} className={cfg.headerText} />
                    <span className={`text-xs font-black uppercase tracking-wider ${cfg.headerText}`}>{label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${cfg.badge}`}>{issues.length}</span>
                </div>
                {open ? <ChevronUp size={14} className={cfg.headerText} /> : <ChevronDown size={14} className={cfg.headerText} />}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="divide-y divide-slate-50">
                            {issues.map((issue, i) => {
                                const isSelected = expandedIssue === i;
                                return (
                                    <div key={i} className="flex flex-col bg-white">
                                        <div
                                            className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-slate-50/80 shadow-inner' : ''}`}
                                            onClick={() => setExpandedIssue(isSelected ? null : i)}
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: cfg.dot }} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-800">{issue.type}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed truncate">{issue.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${cfg.badge}`}>
                                                    {issue.severity}
                                                </span>
                                                {isSelected ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="px-4 pb-4 overflow-hidden"
                                                >
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

// ─── Main Panel ───────────────────────────────────────────────────────────────

const PageDrilldownPanel = ({ page, onClose }) => {
    if (!page) return null;

    const score = page.score ?? 0;
    const stability = stabilityConfig(score);
    const StabilityIcon = stability.icon;
    const summary = generatePageSummary(page);
    const recommendations = getRecommendations(page);

    // Group issues by severity
    const grouped = {};
    SEVERITY_GROUPS.forEach(s => { grouped[s] = []; });
    (page.issues || []).forEach(issue => {
        const label = issue.severity
            ? issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1).toLowerCase()
            : 'Low';
        const key = SEVERITY_GROUPS.includes(label) ? label : 'Low';
        grouped[key].push(issue);
    });

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                key="panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col"
            >
                {/* ── Panel Header ────────────────────────────────────────── */}
                <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                            <Globe size={16} className="text-blue-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Page Inspection</p>
                            <p className="text-sm font-black text-slate-900 break-all leading-snug">{page.url}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 ml-3 transition-colors"
                    >
                        <X size={15} className="text-slate-500" />
                    </button>
                </div>

                {/* ── Meta Badges ─────────────────────────────────────────── */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-50 bg-slate-50/50 shrink-0 flex-wrap">
                    {/* Score */}
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-black ${scoreBadgeColor(score)}`}>
                        Score: {score}/100
                    </span>
                    {/* Load Time */}
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-600">
                        <Clock size={11} />
                        {page.loadTime != null ? `${page.loadTime} ms` : '—'}
                    </span>
                    {/* Stability */}
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black ${stability.cls}`}>
                        <StabilityIcon size={11} />
                        {stability.label}
                    </span>
                    {/* Issue count */}
                    <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-600">
                        {(page.issues || []).length} issues
                    </span>
                </div>

                {/* ── Scrollable Content ───────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* Section 1: AI Summary */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Sparkles size={13} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">AI Page Inspection Summary</h4>
                                <span className="text-[10px] font-bold text-blue-400">Generated by Inspectra AI</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{summary}</p>
                        </div>
                    </div>

                    {/* Section 2: Issue Breakdown */}
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">Issue Breakdown</h4>
                        {(page.issues || []).length === 0 ? (
                            <div className="flex items-center gap-3 px-4 py-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                <p className="text-sm font-bold text-emerald-700">No issues found on this page.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {SEVERITY_GROUPS.map(label => (
                                    <IssueGroup key={label} label={label} issues={grouped[label] || []} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Recommended Actions */}
                    <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">Recommended Actions</h4>
                        <div className="space-y-2.5">
                            {recommendations.map((rec, i) => {
                                const RecIcon = rec.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i + 0.1 }}
                                        className={`flex items-start gap-3 p-4 rounded-xl border ${rec.bg} ${rec.border}`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            <RecIcon size={16} className={rec.color} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black mb-1 ${rec.color}`}>{rec.title}</p>
                                            <p className="text-xs text-slate-600 leading-relaxed">{rec.text}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom padding */}
                    <div className="h-4" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PageDrilldownPanel;
