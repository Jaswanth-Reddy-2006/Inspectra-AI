import React from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Clock, Zap, CheckCircle2 } from 'lucide-react';

export const ScoreCard = ({ score }) => {
    const getColor = (s) => {
        if (s >= 90) return 'text-emerald-500';
        if (s >= 80) return 'text-blue-500';
        return 'text-orange-500';
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                <Shield size={120} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Overall Health Score</p>
            <div className="flex items-end gap-2">
                <span className={`text-7xl font-black leading-none tracking-tighter ${getColor(score)}`}>{score}</span>
                <span className="text-2xl font-black text-slate-300 mb-2">/100</span>
            </div>
            <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-20" />
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Verified</p>
            </div>
        </div>
    );
};

export const SeverityChart = ({ summary }) => {
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Severity Distribution</h4>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Intensity</span>
                </div>
            </div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(summary.critical / total) * 100}%` }} />
                <div className="h-full bg-orange-500 transition-all" style={{ width: `${(summary.high / total) * 100}%` }} />
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${(summary.medium / total) * 100}%` }} />
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${(summary.low / total) * 100}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-4 mt-8">
                {Object.entries(summary).map(([key, val]) => (
                    <div key={key}>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                        <p className="text-lg font-black text-slate-900">{val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PageTable = ({ pages }) => {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-white overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Page URL</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issues</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Load Time</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {pages.map((page, i) => (
                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
                                        <Zap size={14} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{page.url}</span>
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <div className="flex gap-1.5">
                                    {page.issues.map((iss, j) => (
                                        <div key={j} className={`w-2 h-6 rounded-full ${iss.severity === 'critical' ? 'bg-red-200' :
                                                iss.severity === 'high' ? 'bg-orange-200' : 'bg-amber-200'
                                            }`} title={iss.type} />
                                    ))}
                                </div>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-sm font-black text-slate-900">{page.loadTime}ms</span>
                            </td>
                            <td className="px-8 py-6">
                                {page.score >= 90 ? (
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <CheckCircle2 size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Optimized</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-orange-500">
                                        <AlertCircle size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Action Needed</span>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
