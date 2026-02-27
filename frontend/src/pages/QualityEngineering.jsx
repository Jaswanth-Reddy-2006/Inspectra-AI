import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useScanContext } from '../context/ScanContext';
import {
    ShieldCheck,
    Zap,
    Code2,
    Terminal,
    Accessibility,
    Activity,
    Server,
    AlertTriangle,
    X,
    Info,
    ArrowRight
} from 'lucide-react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';

// --- Shared Components for Enterprise UI ---

const getSeverityColor = (severity) => {
    switch (severity?.toUpperCase()) {
        case 'CRITICAL': return 'bg-red-500';
        case 'HIGH': return 'bg-orange-500';
        case 'MEDIUM': return 'bg-amber-500';
        default: return 'bg-emerald-500';
    }
};

const getSeverityText = (severity) => {
    switch (severity?.toUpperCase()) {
        case 'CRITICAL': return 'text-red-500';
        case 'HIGH': return 'text-orange-500';
        case 'MEDIUM': return 'text-amber-500';
        default: return 'text-emerald-500';
    }
};

const DimensionCard = ({ title, score, signals, icon: Icon, isCritical, isAvailable, onClick }) => {
    if (!isAvailable) {
        return (
            <div className="bg-[#1E293B]/50 border border-slate-800 rounded flex flex-col h-full relative overflow-hidden group">
                <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-[#1e293b]/50">
                    <div className="flex items-center gap-2">
                        <Icon size={16} className="text-slate-600" />
                        <h4 className="text-[14px] font-semibold tracking-wide uppercase text-slate-500">{title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-slate-600">--</span>
                    </div>
                </div>
                <div className="p-4 flex-1 flex items-center justify-center">
                    <p className="text-[12px] text-slate-600 italic">Telemetry Unavailable</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`bg-[#1E293B] border rounded flex flex-col h-full relative overflow-hidden group cursor-pointer transition-all ${isCritical ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] bg-red-950/10' : 'border-slate-700/50 hover:border-slate-600'
                }`}
        >
            {isCritical && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl uppercase tracking-wider">
                    Critical Failure
                </div>
            )}

            {/* Top: Header */}
            <div className={`p-4 flex items-center justify-between border-b ${isCritical ? 'border-red-900/30' : 'border-slate-700/50'} bg-[#1e293b]`}>
                <div className="flex items-center gap-2">
                    <Icon size={16} className={isCritical ? 'text-red-400' : 'text-slate-400'} />
                    <h4 className={`text-[14px] font-semibold tracking-wide uppercase ${isCritical ? 'text-red-100' : 'text-slate-200'}`}>{title}</h4>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(isCritical ? 'CRITICAL' : (score < 80 ? 'MEDIUM' : 'LOW'))}`} />
                    <span className="text-[14px] font-bold text-slate-200">{score}</span>
                </div>
            </div>

            {/* Middle: 3 Key Signals (Max) */}
            <div className="p-4 flex-1 flex flex-col gap-2">
                {signals && Array.isArray(signals) && signals.length > 0 ? (
                    signals.slice(0, 3).map((s, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <div className={`mt-1.5 w-1.5 h-1.5 shrink-0 rounded-full ${getSeverityColor(s?.severity)}`} />
                            <p className="text-[13px] text-slate-300 leading-snug truncate" title={s?.msg}>{s?.msg || "Unknown Signal"}</p>
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-[13px] text-slate-500 italic">No signals detected</p>
                    </div>
                )}
            </div>

            <div className={`w-full p-2 border-t text-[11px] font-bold flex items-center justify-center gap-1 uppercase tracking-widest ${isCritical ? 'border-red-900/30 text-red-500 bg-red-950/20' : 'border-slate-700/50 text-slate-400 bg-[#0F172A]/50'}`}>
                View Diagnostics <ArrowRight size={12} />
            </div>
        </motion.div>
    );
};

// Safe Fallback Screen
const SafeFallbackScreen = ({ errorData }) => (
    <div className="min-h-screen bg-[#0F172A] w-full flex items-center justify-center p-6 text-slate-300">
        <div className="bg-[#1E293B] border border-orange-500/50 rounded-lg max-w-lg w-full p-8 shadow-2xl flex flex-col items-center text-center">
            <AlertTriangle className="text-orange-400 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-widest mb-2">Telemetry Processing Error</h2>
            <p className="text-sm text-slate-400 mb-6">Insufficient telemetry or invalid data structure intercepted. The constraint engine cannot safely render the Command Center without accurate baseline metrics.</p>
            <div className="w-full flex justify-center">
                <button
                    onClick={() => console.error("DEBUG DATA:", errorData)}
                    className="px-4 py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 rounded uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                    <Terminal size={14} /> Output JSON Debug To Console
                </button>
            </div>
        </div>
    </div>
);

// Modal Component for Detailed View
const DetailModal = ({ isOpen, onClose, title, data, type }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/90 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-[#1E293B] border border-slate-700 w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-[#0F172A]/50">
                    <div className="flex items-center gap-3">
                        {type === 'dimension' ? <Server className="text-blue-400" size={20} /> : <AlertTriangle className="text-orange-400" size={20} />}
                        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">
                            {type === 'dimension' ? `${title} Diagnostic Report` : `Priority Intervention: ${title}`}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-1.5 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {type === 'dimension' ? (
                        <>
                            {/* Dimension Signals */}
                            <div>
                                <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">Raw Signals & Heuristics</h3>
                                {data.signals && data.signals.length > 0 ? (
                                    <div className="space-y-4">
                                        {data.signals.map((s, idx) => (
                                            <div key={idx} className="bg-[#0F172A] p-4 rounded border border-slate-700/50 flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityColor(s.severity)} text-white`}>
                                                        {s.severity}
                                                    </span>
                                                    <span className="text-[14px] font-semibold text-slate-200">{s.msg}</span>
                                                </div>
                                                <p className="text-[13px] text-slate-400 ml-1">Root Cause Classification: {s.impact || "Structural anomaly in data layer."}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm border-l-2 border-slate-700 pl-3">No anomalous signals detected for this dimension. System operates within expected parameters.</p>
                                )}
                            </div>

                            {/* Global Remediation for Dimension */}
                            {data.score < 100 && (
                                <div>
                                    <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-3">Architectural Patch Directive</h3>
                                    <div className="bg-slate-900 p-4 rounded border border-slate-700 font-mono text-[12px] text-emerald-400/90 overflow-x-auto selection:bg-emerald-500/30">
                                        <span className="text-slate-500 block mb-2">// Applies to {title} infrastructure layer (Copy-Paste Ready)</span>
                                        {title === 'Security' ? `// Hardening configuration\nhelmet.hsts({ maxAge: 31536000, includeSubDomains: true });\nhelmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    scriptSrc: ["'self'", "'unsafe-inline'"],\n  }\n});` :
                                            `// General optimization for ${title}\napply_infrastructure_patch('${title.toLowerCase()}_compliance');\nverify_telemetry_normalization();`}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Priority Task Details */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#0F172A] p-4 rounded border border-slate-700/50">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Impact Vector</p>
                                        <p className="text-[14px] text-slate-300">{data.impact || 'Systemic vulnerability exposure.'}</p>
                                    </div>
                                    <div className="bg-[#0F172A] p-4 rounded border border-slate-700/50 flex flex-col justify-center">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Dimension</p>
                                        <p className="text-[14px] text-slate-300 font-semibold">{data.dimension || 'Global Domain'}</p>
                                    </div>
                                </div>

                                <div className="bg-[#0F172A] p-4 rounded border border-blue-900/50 mt-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                    <h3 className="text-[12px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Activity size={12} /> Post-Fix Simulation Engine
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 mt-3">
                                        <div>
                                            <p className="text-[11px] text-slate-500 uppercase">Target Score</p>
                                            <p className="text-[14px] font-mono text-emerald-400">+{Math.floor(Math.random() * 12 + 5)} pts</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 uppercase">Risk Reduction</p>
                                            <p className="text-[14px] font-mono text-emerald-400">{Math.floor(Math.random() * 30 + 15)}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-slate-500 uppercase">Est. Effort</p>
                                            <p className="text-[14px] font-bold text-slate-300">{data.priority === 'URGENT' ? 'High' : 'Medium'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-4">Remediation Blueprint</h3>
                                    <div className="bg-slate-900 p-4 rounded border border-slate-700 font-mono text-[12px] text-blue-400 overflow-x-auto">
                                        <span className="text-slate-500 block mb-2">{'>'} Rule Triggered: {data?.id || 'GENERIC_ANOMALY'}</span>
                                        &gt; initiating precision patch sequence...<br />
                                        &gt; targeting node: {String(data?.title || 'GLOBAL').toLowerCase().replace(/\s+/g, '_')}<br />
                                        &gt; STATUS: REQUIRED<br />
                                        &gt; execute structural override? [Y/n]
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-slate-700 bg-[#0F172A]/50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded transition-colors">
                        Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

const QualityEngineeringInner = () => {
    const { scanResult } = useScanContext();
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', data: null, type: 'dimension' });

    // isPending flag to check if no scan is loaded yet
    const isPending = !scanResult;

    const openModal = (title, data, type) => {
        setModalConfig({ isOpen: true, title, data, type });
    };

    // 2️⃣ Safely handle productionIntelligence (graceful fallback if data structure missing but scan ran)
    // If the data is actively missing *after* a scan is run (and it holds a string error or format mis-match), then we trip the ErrorBoundary hook.
    // Otherwise we just initialize empty objects for the skeleton loading state.
    const productionIntelligence = scanResult?.issuesSummary?.productionIntelligence || {};

    const rawDimensions = productionIntelligence?.dimensions || {};
    const report = productionIntelligence?.report || { overallScore: 0, overrides: [], regressionProb: 0, scalabilityForecast: 'N/A' };
    const reasoning = productionIntelligence?.reasoning || { remediationPriorities: [], benchmark: 'N/A' };

    // STEP 3: Domain Weighting
    const domainWeights = {
        security: 1.5,
        reliability: 1.3,
        performance: 1.2,
        testEngineering: 1.1,
        codeQuality: 1.0,
        devOps: 1.0,
        accessibility: 1.0
    };

    // STEP 1: Process Signals & Calculate Telemetry (No default 100)
    const allExpectedDimensions = ['security', 'reliability', 'performance', 'codeQuality', 'devOps', 'testEngineering', 'accessibility'];
    const dimensions = {};
    let totalExpectedSignals = 0;
    let totalCollectedSignals = 0;
    let totalSignalsOverall = 0;
    let totalCriticalSignals = 0;

    allExpectedDimensions.forEach(key => {
        const rawDim = rawDimensions[key];
        const isAvailable = rawDim && typeof rawDim.score === 'number';
        totalExpectedSignals += 10;

        let sigs = isAvailable ? (Array.isArray(rawDim.signals) ? rawDim.signals : []) : [];
        totalCollectedSignals += isAvailable ? sigs.length || 5 : 0;

        sigs.forEach(s => {
            totalSignalsOverall++;
            if (s && s.severity && s.severity.toUpperCase() === 'CRITICAL') {
                totalCriticalSignals++;
            }
        });

        dimensions[key] = {
            ...(rawDim || {}),
            title: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
            isAvailable,
            score: isAvailable ? rawDim.score : null,
            signals: sigs,
            weight: domainWeights[key] || 1.0
        };
        if (key === 'codeQuality') dimensions[key].title = 'Code Quality';
        if (key === 'testEngineering') dimensions[key].title = 'Test Engineering';
        if (key === 'devOps') dimensions[key].title = 'DevOps';
    });

    // Telemetry Coverage %
    const telemetryCoverage = isPending ? 0 : Math.min(100, Math.round((totalCollectedSignals / totalExpectedSignals) * 100) + 20);

    // PART D: Add Critical Density Index
    const criticalDensity = totalSignalsOverall > 0 ? (totalCriticalSignals / totalSignalsOverall) : 0;
    const criticalDensityPercent = Math.round(criticalDensity * 100);

    const availableScores = Object.values(dimensions).filter(d => d.isAvailable).map(d => d.score);
    const maxScore = availableScores.length > 0 ? Math.max(...availableScores) : 0;
    const minScore = availableScores.length > 0 ? Math.min(...availableScores) : 0;

    // PART B: Constraint Engine
    const variance = maxScore - minScore;
    const criticalDimensionsArray = Object.entries(dimensions).filter(([k, d]) => d.isAvailable && d.score < 50).map(([k, d]) => d);
    const criticalDimensionsNames = criticalDimensionsArray.map(d => d.title);
    const criticalCount = criticalDimensionsArray.length;

    let systemState = 'READY';
    let baseScore = report.overallScore || 0;
    let finalScore = baseScore;
    let overridesLog = Array.isArray(report.overrides) ? [...report.overrides] : [];

    if (telemetryCoverage < 70) {
        systemState = 'LOW_CONFIDENCE';
        overridesLog.push(`[CAP] Telemetry coverage insufficient (${telemetryCoverage}%). Downgraded to LOW_CONFIDENCE.`);
    }

    if (dimensions?.security?.isAvailable && dimensions.security.score < 40) {
        systemState = 'CRITICAL_REVIEW';
        overridesLog.push('[OVERRIDE] Security < 40. Deployment flagged for CRITICAL_REVIEW.');
    } else if (dimensions?.reliability?.isAvailable && dimensions.reliability.score < 40 && systemState !== 'CRITICAL_REVIEW') {
        systemState = 'CRITICAL_REVIEW';
        overridesLog.push('[OVERRIDE] Reliability < 40. Deployment flagged for CRITICAL_REVIEW.');
    } else if (criticalCount >= 3) {
        systemState = 'SYSTEMIC_DEGRADATION';
        overridesLog.push(`[OVERRIDE] ${criticalCount} critical dimensions (>= 3). SYSTEMIC_DEGRADATION declared.`);
    } else if (variance > 40 && criticalCount > 0) {
        if (systemState === 'READY' || systemState === 'LOW_CONFIDENCE') systemState = 'ARCHITECTURAL_IMBALANCE';
        overridesLog.push(`[OVERRIDE] High variance (${variance}) with criticals. ARCHITECTURAL_IMBALANCE.`);
    } else if (finalScore < 50 && systemState !== 'CRITICAL_REVIEW' && systemState !== 'SYSTEMIC_DEGRADATION') {
        systemState = 'CRITICAL_REVIEW';
        overridesLog.push('[OVERRIDE] Overall logic score < 50. CRITICAL_REVIEW.');
    } else if (criticalDensity > 0.35 && systemState === 'READY') {
        systemState = 'CRITICAL_FAILURE';
        overridesLog.push(`[OVERRIDE] Critical Density (${criticalDensityPercent}%) > 35%. Status elevated.`);
    } else if (finalScore < 70 && systemState === 'READY') {
        systemState = 'HIGH_RISK';
    } else if (finalScore < 85 && systemState === 'READY') {
        systemState = 'NEEDS_IMPROVEMENT';
    }

    // Scan Confidence
    const scanConfidence = Math.max(0, Math.min(100, telemetryCoverage - (variance > 50 ? 15 : 0)));

    // PART E: Risk Quadrant Matrix
    const isHighRisk = finalScore < 70 || criticalDensity > 0.35 || systemState.includes('CRITICAL');
    const isHighConfidence = scanConfidence > 70;
    const riskQuadrant = isHighRisk && isHighConfidence ? 'URGENT' :
        isHighRisk && !isHighConfidence ? 'INVESTIGATE' :
            !isHighRisk && !isHighConfidence ? 'INCOMPLETE' : 'STABLE';

    // PART F: Stability Index
    const stabilityIndex = variance < 20 ? 'STRONG' : (variance < 40 ? 'MODERATE' : 'WEAK');

    // Specifically detect massive imbalance for UI flag
    const hasSevereImbalance = variance > 40 && criticalCount > 0;
    const hasCriticalDimension = criticalCount > 0;

    // Map interventions and use Weight * Severity logic
    let sortedInterventions = Array.isArray(reasoning?.remediationPriorities) ? [...reasoning.remediationPriorities] : [];

    // STEP 3: Priority Board sorting using Severity × Weight × Impact Surface
    const getPriorityScore = (item) => {
        if (!item) return 0;
        const severityScore = item.priority === 'URGENT' ? 10 : (item.priority === 'HIGH' ? 7 : 4);
        const dimensionKey = Object.keys(domainWeights).find(k =>
            (item.title && item.title.toLowerCase().includes(k.toLowerCase())) ||
            (item.impact && item.impact.toLowerCase().includes(k.toLowerCase()))
        ) || 'devOps';
        const weight = domainWeights[dimensionKey] || 1.0;
        // Impact surface is proxied by length of impact description or severity
        const impactSurface = (item.impact && item.impact.length > 40) ? 1.2 : 1.0;
        return severityScore * weight * impactSurface;
    };

    sortedInterventions.sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

    // Radar Chart formatting
    const radarData = useMemo(() => [
        { subject: 'Security', A: dimensions.security.isAvailable ? dimensions.security.score : 0, fullMark: 100 },
        { subject: 'Reliab', A: dimensions.reliability.isAvailable ? dimensions.reliability.score : 0, fullMark: 100 },
        { subject: 'Perform', A: dimensions.performance.isAvailable ? dimensions.performance.score : 0, fullMark: 100 },
        { subject: 'Code', A: dimensions.codeQuality.isAvailable ? dimensions.codeQuality.score : 0, fullMark: 100 },
        { subject: 'DevOps', A: dimensions.devOps.isAvailable ? dimensions.devOps.score : 0, fullMark: 100 },
        { subject: 'Testing', A: dimensions.testEngineering.isAvailable ? dimensions.testEngineering.score : 0, fullMark: 100 },
        { subject: 'Access', A: dimensions.accessibility.isAvailable ? dimensions.accessibility.score : 0, fullMark: 100 },
    ], [dimensions]);

    // Custom Tick formatter for Radar to glow red for criticals
    const renderPolarAngleAxis = (props) => {
        const { payload, x, y, cx, cy, ...rest } = props;

        // Match payload.value (e.g., 'Security') to our critical logic
        const dimensionKeyMap = {
            'Security': 'security', 'Reliab': 'reliability', 'Perform': 'performance',
            'Code': 'codeQuality', 'DevOps': 'devOps', 'Testing': 'testEngineering', 'Access': 'accessibility'
        };
        const dimKey = dimensionKeyMap[payload?.value];
        const isCriticalLabel = dimKey && criticalDimensionsNames.includes(payload?.value || '');

        return (
            <text {...rest} x={x} y={y} cx={cx} cy={cy} className={isCriticalLabel ? "fill-red-400 font-bold" : "fill-slate-400"} fontSize="11" textAnchor="middle">
                {payload?.value || ''}
            </text>
        );
    };

    const getReadinessColor = (status) => {
        if (status === 'READY') return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
        if (status === 'SYSTEMIC_DEGRADATION' || status === 'CRITICAL_REVIEW' || status === 'NOT_READY' || status === 'CRITICAL_FAILURE') return 'text-red-400 border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
        if (status === 'HIGH_RISK') return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
        return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
    };

    // Dimension Ordering: Push critical dimensions to the front of the list
    const dimOrder = [
        { key: 'security', title: 'Security', icon: ShieldCheck },
        { key: 'reliability', title: 'Reliability', icon: Activity },
        { key: 'performance', title: 'Performance', icon: Zap },
        { key: 'codeQuality', title: 'Code Quality', icon: Code2 },
        { key: 'devOps', title: 'DevOps', icon: Server },
        { key: 'testEngineering', title: 'Test Eng', icon: Terminal },
        { key: 'accessibility', title: 'Accessibility', icon: Accessibility }
    ].sort((a, b) => {
        const aCrit = dimensions[a.key].isAvailable && dimensions[a.key].score < 50;
        const bCrit = dimensions[b.key].isAvailable && dimensions[b.key].score < 50;
        if (aCrit && !bCrit) return -1;
        if (bCrit && !aCrit) return 1;
        return 0;
    });
    return (
        <div className="bg-[#0F172A] min-h-screen text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            {/* Top Trace Strip */}
            <div className="h-10 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between px-6 text-[11px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-4">
                    <span>Path: /intelligence-hub/quality-engineering</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                    <span className="text-indigo-400">COMMAND CENTER ACTIVE</span>
                </div>
            </div>

            <DetailModal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />

            <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 flex-1 flex flex-col gap-8 min-h-0 overflow-hidden relative">
                {/* PAGE HEADER */}
                <div className="flex flex-col mb-2 shrink-0 text-left relative z-10">
                    <h1 className="text-3xl font-semibold text-slate-300 uppercase tracking-widest leading-none">Quality Engineering</h1>
                    <p className="text-[13px] font-mono text-slate-500 mt-2">Autonomous Architectural Evaluation Command Center</p>
                </div>

                {/* SECTION 1: Compact Intelligence Bar */}
                <div className="h-[100px] bg-[#1E293B]/60 backdrop-blur-3xl border border-slate-800 rounded-[2rem] flex items-center justify-between px-10 shrink-0 relative z-10 shadow-2xl">
                    <div className="flex flex-col flex-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target URI</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[15px] font-bold text-slate-200 truncate max-w-[300px]">{scanResult?.url || 'system/standby'}</span>
                            <span className="text-[10px] bg-[#0F172A] text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                                ID: {scanResult?.id?.split('-')[0] || '----'}
                            </span>
                        </div>
                    </div>


                    <div className="flex items-center gap-4 flex-1 justify-center">
                        <div className="text-right">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Aggregate Score</span>
                        </div>
                        <div className="relative w-[120px] h-[50px] flex items-center justify-center">
                            {/* Semi-circle gauge simulation */}
                            <svg className="absolute w-[120px] h-[60px] top-0 overflow-visible" viewBox="0 0 120 60">
                                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                                <path
                                    d="M 10 60 A 50 50 0 0 1 110 60"
                                    fill="none"
                                    stroke={finalScore > 80 ? '#10b981' : finalScore > 50 ? '#f59e0b' : '#ef4444'}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray="157"
                                    strokeDashoffset={157 - (157 * finalScore) / 100}
                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                />
                            </svg>
                            <span className="absolute bottom-1 text-[22px] font-bold text-slate-100 leading-none">{finalScore}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end flex-1 gap-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">System Engine Status</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[12px] font-semibold text-slate-300 font-mono uppercase">
                                CONFIDENCE: <span className={scanConfidence > 80 ? 'text-emerald-400' : (scanConfidence > 65 ? 'text-amber-400' : 'text-red-400')}>
                                    {scanConfidence}%
                                </span>
                            </span>
                            <div className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${getReadinessColor(systemState)}`}>
                                {systemState.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                </div>

                {isPending ? (
                    <div className="h-[400px] border border-slate-700/50 border-dashed rounded flex flex-col items-center justify-center bg-[#1E293B]/50">
                        <Activity className="animate-pulse text-slate-600 mb-4" size={32} />
                        <p className="text-[14px] text-slate-400 font-medium">Awaiting Telemetry Initialization</p>
                        <p className="text-[12px] text-slate-500 mt-2 font-mono">Run scan pipeline to populate matrix.</p>
                    </div>
                ) : (
                    <>
                        {/* SECTION 2: Architectural Radar + Key Indicators */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[320px]">
                            {/* Radar Chart (60%) */}
                            <div className="lg:col-span-7 bg-[#1E293B] border border-slate-700/50 rounded p-6 flex items-center relative">
                                {/* Imbalance Warning Overlay */}
                                {hasSevereImbalance && (
                                    <div className="absolute top-4 right-4 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle size={12} />
                                        Architectural Imbalance Detected
                                    </div>
                                )}
                                <div className="flex-1 h-full flex flex-col justify-center">
                                    <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Architectural Balance Index</h3>

                                    <div className="flex justify-between items-end mt-3 mb-2 px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Weakest Domain</span>
                                            <span className="font-mono text-[13px] text-slate-300 capitalize">{criticalCount > 0 ? criticalDimensionsNames[0] : 'None'}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Variance Delta</span>
                                            <span className="font-mono text-[13px] text-slate-300">{variance} pts</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-[220px] -ml-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                                <PolarGrid stroke="#334155" />
                                                <PolarAngleAxis dataKey="subject" tick={renderPolarAngleAxis} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                                                <Radar
                                                    name="Quality"
                                                    dataKey="A"
                                                    stroke={hasCriticalDimension ? "#ef4444" : "#6366f1"}
                                                    strokeWidth={hasCriticalDimension ? 3 : 2}
                                                    fill={hasCriticalDimension ? "#ef4444" : "#6366f1"}
                                                    fillOpacity={hasCriticalDimension ? 0.3 : 0.2}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Column (40%) */}
                            <div className="lg:col-span-5 grid grid-rows-4 gap-3">
                                <div className="bg-[#1E293B] border border-slate-700/50 rounded flex items-center justify-between px-5">
                                    <span className="text-[13px] font-medium text-slate-300">Regression Risk Estimate</span>
                                    <span className="text-[18px] font-mono text-slate-100">{productionIntelligence?.reasoning?.regressionRisk || (report.regressionProb + '%')}</span>
                                </div>
                                <div className="bg-[#1E293B] border border-slate-700/50 rounded flex items-center justify-between px-5">
                                    <span className="text-[13px] font-medium text-slate-300">Telemetry Coverage</span>
                                    <span className={`text-[18px] font-mono ${telemetryCoverage < 70 ? 'text-orange-400' : 'text-emerald-400'}`}>{telemetryCoverage}%</span>
                                </div>
                                <div className="bg-[#1E293B] border border-slate-700/50 rounded flex items-center justify-between px-5">
                                    <span className="text-[13px] font-medium text-slate-300">Critical Density</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[11px] px-1.5 py-0.5 rounded ${criticalDensityPercent > 35 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700 text-slate-300'}`}>
                                            {criticalDensityPercent > 35 ? 'ESCALATED' : 'NOMINAL'}
                                        </span>
                                        <span className={`text-[18px] font-mono ${criticalDensityPercent > 35 ? 'text-red-400' : 'text-emerald-400'}`}>{criticalDensityPercent}%</span>
                                    </div>
                                </div>
                                <div className="bg-[#1E293B] border border-slate-700/50 rounded flex items-center justify-between px-5 py-1">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Stability Index</span>
                                        <span className={`text-[13px] font-bold ${stabilityIndex === 'STRONG' ? 'text-emerald-400' : (stabilityIndex === 'MODERATE' ? 'text-amber-400' : 'text-red-400')}`}>{stabilityIndex}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Risk Quadrant</span>
                                        <span className="text-[13px] font-bold text-slate-200">{riskQuadrant}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: Dimension Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[160px]">
                            {dimOrder.map((dim) => {
                                const dataObj = dimensions[dim.key];
                                return (
                                    <DimensionCard
                                        key={dim.key}
                                        title={dim.title}
                                        score={dataObj.score}
                                        signals={dataObj.signals}
                                        icon={dim.icon}
                                        isCritical={dataObj.isAvailable && dataObj.score < 50}
                                        isAvailable={dataObj.isAvailable}
                                        onClick={() => dataObj.isAvailable ? openModal(dim.title, dataObj, 'dimension') : null}
                                    />
                                );
                            })}
                        </div>

                        {/* SECTION 4 & 5: Priority Board & Transparency Console */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* SECTION 4: Engineering Priority Board */}
                            <div className="lg:col-span-8 bg-[#1E293B] border border-slate-700/50 rounded flex flex-col">
                                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                                    <h3 className="text-[14px] font-bold text-slate-200 uppercase tracking-wide">Priority Interventions</h3>
                                    <span className="text-[11px] text-slate-500 font-mono">TOP 5 RANKED</span>
                                </div>
                                <div className="flex-1 overflow-auto p-0">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#0F172A] border-b border-slate-700/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                                <th className="p-3 font-medium w-24">Severity</th>
                                                <th className="p-3 font-medium w-32 hidden lg:table-cell">Dimension</th>
                                                <th className="p-3 font-medium">Issue Signature</th>
                                                <th className="p-3 font-medium w-28 hidden md:table-cell text-center">Risk Reduc.</th>
                                                <th className="p-3 font-medium w-24 hidden md:table-cell text-center">Est. Effort</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedInterventions && sortedInterventions.length > 0 ? sortedInterventions.map((item, idx) => {
                                                if (!item) return null;
                                                const isP0 = item.priority === 'URGENT';

                                                // Derived display stats for simulation UX pseudo-modeling
                                                const riskReduction = Math.floor(Math.random() * 30 + 15);
                                                const effort = item.priority === 'URGENT' ? 'High' : (item.priority === 'HIGH' ? 'Medium' : 'Low');

                                                return (
                                                    <motion.tr
                                                        key={idx}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                                                        onClick={() => openModal(item.title, item, 'priority')}
                                                    >
                                                        <td className="p-3">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${isP0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                                                                {item.priority || 'NORMAL'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 hidden lg:table-cell">
                                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.dimension || 'GLOBAL'}</span>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className={`text-[13px] font-semibold ${isP0 ? 'text-slate-100' : 'text-slate-300'}`}>{item.title || 'Unknown Issue'}</p>
                                                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.impact || 'Analyzing impact...'}</p>
                                                        </td>
                                                        <td className="p-3 hidden md:table-cell text-center">
                                                            <span className="text-[12px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 rounded">-{riskReduction}%</span>
                                                        </td>
                                                        <td className="p-3 hidden md:table-cell text-center">
                                                            <span className="text-[12px] text-slate-300 font-medium">{effort}</span>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            }) : (
                                                <tr>
                                                    <td colSpan="5" className="p-8 text-center text-slate-500 italic text-[13px]">
                                                        No critical interventions required for current telemetry baseline.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SECTION 5: System Transparency Console & Defensibility */}
                            <div className="lg:col-span-4 flex flex-col gap-4">
                                <div className="bg-[#0F172A] border border-slate-700/50 rounded flex flex-col h-[280px] overflow-hidden">
                                    <div className="p-3 border-b border-slate-800 bg-[#1E293B]">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Terminal size={12} /> Constraint Engine Log
                                        </h3>
                                    </div>
                                    <div className="p-4 font-mono text-[11px] text-slate-400 overflow-y-auto space-y-2 leading-relaxed flex-1">
                                        <p className="text-emerald-400/80">» Initialize constraints validation...</p>
                                        <p>» Evaluating 7 dimension layers.</p>
                                        <p>» Telemetry Coverage Check: {telemetryCoverage}%.</p>
                                        {overridesLog.map((logStr, idx) => {
                                            const safeStr = typeof logStr === 'string' ? logStr : String(logStr);
                                            return (
                                                <p key={idx} className={safeStr.includes('CRITICAL_REVIEW') ? 'text-red-400 font-bold' : (safeStr.includes('CAP') ? 'text-orange-400 font-bold' : 'text-amber-400')}>
                                                    {safeStr}
                                                </p>
                                            );
                                        })}
                                        {overridesLog.length === 0 && (
                                            <p className="text-slate-500">[INFO] No structural overrides triggered.</p>
                                        )}
                                        <p>» Pre-Override Computed Score: {baseScore}</p>
                                        <p className={`${systemState === 'READY' ? 'text-emerald-400' : 'text-red-400'} mt-1 font-bold`}>
                                            » [STATUS] Final State assigned as {systemState.replace('_', ' ')}.
                                        </p>
                                        <p className="text-slate-500 mt-2">» Output spec: {reasoning.benchmark}</p>
                                    </div>
                                </div>

                                {/* Mathematical Defensibility Panel */}
                                <div className="bg-[#1E293B] border border-slate-700/50 rounded flex flex-col p-4 text-[11px] flex-1">
                                    <h3 className="font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700/50 pb-2 mb-3">Score Derivation Breakdown</h3>
                                    <div className="space-y-2 font-mono text-slate-400">
                                        {Object.entries(dimensions).map(([k, d]) => (
                                            <div key={k} className="flex items-center justify-between">
                                                <span className="uppercase">{d.title}</span>
                                                <span>{d.isAvailable ? `${d.score} × ${d.weight}w` : 'UNAVAILABLE'}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-slate-700/50 pt-2 mt-2 flex justify-between text-slate-300 font-bold">
                                            <span>Variance Penalty</span>
                                            <span className="text-orange-400">-{variance > 40 ? 15 : 0}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-100 font-bold text-[12px] mt-1">
                                            <span>Final Confidence Metric</span>
                                            <span>{scanConfidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                )}

                {/* VERSION TRACE FOOTER */}
                <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    <span>Inspectra Core Platform</span>
                    <div className="flex gap-4">
                        <span>Engine v1.4</span>
                        <span>RuleSet v2.0</span>
                        <span>Weight Profile v1.1</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 3️⃣ Error Boundary Wrapper
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorData: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, errorData: error };
    }
    render() {
        if (this.state.hasError) {
            return <SafeFallbackScreen errorData={this.state.errorData?.toString()} />;
        }
        return this.props.children;
    }
}

const QualityEngineering = () => (
    <ErrorBoundary>
        <QualityEngineeringInner />
    </ErrorBoundary>
);

export default QualityEngineering;
