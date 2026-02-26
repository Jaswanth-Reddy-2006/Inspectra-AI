import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu, Activity, Search, Terminal,
    ArrowLeft, ShieldCheck, ChevronRight, CheckCircle2,
    ShieldCheck as ShieldIcon, AlertTriangle, Info, Clock, BarChart2,
    Layers, Zap, ShieldAlert
} from 'lucide-react';

const AGENT_TYPES = {
    CRAWLER: 'CRAWLER',
    AUDIT: 'AUDIT',
    SECURITY: 'SECURITY',
    INTELLIGENCE: 'INTELLIGENCE'
};

const LOG_EXPLANATIONS = {
    'Mapping /node/*': {
        exp: 'The system is scanning all routes under the /node/ path to ensure they are indexed and properly connected. This is routine system activity.',
        status: 'Normal',
        forensic: 'Heuristic discovery mapping identified 14 discrete routes. Breadth-first traversal confirmed connectivity integrity across the cluster.',
        mitigation: 'No action required. Routine discovery in progress.',
        impact: 'Low - System visibility maintenance.'
    },
    'Asset cache synchronized': {
        exp: 'Local asset manifests have been updated to match the latest server-side state. This is routine system activity.',
        status: 'Normal',
        forensic: 'Checksum validation against remote origin confirmed manifest consistency. Cache-control headers verified for edge-node synchronization.',
        mitigation: 'No action required. Performance optimization layer active.',
        impact: 'Low - Cache performance maintenance.'
    },
    'Orphaned route detected': {
        exp: 'A route exists in the system but is not linked from any navigation path. Action: Review navigation config or delete obsolete route.',
        status: 'Warning',
        forensic: 'Structural entropy analysis found terminal nodes with zero incoming edges. This indicates potential "ghost" pages or dead-ends in user flows.',
        mitigation: 'Update the global site map or implement 301 redirects for orphaned paths.',
        impact: 'Medium - Degrades SEO crawlability and discovery efficiency.'
    },
    'Heuristic Validation': {
        exp: 'The audit engine is performing rule-based checks on the current DOM structure for compliance. This is routine system activity.',
        status: 'Normal',
        forensic: 'Rule-set execution on active DOM tree. 124 nodes evaluated against architectural hygiene standards.',
        mitigation: 'No action required. Passive audit in progress.',
        impact: 'Low - Structural health monitoring.'
    },
    'Implicit ARIA role mismatch': {
        exp: 'An HTML element has an ARIA role that conflicts with its semantic purpose. Action: Fix ARIA role to match element type.',
        status: 'Warning',
        forensic: 'Semantic dissonance detected between <button> tag and "link" role. Conflict at line 442 in Layout.jsx prevents screen-reader clarity.',
        mitigation: 'Synchronize HTML tag with intended ARIA role or use semantic native elements.',
        impact: 'Medium - Compromises accessibility compliance (WCAG 2.1).'
    },
    'DOM nesting depth violation': {
        exp: 'The document structure is too deep. Action: Flatten the component hierarchy.',
        status: 'Warning',
        forensic: 'Tree depth exceeded threshold (max: 12, current: 18). Deep nesting identified in "ProductListV3" component causing layout calculation overhead (>4ms).',
        mitigation: 'Refactor deep HOCs or context providers using flat structures or memoized selectors.',
        impact: 'Medium - Increases TBT (Total Blocking Time) on mobile devices.'
    },
    'Flow Integrity Scan': {
        exp: 'Security agent is verifying that data packets are moving through approved internal channels. This is routine system activity.',
        status: 'Normal',
        forensic: 'Deep packet inspection (DPI) of internal XHR traffic. All payload signatures match approved API schemas.',
        mitigation: 'No action required. Continuous security monitoring.',
        impact: 'Low - Perimeter integrity verification.'
    },
    'Suspicious payload signature': {
        exp: 'An incoming data packet contains patterns matching known browser exploits. Action: Monitor origin IP for escalation.',
        status: 'Warning',
        forensic: 'Signature match detected for "sql-injection-probe-v1" in GET parameters. Anomaly score: 78%. Payload dropped at application firewall layer.',
        mitigation: 'Blacklist source IP range for 24h and enable strict schema validation on affected endpoints.',
        impact: 'High - Attempted probe of database vulnerability surface.'
    },
    'Cross-Origin violation': {
        exp: 'A script attempted to access a resource from an unapproved domain. Action: Trace origin script and revoke token.',
        status: 'Critical',
        forensic: 'Unauthorized XHR request to "unverified-cdn.io" intercepted. Source: Third-party analytics script injecting dynamic DOM nodes.',
        mitigation: 'Enforce strict Content-Security-Policy (CSP) and remove the offending third-party script.',
        impact: 'Critical - High risk of data exfiltration via third-party injection.'
    },
    'Risk Surface Calculation': {
        exp: 'Intelligence node is updating the mathematical model of total system risk based on recent signals. This is routine system activity.',
        status: 'Normal',
        forensic: 'Bayesian probability update integrated 22 new signals. Swarm confidence level: 99.4%. No immediate threats detected.',
        mitigation: 'No action required. Decision logic remains stable.',
        impact: 'Low - System intelligence calibration.'
    },
    'Aggregated telemetry': {
        exp: 'Gathering performance signals from all nodes into a central buffer for analysis. This is routine system activity.',
        status: 'Normal',
        forensic: 'Consolidated logs from Crawler, Audit, and Security agents. Buffer utilization at 12%. No signal dropped during synchronization.',
        mitigation: 'No action required. Telemetry pipeline active.',
        impact: 'Low - Data synchronization.'
    },
    'Heuristic drift detected': {
        exp: 'Standard rules are no longer producing predictable results. Action: Recalibrate agent thresholds.',
        status: 'Warning',
        forensic: 'Behavioral variance detected in pattern matching engine. Success rate dropped from 99% to 84%. Likely due to rapid DOM mutation patterns.',
        mitigation: 'Retrain heuristic weights for the Intelligence node to account for new dynamic layout patterns.',
        impact: 'Medium - Risk of increased false-positive triggers.'
    },
    'Rapid credential stuffing attempt blocked': {
        exp: 'Multiple automated login attempts were detected and neutralized. Action: Block source IP range.',
        status: 'Critical',
        forensic: 'Brute-force pattern identified: 45 login attempts from same IP in 1.2s. Origin trace: Data center IP range in "Cluster-B". MFA was triggered correctly.',
        mitigation: 'Permanently block source CIDR and implement account lockout delay for successive failures.',
        impact: 'Critical - Active attempt to compromise user account integrity.'
    },
    'Swarm autonomous defense activated: Lowering tolerance thresholds.': {
        exp: 'The system identified an active threat and automatically tightened security rules. Action: Monitor system recovery.',
        status: 'Critical',
        forensic: 'High-alert state triggered by Cross-Origin violation and consecutive payload anomalies. System throttled external API throughput by 50%.',
        mitigation: 'Keep high-alert state active until manual review of "Cluster-X" logs is completed.',
        impact: 'High - Protected state initiated to prevent data leak.'
    },
    'Defense protocol deactivated: System status nominal.': {
        exp: 'The threat has been neutralized, and the swarm is returning to standard monitoring mode.',
        status: 'Normal',
        forensic: 'Anomalous signal frequency dropped to 0% for 6 cycles. Tolerance thresholds restored to baseline values.',
        mitigation: 'Resume passive monitoring. No residual threats identified.',
        impact: 'Low - Return to nominal operation.'
    }
};

