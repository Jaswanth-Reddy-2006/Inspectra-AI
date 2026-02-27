import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu, Zap, Activity, CheckCircle2,
    Clock, Database, Search, ArrowUpRight
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useScanContext } from '../context/ScanContext';

// --- Constants & Types ---

const AGENT_TYPES = {
    CRAWLER: 'CRAWLER',
    AUDIT: 'AUDIT',
    SECURITY: 'SECURITY',
    INTELLIGENCE: 'INTELLIGENCE'
};

const SEVERITIES = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL'
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
        exp: 'A route exists in the system but is not linked from any navigation path. This occurred because a page was created without a link. While not immediate dangerous, it can lead to security "ghost" pages. Action: Review navigation config or delete obsolete route.',
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
        exp: 'An HTML element has an ARIA role that conflicts with its semantic purpose. This happens due to incorrect attribute usage. It is not dangerous but causes UX friction for screen readers. Action: Fix ARIA role to match element type.',
        status: 'Warning',
        forensic: 'Semantic dissonance detected between <button> tag and "link" role. Conflict at line 442 in Layout.jsx prevents screen-reader clarity.',
        mitigation: 'Synchronize HTML tag with intended ARIA role or use semantic native elements.',
        impact: 'Medium - Compromises accessibility compliance (WCAG 2.1).'
    },
    'DOM nesting depth violation': {
        exp: 'The document structure is too deep. This happens when components are wrapped excessively. It is not dangerous but degrades mobile performance. Action: Flatten the component hierarchy.',
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
        exp: 'An incoming data packet contains patterns matching known browser exploits. This happens during automated bot probes. It is potentially dangerous if unblocked. Action: Monitor origin IP for escalation.',
        status: 'Warning',
        forensic: 'Signature match detected for "sql-injection-probe-v1" in GET parameters. Anomaly score: 78%. Payload dropped at application firewall layer.',
        mitigation: 'Blacklist source IP range for 24h and enable strict schema validation on affected endpoints.',
        impact: 'High - Attempted probe of database vulnerability surface.'
    },
    'Cross-Origin violation': {
        exp: 'A script attempted to access a resource from an unapproved domain. This happens during "Man-in-the-Middle" or XSS attempts. This is dangerous. Action: Trace origin script and revoke token.',
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
        exp: 'Standard rules are no longer producing predictable results. This happens when the application environment changes rapidly. It represents a moderate stability risk. Action: Recalibrate agent thresholds.',
        status: 'Warning',
        forensic: 'Behavioral variance detected in pattern matching engine. Success rate dropped from 99% to 84%. Likely due to rapid DOM mutation patterns.',
        mitigation: 'Retrain heuristic weights for the Intelligence node to account for new dynamic layout patterns.',
        impact: 'Medium - Risk of increased false-positive triggers.'
    },
    'Rapid credential stuffing attempt blocked': {
        exp: 'Multiple automated login attempts were detected and neutralized. This happens during brute-force attacks. This is dangerous behavior that was successfully mitigated. Action: Block source IP range.',
        status: 'Critical',
        forensic: 'Brute-force pattern identified: 45 login attempts from same IP in 1.2s. Origin trace: Data center IP range in "Cluster-B". MFA was triggered correctly.',
        mitigation: 'Permanently block source CIDR and implement account lockout delay for successive failures.',
        impact: 'Critical - Active attempt to compromise user account integrity.'
    },
    'Swarm autonomous defense activated: Lowering tolerance thresholds.': {
        exp: 'The system identified an active threat and automatically tightened security rules. This happens in response to critical breaches. This is an emergency state. Action: Monitor system recovery.',
        status: 'Critical',
        forensic: 'High-alert state triggered by Cross-Origin violation and consecutive payload anomalies. System throttled external API throughput by 50%.',
        mitigation: 'Keep high-alert state active until manual review of "Cluster-X" logs is completed.',
        impact: 'High - Protected state initiated to prevent data leak.'
    },
    'Defense protocol deactivated: System status nominal.': {
        exp: 'The threat has been neutralized, and the swarm is returning to standard monitoring mode. This is routine recovery activity.',
        status: 'Normal',
        forensic: 'Anomalous signal frequency dropped to 0% for 6 cycles. Tolerance thresholds restored to baseline values.',
        mitigation: 'Resume passive monitoring. No residual threats identified.',
        impact: 'Low - Return to nominal operation.'
    },
    'SYSTEM': {
        exp: 'Core system heartbeat and orchestration signals. This is routine system activity.',
        status: 'Normal',
        forensic: 'System kernel operating within nominal parameters. Heartbeat synchronization confirmed across all distributed nodes.',
        mitigation: 'No action required.',
        impact: 'Low - Core status.'
    }
};

