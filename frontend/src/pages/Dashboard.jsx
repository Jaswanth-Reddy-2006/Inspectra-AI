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
    Loader2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import PageDrilldownPanel from '../components/PageDrilldownPanel';
import ApplicationStructureMap from '../components/ApplicationStructureMap';

// ─── Utility: AI Executive Summary ────────────────────────────────────────────

function generateExecutiveSummary(result) {
    if (!result) return '';

    const { overallScore, totalPagesScanned, issuesSummary, pages } = result;

    const totalIssues =
        (issuesSummary?.critical ?? 0) +
        (issuesSummary?.high ?? 0) +
        (issuesSummary?.medium ?? 0) +
        (issuesSummary?.low ?? 0);

    const healthLabel =
        overallScore >= 80 ? 'stabile' :
            overallScore >= 50 ? 'moderate' :
                'critical';

    const topRisks = issuesSummary?.topRiskAreas?.length
        ? issuesSummary.topRiskAreas.map(r => `${r.ruleId} (${r.count} matches)`).join(', ')
        : 'general defects';

    const worstPage = pages?.length
        ? [...pages].sort((a, b) => (a.score ?? 100) - (b.score ?? 100))[0]
        : null;

    const riskNote = issuesSummary?.critical > 0
        ? `Primary risk detected: ${topRisks}. Immediate remediation on "${worstPage?.url || 'affected pages'}" is recommended to restore accessibility compliance.`
        : `Overall quality is ${healthLabel}. Top areas for improvement include: ${topRisks}.`;

    return [
        `Inspectra AI analyzed ${totalPagesScanned ?? 0} pages and identified ${totalIssues} total issues.`,
        `The application demonstrates ${healthLabel} structural stability with an overall health score of ${overallScore}/100.`,
        riskNote,
        `Developer Insight: Focus on the ${issuesSummary?.critical + issuesSummary?.high} high-impact failures to see the fastest improvement in user experience.`
    ].join(' ');
}

// ─── Utility: Download JSON Report ────────────────────────────────────────────

function downloadReport(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inspectra-report.json';
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const scoreRingColor = (s) => {
    if (s >= 80) return '#22c55e';
    if (s >= 50) return '#f59e0b';
    return '#ef4444';
};

const scoreTextColor = (s) => {
    if (s >= 80) return 'text-emerald-600';
    if (s >= 50) return 'text-amber-500';
    return 'text-red-500';
};

const scoreBadgeColor = (s) => {
    if (s >= 80) return 'bg-emerald-50 text-emerald-700';
    if (s >= 50) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
};

// Improved severity palette: bg-*-100 for stronger visual hierarchy
const severityBadgeColor = (sev) => {
    switch ((sev || '').toLowerCase()) {
        case 'critical': return 'bg-red-100 text-red-600';
        case 'high': return 'bg-orange-100 text-orange-600';
        case 'medium': return 'bg-yellow-100 text-yellow-700';
        default: return 'bg-blue-100 text-blue-600';
    }
};

const severityDotColor = (sev) => {
    switch ((sev || '').toLowerCase()) {
        case 'critical': return '#ef4444';
        case 'high': return '#f97316';
        case 'medium': return '#eab308';
        default: return '#2563eb';
    }
};

const severityIcon = (sev) => {
    switch ((sev || '').toLowerCase()) {
        case 'critical': return AlertCircle;
        case 'high': return AlertTriangle;
        case 'medium': return AlertTriangle;
        default: return Info;
    }
};

// ─── Scan Limitations Banner ──────────────────────────────────────────────────

const ScanLimitationsBanner = ({ category, count }) => {
    if (!category) return null;

    const messages = {
        "Authentication Required": "This application requires authentication. some pages could not be analyzed fully.",
        "Bot Protection Detected": "This site appears to block automated scanning. Results may be incomplete.",
        "Rate Limited": "The server limited automated requests during the scan. Some pages were skipped.",
        "SSL Error": "SSL certificate issues were detected, which may have blocked secure analysis.",
        "Navigation Timeout": "High latency or timeouts were detected during the crawl.",
        "Connection Failed": "The scanner could not establish a stable connection to the server.",
        "Unknown Failure": "Some technical limitations were encountered during the scanning process."
    };

    const message = messages[category] || messages["Unknown Failure"];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="group relative bg-amber-50/80 border border-amber-100 rounded-2xl p-4 flex items-start gap-4 mb-6 backdrop-blur-sm"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 rounded-l-2xl" />
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 shadow-sm shadow-amber-200/50">
                <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
                <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
                    Scan Limitations Detected
                    <span className="text-[10px] font-bold bg-amber-200/50 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tight">
                        {count} page{count !== 1 ? 's' : ''} affected
                    </span>
                </h3>
                <p className="text-[12px] text-amber-700 font-bold mt-1 leading-relaxed opacity-90">
                    {message}
                </p>
            </div>
        </motion.div>
    );
};

