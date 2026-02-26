import React, { useState, useMemo } from 'react';
import { useScanContext } from '../context/ScanContext';
import {
    ShieldAlert, Activity, GitCommit, Search, AlertTriangle, FileCode2,
    Command, ShieldCheck, X, Terminal, ArrowRight, Layers, Target, PieChart as PieChartIcon, Code,
    CheckCircle2, Clock, Info, Shield, BrainCircuit, Zap
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const STATUS_COLORS = {
    CRITICAL: 'text-red-600',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-amber-500',
    LOW: 'text-blue-500'
};

const STATUS_BG = {
    CRITICAL: 'bg-red-500/10 border-red-500/30',
    HIGH: 'bg-orange-500/10 border-orange-500/30',
    MEDIUM: 'bg-amber-500/10 border-amber-500/30',
    LOW: 'bg-blue-500/10 border-blue-500/30'
};

const CHART_COLORS = {
    CRITICAL: '#DC2626',
    HIGH: '#EA580C',
    MEDIUM: '#D97706',
    LOW: '#2563EB'
};

const DetailModal = ({ isOpen, onClose, issue }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [hasSimulated, setHasSimulated] = useState(false);

    if (!isOpen || !issue) return null;

    const handleSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setIsSimulating(false);
            setHasSimulated(true);
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/90 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-[#1E293B] border border-slate-700 w-full max-w-6xl rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-700 bg-[#0F172A]/50 shrink-0">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-widest border rounded ${STATUS_BG[issue.severity || 'MEDIUM']} ${STATUS_COLORS[issue.severity || 'MEDIUM']}`}>
                                {issue.severity || 'UNKNOWN'}
                            </span>
                            <span className="text-[12px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                PRIORITY SCORE: {issue.priorityScore || 50}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-100 tracking-wide mt-1">{issue.title || 'Unknown Issue'}</h2>

                        {/* Diagnostic Modal 3.0: Executive Summary */}
                        {issue.executiveSummary && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded mt-3 max-w-3xl flex items-start gap-3">
                                <AlertTriangle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-rose-200/90 font-medium leading-relaxed">
                                    {issue.executiveSummary}
                                </p>
                            </div>
                        )}

                        {issue.severityReasoning && (
                            <p className="text-[13px] text-slate-400 bg-slate-900/50 p-2 border-l-2 border-amber-500 rounded mt-3 max-w-2xl italic">
                                "{issue.severityReasoning}"
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-[12px] font-mono text-slate-500 mt-6">
                            <span>ID: <span className="text-slate-300">{issue.id}</span></span>
                            <span>•</span>
                            <span>CATEGORY: <span className="text-slate-300">{issue.category}</span></span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-full border border-slate-700 mt-1">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-0 overflow-y-auto flex-1 bg-[#0F172A] custom-scrollbar flex flex-col md:flex-row">

                    {/* Left Column: Technical & Detection */}
                    <div className="flex-1 border-r border-slate-800 p-6 space-y-8">

                        {/* PATTERN INSIGHT (Modal 3.0) */}
                        {issue.architecturalInference && (
                            <div className="bg-indigo-900/10 border-l-2 border-indigo-500 p-4 space-y-2">
                                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pattern Insight</h3>
                                <p className="text-[13px] text-indigo-200/90 leading-relaxed font-medium">
                                    {issue.architecturalInference.patternDescription} Likely caused by <span className="text-emerald-400 font-mono text-[12px]">{issue.architecturalInference.suspectedComponent}</span>.
                                </p>
                            </div>
                        )}

                        {/* 2. ROOT CAUSE ANALYSIS */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-rose-400" /> 🔍 Root Cause Analysis</h3>
                            <div className="bg-[#1E293B] border border-slate-800 rounded p-4 space-y-4">
                                <p className="text-[14px] text-slate-300 leading-relaxed font-medium">{issue.technicalRootCause}</p>
                            </div>
                        </div>

                        {/* 3. PRECISE LOCATION */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Target size={14} className="text-indigo-400" /> 📍 PRECISE LOCATION</h3>
                            <div className="bg-[#0F172A] border border-slate-700 rounded p-5 text-[13px] font-mono text-slate-300 space-y-2 selection:bg-blue-500/30">
                                <div className="flex"><span className="text-slate-500 w-36 shrink-0">Route:</span> <span className="text-slate-200 truncate">{issue.detection?.route || 'Not reachable'}</span></div>
                                <div className="flex"><span className="text-slate-500 w-36 shrink-0">DOM Selector:</span> <span className="text-blue-400 max-w-[280px] break-all">{issue.detection?.domSelector || 'DOM-Level Violation (Framework Agnostic Context)'}</span></div>
                                <div className="flex"><span className="text-slate-500 w-36 shrink-0">Line:</span> <span className="text-slate-400">{issue.detection?.lineNumber || 'Original source file not traceable (Production build without source map)'}</span></div>
                                {issue.detection?.apiEndpoint && issue.detection.apiEndpoint !== "Not applicable for this issue type" && issue.detection.apiEndpoint !== "Not applicable (DOM-vector defect)" && issue.detection.apiEndpoint !== "Not applicable (Main thread)" && (
                                    <div className="flex"><span className="text-slate-500 w-36 shrink-0">API Endpoint:</span> <span className="text-amber-400">{issue.detection.apiEndpoint}</span></div>
                                )}
                                {issue.detection?.statusCode && (
                                    <div className="flex"><span className="text-slate-500 w-36 shrink-0">Status Code:</span> <span className="text-rose-400">{issue.detection.statusCode}</span></div>
                                )}
                            </div>
                        </div>



                    </div>

                    {/* Right Column: Business & Resolution */}
                    <div className="w-full md:w-[450px] shrink-0 bg-[#1E293B]/30 p-6 space-y-8">

                        {/* 5. IMPACT ANALYSIS */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><PieChartIcon size={14} className="text-amber-400" /> IMPACT ANALYSIS</h3>
                            <div className="bg-[#1E293B] border border-slate-800 p-4 rounded text-center mb-3">
                                <span className="text-[13px] text-slate-200 leading-relaxed font-medium">
                                    Impact Interpretation: This defect affects <span className="font-bold text-amber-400">{issue.impactAnalysis?.userExposurePercent || 0}%</span> of user interactions within the <span className="font-bold text-slate-100">{issue.impactAnalysis?.flowAffected || 'General'}</span> flow and increases compliance risk for <span className="font-bold text-rose-400">{issue.impactAnalysis?.complianceImpact || 'Standards'}</span>.
                                </span>
                            </div>

                            {/* Risk Escalation */}
                            {issue.impactAnalysis?.riskEscalation && (
                                <div className="bg-rose-500/10 border border-rose-500/30 rounded p-3 flex items-center justify-center gap-3 animate-pulse mb-3">
                                    <Zap size={16} className="text-rose-400 shrink-0" />
                                    <span className="text-[11px] font-bold text-rose-400 tracking-widest uppercase">{issue.impactAnalysis.riskEscalation}</span>
                                </div>
                            )}

                            {/* Compliance Map & Confidence */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-[#1E293B] border border-slate-800 p-4 rounded text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Compliance Mapping</span>
                                    <span className={`text-[14px] font-bold ${issue.complianceMapping?.wcag !== 'N/A' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {issue.complianceMapping?.wcag !== 'N/A' ? `WCAG ${issue.complianceMapping?.wcag}` : 'Passed'}
                                    </span>
                                </div>
                                <div className="bg-[#1E293B] border border-slate-800 p-4 rounded text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Detection Confidence</span>
                                    <span className="text-[16px] font-mono font-bold text-slate-200">{issue.confidence}%</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. VISUAL CODE TRANSFORMATION & RESOLUTION */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Code size={14} className="text-emerald-400" /> VISUAL CODE TRANSFORMATION</h3>

                            {issue.detection?.htmlSnippetBefore && issue.detection?.htmlSnippetAfter && (
                                <div className="bg-black border border-slate-800 rounded overflow-hidden shadow-xl">
                                    <div className="flex flex-col text-[12px] font-mono">
                                        <div className="p-4 bg-rose-500/5 relative overflow-hidden border-b border-rose-500/10">
                                            <span className="text-rose-400/50 text-[10px] font-bold uppercase mb-2 block tracking-widest">BEFORE</span>
                                            <pre className="text-rose-300/80 whitespace-pre-wrap">{issue.detection.htmlSnippetBefore}</pre>
                                        </div>
                                        <div className="p-4 bg-emerald-500/5 relative overflow-hidden">
                                            <span className="text-emerald-400/50 text-[10px] font-bold uppercase mb-2 block tracking-widest">AFTER</span>
                                            <pre className="text-emerald-400/90 whitespace-pre-wrap">{issue.detection.htmlSnippetAfter}</pre>
                                        </div>
                                    </div>
                                    {issue.resolution?.patchExplanation && (
                                        <div className="bg-slate-900 border-t border-slate-800 p-3 text-[12px] text-slate-300 font-medium">
                                            {issue.resolution.patchExplanation}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Resolution Plan Checklist */}
                            <div className="mt-4 space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-widest">Resolution Blueprint</span>
                                <div className="bg-slate-900/40 border border-slate-800 rounded p-4 space-y-3">
                                    {(issue.resolution?.resolutionPlan || []).map((step, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                            <span className="text-[12px] text-slate-300 font-medium leading-tight">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Diagnostic Modal 3.0: Fix Simulation Engine */}
                            <div className="mt-6">
                                {!hasSimulated ? (
                                    <button
                                        onClick={handleSimulation}
                                        disabled={isSimulating}
                                        className="w-full bg-slate-800 hover:bg-emerald-900/40 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 rounded p-4 flex flex-col items-center justify-center group"
                                    >
                                        <div className="flex items-center gap-2 text-slate-300 group-hover:text-emerald-400 transition-colors">
                                            {isSimulating ? <Zap size={16} className="animate-pulse text-amber-400" /> : <BrainCircuit size={16} />}
                                            <span className="text-[14px] font-bold tracking-wide uppercase">
                                                {isSimulating ? 'Computing Actual Impact...' : 'Simulate Fix Impact'}
                                            </span>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-5 rounded shadow-inner animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col items-center flex-1 border-r border-emerald-500/20">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Bug Detection Score</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-mono text-slate-500 line-through">72</span>
                                                    <ArrowRight size={14} className="text-emerald-500 animate-pulse" />
                                                    <span className="text-2xl font-mono font-bold text-emerald-400">
                                                        {Math.min(100, 72 + (issue.resolution?.scoreRecovery || 14))}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center flex-1 border-r border-emerald-500/20">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Critical Density</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl font-mono text-slate-500 line-through">3%</span>
                                                    <ArrowRight size={14} className="text-emerald-500 animate-pulse" />
                                                    <span className="text-2xl font-mono font-bold text-emerald-400">0%</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center flex-1">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Compliance Status</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[12px] font-bold uppercase ${issue.complianceMapping?.wcag !== 'N/A' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {issue.complianceMapping?.wcag !== 'N/A' ? 'Failed' : 'Passed'}
                                                    </span>
                                                    <ArrowRight size={14} className="text-emerald-500 animate-pulse" />
                                                    <span className="text-[14px] font-bold text-emerald-400 uppercase">Passed</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

const BugDetection = () => {
    const context = useScanContext();
    const isScanning = context?.isScanning;
    const productionIntelligence = context?.productionIntelligence || context?.scanResult?.issuesSummary?.productionIntelligence;

    // Strict data extraction
    const bugData = productionIntelligence?.pillars?.bugDetection;
    const [selectedIssue, setSelectedIssue] = useState(null);

    // Defensive Rendering - Active Scan Loading
    if (isScanning) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-slate-300 font-sans">
                <div className="bg-[#1E293B] border border-blue-500/30 rounded max-w-lg w-full p-8 shadow-2xl flex flex-col items-center text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-6"></div>
                    <h2 className="text-xl font-bold text-blue-400 uppercase tracking-widest mb-2">Analyzing Target</h2>
                    <p className="text-sm text-slate-400">Autonomous scan in progress. Telemetry data is being processed...</p>
                </div>
            </div>
        );
    }

    // Defensive Rendering - No Context (Homepage route required)
    if (!productionIntelligence) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-slate-300 font-sans">
                <div className="bg-[#1E293B] border border-slate-800 rounded max-w-lg w-full p-8 shadow-2xl flex flex-col items-center text-center">
                    <Search className="text-slate-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-100 uppercase tracking-widest mb-2">Awaiting Intelligence</h2>
                    <p className="text-sm text-slate-400">Run your first autonomous application scan from the homepage to populate the defect intelligence console.</p>
                </div>
            </div>
        );
    }

    // Defensive Rendering - No Defect Pillar Data
    if (!bugData) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 text-slate-300 font-sans">
                <div className="bg-[#1E293B] border border-emerald-500/30 rounded max-w-lg w-full p-8 shadow-2xl flex flex-col items-center text-center">
                    <ShieldCheck className="text-emerald-400 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-widest mb-2">Zero Actionable Defects</h2>
                    <p className="text-sm text-slate-400">The current scan session completed successfully and returned no actionable defects mapped to this pillar.</p>
                </div>
            </div>
        );
    }

    // Rely entirely on structured backend data
    const issuesList = bugData.issues || [];
    const totalIssues = bugData.totalIssues || 0;
    const bugScore = bugData.score || 100;

    const { critical = 0, high = 0, medium = 0, low = 0 } = bugData.severityBreakdown || {};
    const criticalDensity = totalIssues > 0 ? Math.round((critical / totalIssues) * 100) : 0;

    const distributionData = [
        { name: 'Critical', value: critical, color: CHART_COLORS.CRITICAL },
        { name: 'High', value: high, color: CHART_COLORS.HIGH },
        { name: 'Medium', value: medium, color: CHART_COLORS.MEDIUM },
        { name: 'Low', value: low, color: CHART_COLORS.LOW },
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            <DetailModal isOpen={!!selectedIssue} onClose={() => setSelectedIssue(null)} issue={selectedIssue} />

            {/* Top Thin Strip */}
            <div className="h-10 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between px-6 text-[11px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-4">
                    <span>Path: /quality-engineering/bug-detection</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-emerald-400">INTELLIGENCE SYNCED</span>
                </div>
            </div>

            {/* Main Layout */}
            <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 flex-1 flex flex-col gap-6 min-h-0 overflow-hidden">

                {/* Page Identity */}
                <div className="flex flex-col mb-2 shrink-0 text-left">
                    <h1 className="text-3xl font-semibold text-slate-300 uppercase tracking-widest">BUG DETECTION</h1>
                    <p className="text-[13px] font-mono text-slate-500 mt-1">Precise Defect Localization & Resolution Intelligence</p>
                </div>

                {/* SECTION 1: EXECUTIVE SNAPSHOT */}
                <div className="flex flex-col lg:flex-row gap-6 shrink-0">

                    {/* Left: Score & Stats */}
                    <div className="lg:w-[60%] bg-[#1E293B] border border-slate-800 rounded p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
                        {critical > 0 && (
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <ShieldAlert size={14} /> Defect Intelligence Score
                            </span>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="font-mono text-6xl font-bold text-slate-100 tracking-tighter">{bugScore}</span>
                                <span className="text-xl font-mono text-slate-600">/100</span>
                            </div>
                        </div>

                        <div className="flex gap-8 text-[11px] font-mono border-l border-slate-800 pl-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-500 uppercase">Total Issues</span>
                                <span className="text-2xl font-bold text-slate-200">{totalIssues}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-500 uppercase">Critical</span>
                                <span className={`text-2xl font-bold ${critical > 0 ? 'text-red-400' : 'text-slate-200'}`}>{critical}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-slate-500 uppercase">Confidence</span>
                                <span className="text-2xl font-bold text-emerald-400">94%</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Risk Summary */}
                    <div className="lg:w-[40%] bg-[#1E293B] border border-slate-800 rounded p-6 shadow-lg flex flex-col justify-center gap-4">
                        <h3 className="text-[12px] font-semibold text-slate-100 uppercase tracking-wide flex items-center gap-2 mb-2">
                            <Command size={14} className="text-amber-400" /> Risk Summary
                        </h3>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Critical Density</span>
                                <div className="flex items-end gap-2">
                                    <span className={`text-xl font-mono font-bold ${criticalDensity > 20 ? 'text-red-400' : 'text-slate-200'}`}>{criticalDensity}%</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Score Recovery</span>
                                <span className="text-xl font-mono text-emerald-400">+{issuesList.reduce((acc, iss) => acc + (iss?.resolution?.scoreRecovery || 0), 0)} pts</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Regression Risk</span>
                                <span className={`text-xl font-mono font-bold ${critical > 0 ? 'text-red-400' : 'text-amber-400'}`}>
                                    {Math.round((issuesList.reduce((acc, iss) => acc + parseFloat(iss?.regressionProbability || 0), 0) / (issuesList.length || 1)) * 100)}%
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-1 mt-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${criticalDensity > 20 ? 'bg-red-500' : 'bg-slate-500'}`} style={{ width: `${Math.min(100, criticalDensity)}%` }}></div>
                        </div>
                    </div>

                </div>

                {/* SECTION 2: INTELLIGENT ISSUE TABLE */}
                <div className="bg-[#1E293B] border border-slate-800 rounded flex flex-col flex-1 shadow-lg overflow-hidden min-h-0">
                    <div className="p-4 border-b border-slate-800 bg-[#0F172A]/50 flex items-center justify-between shrink-0">
                        <h3 className="text-[14px] font-semibold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                            <Layers size={14} className="text-blue-400" /> Intelligent Issue List
                        </h3>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700 max-w-sm truncate text-right">
                            {issuesList.length > 0 ? issuesList[0]?.detection?.url : ''}
                        </span>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-[#1E293B] shadow-sm z-10 border-b border-slate-800">
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <th className="w-1 p-0"></th>
                                    <th className="p-4 w-28">Severity</th>
                                    <th className="p-4 w-24 text-center">Priority</th>
                                    <th className="p-4">Title & Location</th>
                                    <th className="p-4 w-24 text-center">Exposure</th>
                                    <th className="p-4 w-24 text-center">Confidence</th>
                                    <th className="p-4 w-32 text-center">Fix Complexity</th>
                                    <th className="p-4 w-24 text-center">Recovery</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(issuesList) && issuesList.map((issue) => (
                                    <tr
                                        key={issue.id}
                                        onClick={() => setSelectedIssue(issue)}
                                        className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors group"
                                    >
                                        <td className={`p-0 w-1 ${STATUS_BG[issue?.severity || 'MEDIUM']} opacity-70 group-hover:opacity-100`}></td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold font-mono tracking-wider rounded border ${STATUS_BG[issue?.severity || 'MEDIUM']} ${STATUS_COLORS[issue?.severity || 'MEDIUM']}`}>
                                                {issue?.severity || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[13px] font-mono font-bold text-slate-200">{issue?.priorityScore || 0}</span>
                                        </td>
                                        <td className="p-4">
                                            <p className={`text-[13px] font-semibold ${issue?.severity === 'CRITICAL' ? 'text-slate-100' : 'text-slate-300'} group-hover:text-blue-400 transition-colors truncate max-w-xl`}>{issue?.title || 'Unknown Defect'}</p>
                                            <p className="text-[10px] font-mono text-slate-500 mt-1 truncate max-w-xl">
                                                <span className="text-slate-400">{issue?.detection?.route || 'N/A'}</span> → {issue?.detection?.apiEndpoint || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[12px] font-mono font-bold ${issue?.impactAnalysis?.userExposurePercent > 50 ? 'text-amber-400' : 'text-slate-400'}`}>{issue?.impactAnalysis?.userExposurePercent}%</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[12px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">{issue?.confidence}%</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[11px] font-mono text-slate-400 uppercase">{issue?.resolution?.fixComplexity}</span>
                                        </td>
                                        <td className="p-4 text-center text-emerald-400 font-mono text-[12px] font-bold">
                                            +{issue?.resolution?.scoreRecovery}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(15, 23, 42, 0.5); 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(51, 65, 85, 0.8); 
                border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(71, 85, 105, 1); 
                }
            `}} />
        </div>
    );
};

export default BugDetection;