const INITIAL_AGENTS = [
    { id: AGENT_TYPES.CRAWLER, name: 'Crawler Agent', desc: 'Navigates DOM structures independently.', color: 'emerald', status: 'Online' },
    { id: AGENT_TYPES.AUDIT, name: 'Audit Agent', desc: 'Validates code hygiene and WCAG.', color: 'blue', status: 'Online' },
    { id: AGENT_TYPES.SECURITY, name: 'Security Agent', desc: 'Monitors payload signatures.', color: 'amber', status: 'Standby' },
    { id: AGENT_TYPES.INTELLIGENCE, name: 'Intelligence Node', desc: 'Aggregates decision logic.', color: 'indigo', status: 'Online' }
];

const createMockEvent = (agent, isHighAlert) => {
    const events = {
        [AGENT_TYPES.CRAWLER]: [
            { msg: 'Mapping /node/*', sev: SEVERITIES.INFO, confidence: 98 },
            { msg: 'Asset cache synchronized', sev: SEVERITIES.INFO, confidence: 99 },
            { msg: 'Orphaned route detected', sev: SEVERITIES.WARNING, confidence: 88 }
        ],
        [AGENT_TYPES.AUDIT]: [
            { msg: 'Heuristic Validation', sev: SEVERITIES.INFO, confidence: 95 },
            { msg: 'Implicit ARIA role mismatch', sev: SEVERITIES.WARNING, confidence: 86 },
            { msg: 'DOM nesting depth violation', sev: SEVERITIES.WARNING, confidence: 92 }
        ],
        [AGENT_TYPES.SECURITY]: [
            { msg: 'Flow Integrity Scan', sev: SEVERITIES.INFO, confidence: 97 },
            { msg: 'Suspicious payload signature', sev: SEVERITIES.WARNING, confidence: 82 },
            { msg: 'Cross-Origin violation', sev: SEVERITIES.CRITICAL, confidence: 91 }
        ],
        [AGENT_TYPES.INTELLIGENCE]: [
            { msg: 'Risk Surface Calculation', sev: SEVERITIES.INFO, confidence: 99 },
            { msg: 'Aggregated telemetry', sev: SEVERITIES.INFO, confidence: 100 },
            { msg: 'Heuristic drift detected', sev: SEVERITIES.WARNING, confidence: 89 }
        ]
    };

    const pool = events[agent];
    let event = pool[Math.floor(Math.random() * pool.length)];

    if (isHighAlert && agent === AGENT_TYPES.SECURITY && Math.random() > 0.85) {
        event = { msg: 'Rapid credential stuffing attempt blocked', sev: SEVERITIES.CRITICAL, confidence: 99 };
    }
    return event;
};