const AgentDetail = () => {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);
    const [logs, setLogs] = useState([]);
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        const savedAgentsRaw = localStorage.getItem('inspectra_swarm_v3_agents');
        const savedLogsRaw = localStorage.getItem('inspectra_swarm_v3_logs');

        const savedAgents = savedAgentsRaw ? JSON.parse(savedAgentsRaw) : [];
        const savedLogs = savedLogsRaw ? JSON.parse(savedLogsRaw) : [];

        if (Array.isArray(savedAgents) && Array.isArray(savedLogs)) {
            const foundAgent = savedAgents.find(a => a.id === agentId);
            if (foundAgent) {
                setAgent(foundAgent);
                setLogs(savedLogs.filter(l => l.agent === agentId));
            }
        }
    }, [agentId]);

    // Live update simulation (optional, but keeps it feeling alive)
    useEffect(() => {
        const interval = setInterval(() => {
            const savedAgentsRaw = localStorage.getItem('inspectra_swarm_v3_agents');
            const savedLogsRaw = localStorage.getItem('inspectra_swarm_v3_logs');

            const savedAgents = savedAgentsRaw ? JSON.parse(savedAgentsRaw) : [];
            const savedLogs = savedLogsRaw ? JSON.parse(savedLogsRaw) : [];

            if (Array.isArray(savedAgents) && Array.isArray(savedLogs)) {
                const updated = savedAgents.find(a => a.id === agentId);
                if (updated) {
                    setAgent(updated);
                    setLogs(savedLogs.filter(l => l.agent === agentId));
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [agentId]);

    const strategyAnalysis = useMemo(() => {
        if (!agent) return [];
        return [
            {
                label: 'Current Activity',
                val: agent.id === AGENT_TYPES.CRAWLER ? 'Mapping discovery paths and indexing disconnected nodes.' :
                    agent.id === AGENT_TYPES.AUDIT ? 'Validating architectural hygiene and accessibility compliance.' :
                        agent.id === AGENT_TYPES.SECURITY ? 'Analyzing data flow integrity and intercepting unauthorized origins.' :
                            'Aggregating swarm telemetry and calculating global risk velocity.'
            },
            {
                label: 'Strategic Meaning',
                val: agent.id === AGENT_TYPES.CRAWLER ? 'Ensures 100% monitorability of the application surface.' :
                    agent.id === AGENT_TYPES.AUDIT ? 'Maintains high code standards to prevent technical debt and UX friction.' :
                        agent.id === AGENT_TYPES.SECURITY ? 'Protects against data exfiltration and external script injection.' :
                            'Provides the decision logic required for autonomous system response.'
            },
            {
                label: 'System Health',
                val: agent.error ? 'CRITICAL - Functional anomaly detected in active trace.' :
                    agent.latency > 500 ? 'MODERATE - High latency detected during complex computation.' :
                        'NORMAL - Node is operating within nominal stability parameters.',
                color: agent.error ? 'text-rose-600' : agent.latency > 500 ? 'text-amber-600' : 'text-emerald-600'
            },
            {
                label: 'Risk Conclusion',
                val: agent.error ? 'Active intervention required to prevent trace failure.' : 'Low risk profile. Continuous monitoring recommended.'
            }
        ];
    }, [agent]);

    if (!agent) return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="text-center space-y-4">
                <Activity size={48} className="text-slate-200 animate-pulse mx-auto" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Locating Agent Trace...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 space-y-12">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/agents')}
                    className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group"
                >
                    <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Back to Swarm</span>
                </button>
                <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm text-[10px] font-bold text-slate-400">
                    <Clock size={14} className="text-indigo-500" />
                    Last Active: {new Date(agent.lastActive).toLocaleTimeString()}
                </div>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row gap-12 items-start">
                <div className="flex-1 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-100 bg-white border border-slate-50 text-indigo-600`}>
                                <ShieldCheck size={40} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic">{agent.name}</h1>
                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                        {agent.id}
                                    </div>
                                </div>
                                <p className="text-slate-400 font-medium text-lg">{agent.desc}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-slate-900 rounded-[3rem] text-white space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap size={80} />
                            </div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Current Task</p>
                            <h3 className="text-xl font-bold leading-relaxed">"{agent.task}"</h3>
                        </div>

                        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Velocity</p>
                            <div className="space-y-3">
                                <p className="text-4xl font-black text-slate-900">{agent.cpu}%</p>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${agent.cpu}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Latency</p>
                            <div className="space-y-3">
                                <p className={`text-4xl font-black ${agent.latency > 400 ? 'text-amber-500' : 'text-slate-900'}`}>
                                    {agent.latency}ms
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    {agent.latency > 400 ? 'Threshold Violation' : 'Nominal Response'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Narrative & Insights */}
                <div className="lg:col-span-4 space-y-12">
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 px-2">
                            <Cpu size={18} className="text-indigo-600" />
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Strategy & Narrative</h4>
                        </div>
                        <div className="space-y-4">
                            {strategyAnalysis.map((item, i) => (
                                <div key={i} className="p-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm space-y-1 hover:border-indigo-100 transition-colors">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                    <p className={`text-[13px] font-bold leading-relaxed ${item.color || 'text-slate-700'}`}>{item.val}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-2 px-2">
                            <Search size={18} className="text-indigo-600" />
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Discovery Findings</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-8 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Entities Mapped</p>
                                <p className="text-3xl font-black text-slate-900">{agent.completed}</p>
                                <CheckCircle2 size={16} className="text-emerald-500" />
                            </div>
                            <div className="p-8 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center space-y-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Discovery Depth</p>
                                <p className="text-3xl font-black text-slate-900">{agent.cpu > 50 ? 'Deep' : 'Standard'}</p>
                                <Layers size={16} className="text-indigo-500" />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Logs */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Terminal size={18} className="text-indigo-600" />
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Autonomous Trace Logs</h4>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{logs.length} Signals Captured</span>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-sm">
                        <div className="max-h-[800px] overflow-y-auto p-10 space-y-12 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {logs.length > 0 ? (
                                    logs.slice(0, 20).map((log, i) => {
                                        const explanation = LOG_EXPLANATIONS[log.message] || { exp: 'Routine system activity and telemetry synchronization.', status: 'Normal' };
                                        return (
                                            <motion.div
                                                key={log.id || i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-4 text-slate-100 tracking-tighter text-[9px] font-bold">
                                                    <span className="text-slate-300 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{log.timestamp}</span>
                                                    <div className="flex-1 h-px bg-slate-50" />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="text-slate-400/30 px-2 tracking-widest text-[10px]">--------------------------------------------------------------------------------</div>

                                                    <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-50 space-y-8 group hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all duration-500">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                            {/* Signal Row */}
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Terminal size={12} className="text-slate-400" />
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">🔹 RAW LOG:</p>
                                                                </div>
                                                                <div className="bg-slate-900 text-indigo-300 p-4 rounded-2xl font-mono text-[11px] font-bold border border-slate-800 shadow-inner">
                                                                    {log.message}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Cpu size={12} className="text-indigo-500" />
                                                                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none">🧠 EXPLANATION:</p>
                                                                </div>
                                                                <p className="text-[12px] text-slate-600 font-medium leading-relaxed italic border-l-2 border-indigo-50 pl-4 py-1">
                                                                    "{explanation.exp}"
                                                                </p>
                                                            </div>

                                                            {/* Context Row (NEW: Exact Location) */}
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Layers size={12} className="text-slate-400" />
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">🌐 SOURCE ORIGIN:</p>
                                                                </div>
                                                                <p className="text-[11px] text-indigo-600 font-bold font-mono truncate px-4 border-l-2 border-indigo-50">
                                                                    {log.url || 'N/A (Global Swarm context)'}
                                                                </p>
                                                            </div>

                                                        </div>

                                                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2 h-2 rounded-full ${explanation.status === 'Critical' ? 'bg-rose-500 animate-pulse' :
                                                                    explanation.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                    }`} />
                                                                <span className={`text-[11px] font-black uppercase tracking-widest ${explanation.status === 'Critical' ? 'text-rose-600' :
                                                                    explanation.status === 'Warning' ? 'text-amber-600' : 'text-emerald-600'
                                                                    }`}>
                                                                    STATUS: ({explanation.status})
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedLog(log)}
                                                                className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                                            >
                                                                Full Forensic Breakdown →
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="text-slate-400/30 px-2 tracking-widest text-[10px]">--------------------------------------------------------------------------------</div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="py-20 text-center space-y-4">
                                        <Activity size={48} className="text-slate-100 mx-auto" />
                                        <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[11px]">Monitoring decentralised flux...</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forensic Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden z-20 border border-slate-100"
                        >
                            <div className="p-12 space-y-10">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                                <ShieldAlert size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Full Forensic Breakdown</h2>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedLog.timestamp} // Trace ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedLog(null)}
                                        className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all"
                                    >
                                        <Info size={18} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Terminal size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Initial Signal Captured</p>
                                        </div>
                                        <p className="text-xl font-bold text-white leading-relaxed font-mono">"{selectedLog.message}"</p>
                                    </div>

                                    <div className="space-y-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={14} className="text-indigo-500" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🧠 Strategic Interpretation</p>
                                        </div>
                                        <p className="text-[15px] text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-100 pl-6 py-2">
                                            "{LOG_EXPLANATIONS[selectedLog.message]?.exp || 'Deep behavioral analysis confirms routine telemetry synchronization without residual anomalies.'}"
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Layers size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🌐 SOURCE ORIGIN</p>
                                        </div>
                                        <p className="text-sm text-indigo-600 font-black font-mono px-6 border-l-4 border-indigo-50">
                                            {selectedLog.url || 'N/A (Global Context)'}
                                        </p>
                                    </div>


                                    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Impact</p>
                                                <p className={`text-[11px] font-black uppercase ${LOG_EXPLANATIONS[selectedLog.message]?.status === 'Critical' ? 'text-rose-600' :
                                                    LOG_EXPLANATIONS[selectedLog.message]?.status === 'Warning' ? 'text-amber-600' : 'text-emerald-600'
                                                    }`}>
                                                    {LOG_EXPLANATIONS[selectedLog.message]?.impact || 'Negligible'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Score: 99.4%</span>
                                            <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-[99%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
                                >
                                    Acknowledge Forensic Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
};

export default AgentDetail;