// ─── Health Ring ──────────────────────────────────────────────────────────────

const HealthRing = ({ score }) => {
    const r = 46;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);
    const color = scoreRingColor(score);
    return (
        <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="fill-none stroke-current text-slate-100" strokeWidth="7" cx="50" cy="50" r={r} />
                <motion.circle
                    fill="none" strokeWidth="7" strokeLinecap="round"
                    cx="50" cy="50" r={r} stroke={color}
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black leading-none ${scoreTextColor(score)}`}>{score}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Score</span>
            </div>
        </div>
    );
};

// ─── Dynamic Donut Chart ──────────────────────────────────────────────────────

const DonutChart = ({ issuesSummary }) => {
    const segments = [
        { label: 'Critical', count: issuesSummary?.critical ?? 0, color: '#ef4444' },
        { label: 'High', count: issuesSummary?.high ?? 0, color: '#f97316' },
        { label: 'Medium', count: issuesSummary?.medium ?? 0, color: '#eab308' },
        { label: 'Low', count: issuesSummary?.low ?? 0, color: '#2563eb' },
    ].filter(s => s.count > 0);

    const total = segments.reduce((a, s) => a + s.count, 0);

    if (total === 0) {
        return (
            <div className="flex items-center justify-center h-28 text-emerald-500 gap-2">
                <CheckCircle2 size={20} />
                <span className="text-sm font-bold">No issues found</span>
            </div>
        );
    }

    const r = 38;
    const circ = 2 * Math.PI * r;
    let cumulative = 0;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" strokeWidth="16" stroke="#f1f5f9" />
                    {segments.map((seg, i) => {
                        const pct = seg.count / total;
                        const dash = circ * pct;
                        const gap = circ - dash;
                        const off = circ * (1 - cumulative);
                        cumulative += pct;
                        return (
                            <motion.circle
                                key={i} cx="50" cy="50" r="38"
                                fill="none" strokeWidth="16" stroke={seg.color}
                                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={off}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-900">{total}</span>
                    <span className="text-[9px] font-bold text-slate-400">Issues</span>
                </div>
            </div>
            <div className="space-y-2.5">
                {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-xs font-bold text-slate-500 w-14">{s.label}</span>
                        <span className="text-xs font-black text-slate-900">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Expandable Pages Table ───────────────────────────────────────────────────

const PagesTable = ({ pages, onRowClick }) => {
    const [expanded, setExpanded] = useState(null);

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
                <thead>
                    <tr className="border-b border-slate-50">
                        {['Page URL', 'Score', 'Load Time', 'Issues', ''].map((h, i) => (
                            <th key={i} className="px-5 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(pages || []).map((page, i) => (
                        <React.Fragment key={i}>
                            <motion.tr
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                transition={{ delay: 0.05 * i }}
                                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group cursor-pointer"
                                onClick={() => onRowClick && onRowClick(page)}
                            >
                                <td className="px-5 sm:px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                            <Globe size={13} className="text-blue-500" />
                                        </div>
                                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[220px] group-hover:text-blue-600 transition-colors">
                                            {page.url}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 sm:px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${scoreBadgeColor(page.score ?? 0)}`}>
                                        {page.score ?? '—'}/100
                                    </span>
                                </td>
                                <td className="px-5 sm:px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Clock size={12} />
                                        <span className="text-xs font-bold">
                                            {page.loadTime != null ? `${page.loadTime} ms` : '—'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 sm:px-6 py-4">
                                    <span className="text-sm font-black text-slate-800">{(page.issues || []).length}</span>
                                    <span className="text-slate-300 text-xs ml-1">issues</span>
                                </td>
                                <td className="px-5 sm:px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Details</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setExpanded(expanded === i ? null : i); }}
                                            className="text-slate-300 hover:text-blue-400 transition-colors"
                                        >
                                            {expanded === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>

                            <AnimatePresence>
                                {expanded === i && (
                                    <tr>
                                        <td colSpan={5} className="px-0 py-0">
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 py-4 bg-slate-50/60 space-y-2 border-b border-slate-100">
                                                    {(page.issues || []).length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic">No issues found on this page.</p>
                                                    ) : (
                                                        (page.issues || []).map((issue, j) => {
                                                            const Icon = severityIcon(issue.severity);
                                                            return (
                                                                <div key={j} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                                    <span className={`p-1.5 rounded-lg ${severityBadgeColor(issue.severity)}`}>
                                                                        <Icon size={13} />
                                                                    </span>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-black text-slate-800">{issue.type}</p>
                                                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{issue.description}</p>
                                                                    </div>
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${severityBadgeColor(issue.severity)}`}>
                                                                        {issue.severity}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
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
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = ({ result }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [selectedPage, setSelectedPage] = useState(null);

    // Empty state guard
    if (!result) {
        return (
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] gap-6 p-10 text-center"
            >
                <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <Activity size={36} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">No Scan Data Available</h2>
                    <p className="text-sm text-slate-400 max-w-xs">
                        Run a scan from the home page to begin seeing your web application's quality report.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={14} strokeWidth={3} />
                    Go to Home
                </button>
            </motion.div>
        );
    }

    // Derived values from the complete result
    const pagesToRender = result.pages || [];
    const currentPagesCount = pagesToRender.length;
    const currentTotalIssues = pagesToRender.reduce((acc, p) => acc + (p.issues?.length || 0), 0);
    const currentIssuesSummary = result.issuesSummary || { critical: 0, high: 0, medium: 0, low: 0 };
    const currentAvgLoadTime = currentPagesCount > 0
        ? Math.round(pagesToRender.reduce((acc, p) => acc + (p.loadTime ?? 0), 0) / currentPagesCount)
        : 0;
    const currentOverallScore = result.overallScore ?? 0;

    const allIssues = pagesToRender.flatMap(p =>
        (p.issues || []).map(iss => ({ ...iss, pageUrl: p.url }))
    );
    const top5Issues = [...allIssues]
        .sort((a, b) => (SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 99) - (SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 99))
        .slice(0, 5);

    const summary = generateExecutiveSummary(result);

    return (
        <div className="p-5 sm:p-8 space-y-6 bg-[#f8fafc] min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)]">

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">Quality Overview</h1>
                    <p className="text-slate-400 font-medium text-sm mt-0.5">
                        {currentPagesCount} page{currentPagesCount !== 1 ? 's' : ''} analyzed &middot; {currentTotalIssues} issues found
                        {result.scanDuration != null ? ` · ${result.scanDuration}s scan` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={() => {
                            downloadReport(result);
                            addToast('Quality report exported to JSON successfully.', 'success');
                        }}
                        className="flex items-center gap-2 border border-slate-200 text-slate-600 bg-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 active:scale-95"
                    >
                        <Download size={13} />
                        Download Report
                    </button>
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-2 bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={14} strokeWidth={3} />
                        New Scan
                    </button>
                </div>
            </div>

            {/* ── Scan Limitations ────────────────────────────────────────── */}
            <ScanLimitationsBanner
                category={result.meta?.failureCategory}
                count={result.meta?.failureCount}
            />

            {/* ── AI Executive Summary ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-100 border-l-4 border-l-blue-500 p-5 sm:p-6 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Sparkles size={15} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900">AI Executive Inspection Summary</h3>
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Generated by Inspectra AI</span>
                    </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{summary}</p>
            </motion.div>

            {/* ── Application Structure Map ─────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5">
                <ApplicationStructureMap result={result} />
            </div>

            {/* ── KPI Stat Cards ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">
                {/* Overall Score */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <HealthRing score={currentOverallScore} />
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Overall Health</p>
                        <p className="text-xs font-bold text-slate-500">
                            {currentOverallScore >= 80 ? '✅ Excellent' : currentOverallScore >= 50 ? '⚠️ Needs Work' : '🚨 Critical'}
                        </p>
                    </div>
                </motion.div>

                {/* Total Issues */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-50">
                        <AlertTriangle size={22} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Issues</p>
                        <p className="text-3xl font-black text-slate-900 leading-none">{currentTotalIssues}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-1">{currentIssuesSummary.critical} critical</p>
                    </div>
                </motion.div>

                {/* Pages Scanned */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50">
                        <Globe size={22} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pages Analyzed</p>
                        <p className="text-3xl font-black text-slate-900 leading-none">{currentPagesCount}</p>
                        <p className="text-[11px] font-bold text-slate-400 mt-1">Discovery complete</p>
                    </div>
                </motion.div>

                {/* Avg Load Time */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-violet-50">
                        <Zap size={22} className="text-violet-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Load Time</p>
                        <p className="text-3xl font-black text-slate-900 leading-none">
                            {currentAvgLoadTime}<span className="text-base font-bold text-slate-300 ml-1">ms</span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-1">per page</p>
                    </div>
                </motion.div>

                {/* Scan Duration */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50">
                        <Timer size={22} className="text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scan Session</p>
                        <p className="text-3xl font-black text-slate-900 leading-none">
                            {result.scanDuration ?? '—'}<span className="text-base font-bold text-slate-300 ml-1">{result.scanDuration != null ? 's' : ''}</span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-1">total time</p>
                    </div>
                </motion.div>
            </div>

            {/* ── Charts Row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Severity Donut */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Severity Breakdown</h3>
                    </div>
                    <DonutChart issuesSummary={currentIssuesSummary} />
                </motion.div>

                {/* Severity bar breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.41 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Issue Distribution</h3>
                        <span className="text-[10px] font-bold text-slate-400">{currentTotalIssues} total</span>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Critical', value: currentIssuesSummary.critical, barColor: 'bg-red-500', textColor: 'text-red-600', badge: 'bg-red-100 text-red-600' },
                            { label: 'High', value: currentIssuesSummary.high, barColor: 'bg-orange-500', textColor: 'text-orange-600', badge: 'bg-orange-100 text-orange-600' },
                            { label: 'Medium', value: currentIssuesSummary.medium, barColor: 'bg-yellow-400', textColor: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' },
                            { label: 'Low', value: currentIssuesSummary.low, barColor: 'bg-blue-500', textColor: 'text-blue-600', badge: 'bg-blue-100 text-blue-600' },
                        ].map((row, i) => {
                            const pct = currentTotalIssues > 0 ? Math.round((row.value / currentTotalIssues) * 100) : 0;
                            return (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[11px] font-black uppercase tracking-wider ${row.textColor}`}>{row.label}</span>
                                        <span className="text-xs font-black text-slate-700">
                                            {row.value} <span className="text-slate-300 font-medium">({pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${row.barColor}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* ── Pages Table ───────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Scanned Pages</h3>
                    <span className="text-[10px] font-bold text-slate-400">{pagesToRender.length} pages found</span>
                </div>
                {pagesToRender.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">No page data available.</div>
                ) : (
                    <PagesTable pages={pagesToRender} onRowClick={(page) => setSelectedPage(page)} />
                )}
            </motion.div>

            {/* ── Top 5 Issues ──────────────────────────────────────────────── */}
            {top5Issues.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-50">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Top Issues Found</h3>
                        <span className="text-[10px] font-bold text-slate-400">Sorted by severity</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {top5Issues.map((issue, i) => {
                            const Icon = severityIcon(issue.severity);
                            const badgeCls = severityBadgeColor(issue.severity);
                            const [bgCls, txtCls] = badgeCls.split(' ');
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.56 + i * 0.05 }}
                                    className="flex items-start justify-between px-5 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors group cursor-default"
                                >
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bgCls}`}>
                                            <Icon size={16} className={txtCls} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{issue.type}</p>
                                            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs mt-0.5">{issue.description}</p>
                                            <p className="text-[11px] text-slate-300 font-medium mt-0.5 truncate max-w-xs">{issue.pageUrl}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${badgeCls}`}>
                                            {issue.severity}
                                        </span>
                                        <ArrowUpRight size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ── Page Drilldown Panel ──────────────────────────────────────── */}
            {selectedPage && (
                <PageDrilldownPanel
                    page={selectedPage}
                    onClose={() => setSelectedPage(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