const AgentCard = React.memo(({ agent, onClick, isHighAlert }) => {
    const isOnline = agent.status === 'Online';
    const isIdle = agent.status === 'Idle';
    const isDegraded = agent.latency > 500;


    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
                opacity: 1,
                scale: 1,
                borderColor: agent.error ? 'rgba(239, 68, 68, 0.4)' : (isDegraded ? 'rgba(245, 158, 11, 0.3)' : 'rgba(241, 245, 249, 0.8)'),
                boxShadow: isDegraded || isHighAlert ? '0 10px 40px -10px rgba(99, 102, 241, 0.12)' : '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
            }}
            whileHover={{ y: -5, boxShadow: '0 20px 50px -12px rgba(99, 102, 241, 0.15)' }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            onClick={() => onClick(agent)}
            className="group relative bg-[#1E293B]/80 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-sm cursor-pointer flex flex-col justify-between h-full overflow-hidden transition-all"
        >
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-10 transition-colors duration-1000 ${agent.error ? 'bg-rose-500' : agent.color === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${agent.error ? 'bg-rose-50 text-rose-600 shadow-lg shadow-rose-100' :
                        agent.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-100' :
                            agent.color === 'blue' ? 'bg-blue-50 text-blue-600 shadow-lg shadow-blue-100' :
                                agent.color === 'amber' ? 'bg-amber-50 text-amber-600 shadow-lg shadow-amber-100' :
                                    'bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-100'
                        }`}>
                        <Cpu size={28} className={isOnline && !isIdle ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex flex-col items-end">
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-300 tracking-tight leading-none mb-2 group-hover:text-indigo-600 transition-colors">{agent.name}</h3>
                    <p className="text-[12px] font-medium text-slate-400 leading-relaxed">{agent.desc}</p>
                </div>


                <div className="space-y-6 pt-6 border-t border-slate-50/60">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observable Trace</span>
                        </div>
                        <p className="text-[13px] font-bold text-slate-400 italic leading-snug line-clamp-2 min-h-[36px] bg-[#1E293B]/50 p-3 rounded-2xl border border-slate-50">
                            "{LOG_EXPLANATIONS[agent.task]?.exp || agent.task}"
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Processing Load</span>
                            <span className="text-slate-300">{agent.cpu}%</span>
                        </div>
                        <div className="h-2 w-full bg-[#1E293B]/50 rounded-full overflow-hidden p-[2px]">
                            <motion.div
                                animate={{ width: `${agent.cpu}%` }}
                                className={`h-full rounded-full shadow-sm ${agent.cpu > 80 ? 'bg-rose-500' :
                                    agent.color === 'emerald' ? 'bg-emerald-500' :
                                        agent.color === 'blue' ? 'bg-blue-500' :
                                            agent.color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
                                    }`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50/60 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3 group/signals">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center transition-transform group-hover/signals:scale-110">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-300 leading-none">{agent.completed}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Decisions</span>
                    </div>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#1E293B] hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center group/btn">
                    <ArrowUpRight size={18} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                </button>
            </div>
        </motion.div>
    );
});

const AIAgents = () => {
    const { isScanning: globalScanning, scanResult } = useScanContext();

    const [adapter, setAdapter] = useState('MOCK');
    const [agents, setAgents] = useState(() => {
        try {
            const saved = localStorage.getItem('inspectra_swarm_v3_agents');
            const parsed = saved ? JSON.parse(saved) : null;
            return Array.isArray(parsed) ? parsed : INITIAL_AGENTS.map(a => ({
                ...a, task: 'Orchestrating...', completed: 0, cpu: 15, latency: 110, lastActive: Date.now(), queue: 0, error: false
            }));
        } catch (e) {
            return INITIAL_AGENTS.map(a => ({
                ...a, task: 'Orchestrating...', completed: 0, cpu: 15, latency: 110, lastActive: Date.now(), queue: 0, error: false
            }));
        }
    });

    const [logs, setLogs] = useState(() => {
        try {
            const saved = localStorage.getItem('inspectra_swarm_v3_logs');
            const parsed = saved ? JSON.parse(saved) : null;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });

    const [isPaused, setIsPaused] = useState(false);
    const [stabilityIndex, setStabilityIndex] = useState(() => {
        try {
            const saved = localStorage.getItem('inspectra_stability_index');
            const parsed = saved ? JSON.parse(saved) : null;
            return typeof parsed === 'number' ? parsed : null;
        } catch (e) {
            return null;
        }
    });
    const [signals, setSignals] = useState([]);

    const [recentCriticals, setRecentCriticals] = useState(0);
    const [isHighAlert, setIsHighAlert] = useState(false);
    const [totalSigsToday, setTotalSigsToday] = useState(0);

    const [behaviorState, setBehaviorState] = useState('Stable');
    const [history, setHistory] = useState([]);

    const navigate = useNavigate();
    const simulateTimerRef = useRef(null);
    const lastLogRef = useRef({ time: 0, msg: '' });

    const triggerSignal = useCallback((from, to) => {
        const id = Math.random();
        setSignals(prev => [...prev, { id, from, to }]);
        setTimeout(() => setSignals(prev => prev.filter(s => s.id !== id)), 800);
    }, []);

    const addLog = useCallback((agent, severity, message, url = null, context = null) => {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        setLogs(prev => {
            if (prev.length > 0 && prev[0].agent === agent && prev[0].message === message) {
                const updated = [...prev];
                updated[0] = { ...updated[0], count: (updated[0].count || 1) + 1, timestamp, url: url || updated[0].url, context: context || updated[0].context };
                return updated;
            }
            return [{ id: Math.random(), timestamp, agent, severity, message, url, context, count: 1 }, ...prev].slice(0, 500);
        });

        if (severity === SEVERITIES.CRITICAL) {
            setRecentCriticals(c => c + 1);
            setTimeout(() => setRecentCriticals(c => Math.max(0, c - 1)), 25000);
        }
        setTotalSigsToday(c => c + 1);
    }, []);

    const handleCardClick = useCallback((id) => {
        const agentId = typeof id === 'object' ? id.id : id;
        navigate(`/agents/detail/${agentId}`);
    }, [navigate]);

    const calculateStability = useCallback((currentAgents) => {
        const totalCpu = currentAgents.reduce((sum, a) => sum + a.cpu, 0);
        const criticals = currentAgents.filter(a => a.error).length;
        const healthFactor = (currentAgents.filter(a => !a.error).length / currentAgents.length) * 50;
        const loadFactor = (1 - (totalCpu / (currentAgents.length * 100))) * 30;
        const anomalyFactor = Math.max(0, 20 - (criticals * 10));
        return Math.max(0, Math.min(100, Math.round(healthFactor + loadFactor + anomalyFactor)));
    }, []);

    const runSimulationStep = useCallback(() => {
        if (isPaused) return;
        const agentIdx = Math.floor(Math.random() * INITIAL_AGENTS.length);
        const agentId = INITIAL_AGENTS[agentIdx].id;
        const event = createMockEvent(agentId, isHighAlert);
        const isRoutine = event.sev === SEVERITIES.INFO;
        const now = Date.now();

        if (now - lastLogRef.current.time > 1000 || lastLogRef.current.msg !== event.msg) {
            const mockUrl = `/app/${Math.random().toString(36).substring(7)}`;
            const mockSelector = `div > button#act-${Math.floor(Math.random() * 100)}`;
            addLog(agentId, event.sev, event.msg, mockUrl, mockSelector);
            lastLogRef.current = { time: now, msg: event.msg };
            if (agentId !== AGENT_TYPES.INTELLIGENCE) triggerSignal(agentId, AGENT_TYPES.INTELLIGENCE);
        }

        setAgents(prev => {
            const next = prev.map((a) => {
                if (a.id === agentId) {
                    return {
                        ...a,
                        task: event.msg,
                        completed: a.completed + (isRoutine ? 1 : 0),
                        cpu: Math.floor(Math.random() * 20) + (isHighAlert ? 45 : 10),
                        latency: Math.floor(Math.random() * 100) + 90 + (isHighAlert ? 150 : 0),
                        lastActive: now,
                        error: event.sev === SEVERITIES.CRITICAL && event.confidence > 90,
                        status: 'Online'
                    };
                }
                return a;
            });
            const newStability = calculateStability(next);
            setStabilityIndex(newStability);
            return next;
        });
    }, [isPaused, isHighAlert, addLog, triggerSignal, calculateStability]);

    useEffect(() => {
        if (!globalScanning) return;
        const interval = setInterval(runSimulationStep, isHighAlert ? 1500 : 2500);
        return () => clearInterval(interval);
    }, [runSimulationStep, isHighAlert, globalScanning]);

    useEffect(() => {
        const activeCriticals = agents.filter(a => a.error).length;
        const securityBreach = (logs || []).some(l =>
            l.severity === SEVERITIES.CRITICAL &&
            (l.message?.toLowerCase().includes('credential') || l.message?.toLowerCase().includes('cross-origin'))
        );

        if ((activeCriticals >= 2 || securityBreach) && !isHighAlert) {
            setIsHighAlert(true);
            addLog('SYSTEM', SEVERITIES.CRITICAL, 'Swarm autonomous defense activated: Lowering tolerance thresholds.');
        } else if (activeCriticals === 0 && !securityBreach && isHighAlert) {
            setIsHighAlert(false);
            addLog('SYSTEM', SEVERITIES.INFO, 'Defense protocol deactivated: System status nominal.');
        }
    }, [agents, logs, isHighAlert, addLog]);

    useEffect(() => {
        if (globalScanning) {
            setAgents(INITIAL_AGENTS.map(a => ({
                ...a, task: 'Initialising swarm trace...', completed: 0, cpu: 15, latency: 110, lastActive: Date.now(), queue: 0, error: false
            })));
            setLogs([]);
        }
    }, [globalScanning]);

    useEffect(() => {
        localStorage.setItem('inspectra_swarm_v3_agents', JSON.stringify(agents));
        localStorage.setItem('inspectra_swarm_v3_logs', JSON.stringify(logs));
        if (stabilityIndex !== null) {
            localStorage.setItem('inspectra_stability_index', JSON.stringify(stabilityIndex));
        }
    }, [agents, logs, stabilityIndex]);

    useEffect(() => {
        if (scanResult?.issuesSummary) {
            const summary = scanResult.issuesSummary;
            setStabilityIndex(summary.stabilityIndex);

            const timestamp = new Date().toLocaleTimeString([], { hour12: false });
            const scanLogs = [];

            // 1. Crawler Discoveries
            if (Array.isArray(scanResult.pages)) {
                scanResult.pages.forEach(p => {
                    scanLogs.push({
                        id: Math.random(),
                        timestamp,
                        agent: AGENT_TYPES.CRAWLER,
                        severity: SEVERITIES.INFO,
                        message: 'Mapping /node/*',
                        url: p.url,
                        context: 'Discovery Mapping',
                        count: 1
                    });
                });

                // 2. Audit/Security Issues
                scanResult.pages.forEach(p => {
                    (p.issues || []).forEach(issue => {
                        const isCritical = issue.severity?.toLowerCase() === 'critical';
                        const agent = isCritical ? AGENT_TYPES.SECURITY : AGENT_TYPES.AUDIT;
                        scanLogs.push({
                            id: Math.random(),
                            timestamp,
                            agent,
                            severity: (issue.severity || 'INFO').toUpperCase(),
                            message: issue.msg || 'Anomaly detected',
                            url: p.url || '/',
                            context: issue.context || issue.selector || 'DOM Root',
                            count: 1
                        });
                    });
                });
            }

            // 3. Intelligence Synthesis
            scanLogs.push({
                id: Math.random(),
                timestamp,
                agent: AGENT_TYPES.INTELLIGENCE,
                severity: SEVERITIES.INFO,
                message: 'Risk Surface Calculation',
                url: scanResult.targetUrl || '/',
                context: 'Swarm Consensus',
                count: 1
            });

            scanLogs.push({
                id: Math.random(),
                timestamp,
                agent: AGENT_TYPES.INTELLIGENCE,
                severity: SEVERITIES.INFO,
                message: 'Aggregated telemetry',
                url: scanResult.targetUrl || '/',
                context: 'Telemetry Node',
                count: 1
            });

            if (scanLogs.length > 0) {
                setLogs(prev => [...scanLogs, ...(prev || [])].slice(0, 500));
            }

            setAgents(prev => (prev || []).map(a => {
                let completed = a.completed;
                let task = a.task;
                let error = a.error;

                if (a.id === AGENT_TYPES.CRAWLER) {
                    completed = scanResult.pages?.length || 0;
                    task = "Autonomous discovery mapping complete.";
                } else if (a.id === AGENT_TYPES.AUDIT) {
                    completed = (summary.stats?.high || 0) + (summary.stats?.medium || 0);
                    task = "Structural & accessibility hygiene verified.";
                } else if (a.id === AGENT_TYPES.SECURITY) {
                    completed = summary.stats?.critical || 0;
                    task = "Payload signatures and flow integrity verified.";
                    error = (summary.stats?.critical || 0) > 0;
                } else if (a.id === AGENT_TYPES.INTELLIGENCE) {
                    completed = summary.stats?.totalDefects || 0;
                    task = "Swarm consensus reached. Monitoring nominal.";
                }

                return { ...a, completed, task, cpu: 5, latency: 120, error, status: 'Online' };
            }));
            setTotalSigsToday(summary.stats?.totalDefects || 0);
        }
    }, [scanResult, addLog]);

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-300 font-sans selection:bg-blue-500/30 flex flex-col">
            {/* Top Trace Strip */}
            <div className="h-10 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between px-6 text-[11px] font-mono text-slate-500 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-4">
                    <span>Path: /intelligence-hub/ai-swarm</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                    <span className="text-indigo-400">SWARM SYNCHRONIZED</span>
                </div>
            </div>

            <div className="max-w-[1600px] w-full mx-auto p-6 md:p-8 flex-1 flex flex-col gap-8 min-h-0 overflow-hidden relative">
                {/* Page Identity */}
                <div className="flex flex-col mb-2 shrink-0 text-left relative z-10">
                    <h1 className="text-3xl font-semibold text-slate-300 uppercase tracking-widest leading-none">AI AGENTS</h1>
                    <p className="text-[13px] font-mono text-slate-500 mt-2">Autonomous Swarm Observation & Intelligence Node</p>
                </div>

                {/* Ambient Animated Grid */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>

                {/* Neural Signal Interface (Visual Overlays) */}
                <div className="fixed inset-0 pointer-events-none z-30">
                    <AnimatePresence>
                        {signals.map(s => (
                            <motion.div
                                key={s.id}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                exit={{ opacity: 0 }}
                                className="absolute bg-indigo-500/20 rounded-full blur-xl w-32 h-32"
                                style={{
                                    left: `${30 + Math.random() * 40}%`,
                                    top: `${30 + Math.random() * 40}%`
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Agent Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10">
                    {agents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            isHighAlert={isHighAlert}
                            onClick={() => handleCardClick(agent.id)}
                        />
                    ))}
                </div>

                {/* System Health Trace HUD */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 px-10 py-8 bg-[#1E293B]/60 backdrop-blur-3xl border border-slate-800 shadow-2xl rounded-[3rem] mt-auto">
                    <div className="flex items-center gap-12 w-full lg:w-auto">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-2xl ${stabilityIndex > 80 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                                    <Activity size={20} className={globalScanning ? 'animate-pulse' : ''} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Swarm Stability Index</span>
                                    <span className={`text-xl font-black ${stabilityIndex === null ? 'text-slate-400' : stabilityIndex > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {globalScanning ? 'Synchronizing Swarm...' : (stabilityIndex !== null ? `${stabilityIndex}%` : 'Standby')}
                                    </span>
                                </div>
                            </div>
                            <div className="w-[180px] h-2 bg-[#0F172A] rounded-full overflow-hidden p-0.5 border border-slate-800">
                                <motion.div
                                    animate={{
                                        width: globalScanning ? '100%' : `${stabilityIndex || 0}%`,
                                        opacity: globalScanning ? [0.4, 1, 0.4] : 1
                                    }}
                                    transition={globalScanning ? { duration: 1.5, repeat: Infinity } : { duration: 0.8, ease: "circOut" }}
                                    className={`h-full rounded-full shadow-lg ${globalScanning ? 'bg-indigo-400' :
                                        stabilityIndex > 80 ? 'bg-emerald-500' : stabilityIndex > 50 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                />
                            </div>
                        </div>

                        <div className="w-px h-12 bg-slate-800 hidden lg:block" />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-12">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Nodes</p>
                                <p className="text-2xl font-black text-slate-300 tracking-tighter tabular-nums">
                                    {agents.filter(a => a.status === 'Online').length}<span className="text-slate-500 text-lg font-medium">/04</span>
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Flux</p>
                                <p className="text-2xl font-black text-indigo-500 tracking-tighter tabular-nums">{totalSigsToday}</p>
                            </div>
                            <div className="space-y-1 hidden sm:block">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mem Pressure</p>
                                <p className="text-2xl font-black text-slate-300 tracking-tighter tabular-nums">1.2<span className="text-slate-500 text-lg font-medium">GB</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Intent</p>
                                <p className={`text-sm font-black uppercase tracking-widest ${isHighAlert ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {isHighAlert ? 'Active Defense' : 'Passive Observation'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-auto flex items-center gap-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-10">
                        <div className="flex flex-col gap-1">
                            <span>Kernel: <span className="text-slate-300">v4.0.2</span></span>
                            <span>Latency: <span className="text-slate-300">14ms</span></span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span>Synapse: <span className="text-slate-300">Active</span></span>
                            <span>Uptime: <span className="text-slate-300">99.9%</span></span>
                        </div>
                    </div>
                </div>

                {/* VERSION TRACE FOOTER */}
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-600 uppercase tracking-widest shrink-0">
                    <span>Inspectra Swarm Platform</span>
                    <div className="flex gap-6">
                        <span>Engine v2.1</span>
                        <span>Heuristic v1.8</span>
                        <span>Logic Layer v3.2</span>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
                @keyframes orbit { from { transform: rotate(0deg) translateX(20px) rotate(0deg); } to { transform: rotate(360deg) translateX(20px) rotate(-360deg); } }
                .animate-orbit { animation: orbit 10s linear infinite; }
            ` }} />
        </div>

    );
};

export default AIAgents;
