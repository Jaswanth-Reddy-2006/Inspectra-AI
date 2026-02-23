import React from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Clock, Activity, AlertCircle } from 'lucide-react';

const AgentExecutionPanel = ({ agents }) => {
    if (!agents || agents.length === 0) return null;

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'running': return <Activity size={16} className="text-blue-500 animate-pulse" />;
            case 'partial': return <AlertCircle size={16} className="text-amber-500" />;
            default: return <Clock size={16} className="text-slate-300" />;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'running': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'partial': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Bot size={20} className="text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">Multi-Agent Intelligence Panel</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Autonomous Workflow</p>
                </div>
            </div>

            <div className="space-y-3">
                {agents.map((agent, index) => (
                    <motion.div
                        key={agent.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 transition-all"
                    >
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                            <div className="shrink-0">{getStatusIcon(agent.status)}</div>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-slate-700 truncate">{agent.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Captured {agent.count} {agent.name.includes('Discovery') ? 'pages' : 'findings'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {agent.time > 1000 ? `${(agent.time / 1000).toFixed(1)}s` : `${agent.time}ms`}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${getStatusBadge(agent.status)}`}>
                                {agent.status}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default AgentExecutionPanel;
