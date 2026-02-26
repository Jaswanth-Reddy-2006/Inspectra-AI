import React, { useState, useMemo } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Shield, AlertTriangle, TrendingDown, Plus,
    Target, CheckCircle, XCircle, Globe, Search, Activity
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';

const card = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 } });

const impactColors = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
const impactBgs = { Critical: '#fee2e2', High: '#fff7ed', Medium: '#fef3c7', Low: '#d1fae5' };
const areaColors = { Security: '#ef4444', Functional: '#6366f1', Performance: '#f59e0b', Visual: '#ec4899', Accessibility: '#0ea5e9', API: '#14b8a6' };
const areaBgs = { Security: '#fee2e2', Functional: '#eef2ff', Performance: '#fef3c7', Visual: '#fce7f3', Accessibility: '#e0f2fe', API: '#ccfbf1' };
const statusStyle = {
    open: { cls: 'bg-red-50 text-red-600', label: 'Open' },
    mitigated: { cls: 'bg-amber-50 text-amber-600', label: 'Mitigated' },
    closed: { cls: 'bg-green-50 text-green-600', label: 'Closed' },
};

export default function RiskAnalysis({ result }) {
    const [filter, setFilter] = useState('All');
    const { targetUrl: url } = useScanContext();
    const navigate = useNavigate();

    const riskData = useMemo(() => {
        if (!result) return null;

        const allIssues = result.pages?.flatMap(p => p.issues || []) || [];
        const items = allIssues.map((issue, i) => ({
            id: i,
            area: issue.type || 'General',
            risk: issue.message || 'Unknown violation',
            impact: issue.severity || 'Medium',
            likelihood: 'High', // Inferred for discovered issues
            score: issue.severity === 'Critical' ? 95 : issue.severity === 'High' ? 75 : 50,
            status: 'open'
        }));

        const dimensions = [
            { subject: 'Security', score: items.filter(r => r.area === 'Security').length * 20 || 0 },
            { subject: 'Performance', score: items.filter(r => r.area === 'Performance').length * 20 || 0 },
            { subject: 'Accessibility', score: items.filter(r => r.area === 'Accessibility').length * 5 || 0 },
            { subject: 'Functional', score: items.filter(r => r.area === 'Functional').length * 20 || 0 },
            { subject: 'Visual', score: items.filter(r => r.area === 'Visual').length * 20 || 0 },
            { subject: 'API', score: items.filter(r => r.area === 'API').length * 20 || 0 },
        ];

        const overall = items.length > 0 ? Math.round(items.reduce((a, b) => a + b.score, 0) / items.length) : 0;

        return { items, dimensions, overall };
    }, [result]);

    const filtered = useMemo(() => {
        if (!riskData) return [];
        return filter === 'All' ? riskData.items : riskData.items.filter(r => r.area === filter || r.status === filter.toLowerCase());
    }, [riskData, filter]);

    if (!result) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 min-h-[80vh]">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100/50">
                        <Shield size={42} className="text-red-300" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">No Risk Intelligence Found</h2>
                        <p className="text-slate-400 font-semibold text-sm leading-relaxed">
                            Risk Analysis requires active scan metadata. Initiate a comprehensive scan to generate your risk register and priority matrix.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/home')}
                        className="bg-[#ef4444] text-white px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
                    >
                        <Plus size={16} strokeWidth={3} />
                        Start New Scan
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 -mx-6 -mt-6 mb-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Risk Intelligence Registry</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Post-Scan Priority Matrix</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 mx-auto max-w-[400px] flex-1">
                    <Globe size={12} className="text-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold text-blue-700 truncate">{url || <span className="text-slate-400 italic">No active scan URL…</span>}</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-100 rounded-xl shadow-sm">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Aggregate Risk</p>
                            <p className="text-2xl font-black text-red-600 leading-none">{riskData?.overall || 0}<span className="text-xs font-semibold text-red-300">/100</span></p>
                        </div>
                        <AlertTriangle size={24} className="text-red-300" />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                        <Globe size={12} className="text-blue-500" />
                        <span className="text-[10px] font-bold text-blue-700">{url || 'No active scan'}</span>
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Open Risks', value: riskData.items.filter(r => r.status === 'open').length, color: '#ef4444', bg: '#fee2e2', icon: XCircle, sub: 'Immediate attention' },
                    { label: 'Security', value: riskData.items.filter(r => r.area === 'Security').length, color: '#f59e0b', bg: '#fef3c7', icon: Shield, sub: 'Domain threat' },
                    { label: 'Critical Path', value: riskData.items.filter(r => r.impact === 'Critical').length, color: '#7c3aed', bg: '#ede9fe', icon: Target, sub: 'Top priorities' },
                    { label: 'Analysed Nodes', value: result.totalPagesScanned, color: '#10b981', bg: '#d1fae5', icon: Globe, sub: 'Intelligence scope' },
                ].map((m, i) => (
                    <motion.div key={m.label} {...card(i)} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                            <m.icon size={22} style={{ color: m.color }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                            <p className="text-2xl font-black text-slate-900">{m.value}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase opacity-60">{m.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div {...card(4)} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <h3 className="font-black text-slate-900 text-sm mb-4 uppercase tracking-widest">Risk Profile</h3>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={riskData.dimensions}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b', fontWeight: 900 }} />
                                <Radar name="Risk" dataKey="score" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.6} strokeWidth={3} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div {...card(7)} className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Risk Register</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Interactive Priority Matrix</p>
                        </div>
                        <div className="flex gap-2">
                            {['All', 'Security', 'Accessibility', 'open'].map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    {['Domain', 'Violation / Risk', 'Impact', 'Score', 'Status'].map(h => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No matching risks found</td></tr>
                                ) : (
                                    filtered.sort((a, b) => b.score - a.score).map((r, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ background: areaBgs[r.area] || '#f1f5f9', color: areaColors[r.area] || '#64748b' }}>{r.area}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-xs font-bold text-slate-700 leading-relaxed max-w-sm">{r.risk}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ background: impactBgs[r.impact] || '#f1f5f9', color: impactColors[r.impact] || '#64748b' }}>{r.impact}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score >= 75 ? '#ef4444' : '#f59e0b' }} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-900">{r.score}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                    UNRESOLVED
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
