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
        <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            {/* Top Trace Strip */}
            <div className="h-10 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between px-6 text-[11px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-4">
                    <span>Path: /intelligence-hub/agent-trace/{agent?.id || 'null'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-emerald-400">SESSION LIVE</span>
                </div>
            </div>

            <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 flex-1 flex flex-col gap-8 min-h-0 overflow-hidden relative">
                {/* Navigation Header */}
                <div className="flex items-center justify-between relative z-10 shrink-0">
                    <button
                        onClick={() => navigate('/agents')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center group-hover:bg-slate-800 transition-all">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest underline-offset-4 group-hover:underline">Back to Swarm</span>
                    </button>
                    <div className="flex items-center gap-3 px-4 py-2 bg-[#1E293B] border border-slate-800 rounded-full shadow-lg text-[10px] font-bold text-slate-400">
                        <Clock size={14} className="text-indigo-400" />
                        Last Active: {new Date(agent.lastActive).toLocaleTimeString()}
                    </div>
                </div>

                {/* Hero Section */}
                <div className="flex flex-col lg:flex-row gap-12 items-start relative z-10">
                    <div className="flex-1 space-y-10 w-full">
                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-2xl">
                                    <ShieldCheck size={40} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-5xl font-black text-slate-100 tracking-tighter italic">{agent.name}</h1>
                                        <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20">
                                            {agent.id}
                                        </div>
                                    </div>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed">{agent.desc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-8 bg-[#1E293B] border border-slate-800 rounded-[3rem] text-white space-y-4 relative overflow-hidden shadow-xl">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Zap size={80} />
                                </div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Current Task</p>
                                <h3 className="text-xl font-bold leading-relaxed text-slate-200">"{agent.task}"</h3>
                            </div>

                            <div className="p-8 bg-[#1E293B]/40 backdrop-blur-xl border border-slate-800 rounded-[3rem] shadow-xl space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Impact Velocity</p>
                                <div className="space-y-3">
                                    <p className="text-4xl font-black text-slate-200">{agent.cpu}%</p>
                                    <div className="h-2 w-full bg-[#0F172A] rounded-full overflow-hidden p-[2px] border border-slate-800">
                                        <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${agent.cpu}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-[#1E293B]/40 backdrop-blur-xl border border-slate-800 rounded-[3rem] shadow-xl space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Latency</p>
                                <div className="space-y-3">
                                    <p className={`text-4xl font-black ${agent.latency > 400 ? 'text-rose-500' : 'text-slate-200'}`}>
                                        {agent.latency}ms
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        {agent.latency > 400 ? 'Threshold Violation' : 'Nominal Response'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                    {/* Left Column: Narrative & Insights */}
                    <div className="lg:col-span-4 space-y-12">
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 px-2">
                                <Cpu size={18} className="text-indigo-400" />
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategy & Narrative</h4>
                            </div>
                            <div className="space-y-4">
                                {strategyAnalysis.map((item, i) => (
                                    <div key={i} className="p-6 bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] shadow-xl space-y-1 hover:border-indigo-500/30 transition-colors">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                                        <p className={`text-[13px] font-bold leading-relaxed ${item.color || 'text-slate-300'}`}>{item.val}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-2 px-2">
                                <Search size={18} className="text-indigo-400" />
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Discovery Findings</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-8 bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center text-center space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entities Mapped</p>
                                    <p className="text-3xl font-black text-slate-200 tabular-nums">{agent.completed}</p>
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                </div>
                                <div className="p-8 bg-[#1E293B]/40 backdrop-blur-3xl border border-slate-800 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center text-center space-y-2">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Discovery Depth</p>
                                    <p className="text-3xl font-black text-slate-200">{agent.cpu > 50 ? 'Deep' : 'Standard'}</p>
                                    <Layers size={16} className="text-indigo-400" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Logs */}
                    <div className="lg:col-span-8 space-y-6 min-h-0">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Terminal size={18} className="text-indigo-400" />
                                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Autonomous Trace Logs</h4>
                            </div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{logs.length} Signals Captured</span>
                        </div>

                        <div className="bg-[#1E293B]/20 backdrop-blur-3xl border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl flex-1 flex flex-col">
                            <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar flex-1">
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
                                                        <span className="text-slate-500 bg-[#0F172A] px-3 py-1 rounded-full border border-slate-800">{log.timestamp}</span>
                                                        <div className="flex-1 h-px bg-slate-800/50" />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div className="bg-[#1E293B]/40 p-8 rounded-[3rem] border border-slate-800/50 space-y-8 group hover:bg-[#1E293B]/60 hover:border-indigo-500/40 hover:shadow-2xl transition-all duration-500">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                {/* Signal Row */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Terminal size={12} className="text-slate-500" />
                                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">🔹 RAW LOG:</p>
                                                                    </div>
                                                                    <div className="bg-[#0F172A] text-indigo-300 p-4 rounded-2xl font-mono text-[11px] font-bold border border-slate-800 shadow-inner">
                                                                        {log.message}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Cpu size={12} className="text-indigo-400" />
                                                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">🧠 EXPLANATION:</p>
                                                                    </div>
                                                                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed italic border-l-2 border-indigo-500/20 pl-4 py-1">
                                                                        "{explanation.exp}"
                                                                    </p>
                                                                </div>

                                                                {/* Context Row */}
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Layers size={12} className="text-slate-500" />
                                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">🌐 SOURCE ORIGIN:</p>
                                                                    </div>
                                                                    <p className="text-[11px] text-indigo-400 font-bold font-mono truncate px-4 border-l-2 border-indigo-500/20">
                                                                        {log.url || 'N/A (Global Swarm context)'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full ${explanation.status === 'Critical' ? 'bg-rose-500 animate-pulse' :
                                                                        explanation.status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                        }`} />
                                                                    <span className={`text-[11px] font-black uppercase tracking-widest ${explanation.status === 'Critical' ? 'text-rose-500' :
                                                                        explanation.status === 'Warning' ? 'text-amber-500' : 'text-emerald-500'
                                                                        }`}>
                                                                        STATUS: {explanation.status}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => setSelectedLog(log)}
                                                                    className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2"
                                                                >
                                                                    Full Forensic Breakdown <ArrowUpRight size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-20 text-center space-y-4">
                                            <Activity size={48} className="text-slate-800 mx-auto" />
                                            <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-[11px]">Monitoring decentralised flux...</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VERSION TRACE FOOTER */}
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 uppercase tracking-widest shrink-0">
                    <span>Inspectra Swarm Trace</span>
                    <div className="flex gap-6">
                        <span>Node Kernel v4.2</span>
                        <span>Trace Decoder v1.1</span>
                        <span>Forensic Layer v2.0</span>
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
                            className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#1E293B] rounded-[3.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden z-20 border border-slate-800"
                        >
                            <div className="p-12 space-y-10">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                                                <ShieldAlert size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-100 tracking-tight">Full Forensic Breakdown</h2>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedLog.timestamp} // Trace ID: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedLog(null)}
                                        className="p-3 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all border border-slate-700"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <div className="p-8 bg-[#0F172A] rounded-[2.5rem] space-y-4 border border-slate-800">
                                        <div className="flex items-center gap-2">
                                            <Terminal size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Initial Signal Captured</p>
                                        </div>
                                        <p className="text-xl font-bold text-slate-200 leading-relaxed font-mono">"{selectedLog.message}"</p>
                                    </div>

                                    <div className="space-y-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">🧠 Strategic Interpretation</p>
                                        </div>
                                        <p className="text-[14px] text-slate-400 font-medium leading-relaxed italic border-l-4 border-indigo-500/30 pl-6 py-2">
                                            "{LOG_EXPLANATIONS[selectedLog.message]?.exp || 'Deep behavioral analysis confirms routine telemetry synchronization without residual anomalies.'}"
                                        </p>
                                    </div>

                                    <div className="space-y-3 px-2">
                                        <div className="flex items-center gap-2">
                                            <Layers size={14} className="text-indigo-400" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">🌐 SOURCE ORIGIN</p>
                                        </div>
                                        <p className="text-sm text-indigo-400 font-black font-mono px-6 border-l-4 border-indigo-500/30">
                                            {selectedLog.url || 'N/A (Global Context)'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-8 bg-[#0F172A] rounded-[2.5rem] border border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Risk Impact</p>
                                                <p className={`text-[11px] font-black uppercase ${LOG_EXPLANATIONS[selectedLog.message]?.status === 'Critical' ? 'text-rose-500' :
                                                    LOG_EXPLANATIONS[selectedLog.message]?.status === 'Warning' ? 'text-amber-500' : 'text-emerald-500'
                                                    }`}>
                                                    {LOG_EXPLANATIONS[selectedLog.message]?.impact || 'Negligible'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confidence Score: 99.4%</span>
                                            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-[99%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-[0.98]"
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
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}} />
        </div>
    );
};

export default AgentDetail;

