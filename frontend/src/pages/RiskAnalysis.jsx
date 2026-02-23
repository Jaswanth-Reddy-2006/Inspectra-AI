import React, { useState } from 'react';
import { useTargetUrl } from '../context/UrlContext';
import { motion } from 'framer-motion';
import {
    Shield, AlertTriangle, TrendingDown,
    Target, CheckCircle, XCircle, Globe, Search
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';

const card = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 } });

const RISK_DIMENSIONS = [
    { subject: 'Security', score: 44 }, { subject: 'Performance', score: 72 },
    { subject: 'Accessibility', score: 68 }, { subject: 'Functional', score: 56 },
    { subject: 'Visual', score: 80 }, { subject: 'API', score: 52 },
];

const RISK_TREND = [
    { day: 'Feb 17', score: 62 }, { day: 'Feb 18', score: 58 }, { day: 'Feb 19', score: 65 },
    { day: 'Feb 20', score: 54 }, { day: 'Feb 21', score: 60 }, { day: 'Feb 22', score: 49 },
    { day: 'Feb 23', score: 47 },
];

const RISK_ITEMS = [
    { area: 'Security', risk: 'Admin route accessible without auth', impact: 'Critical', likelihood: 'High', score: 96, status: 'open' },
    { area: 'Security', risk: 'Session token exposed in URL params', impact: 'Critical', likelihood: 'Medium', score: 88, status: 'open' },
    { area: 'Security', risk: 'Missing CSRF on login form', impact: 'High', likelihood: 'High', score: 81, status: 'open' },
    { area: 'Functional', risk: 'Report generation timeout (>30s)', impact: 'High', likelihood: 'Medium', score: 72, status: 'open' },
    { area: 'API', risk: 'Unauthenticated debug endpoint exposed', impact: 'Critical', likelihood: 'Low', score: 68, status: 'open' },
    { area: 'Performance', risk: 'Analytics page TTI > 3.4s', impact: 'Medium', likelihood: 'High', score: 55, status: 'mitigated' },
    { area: 'Accessibility', risk: '12 images missing alt text', impact: 'Medium', likelihood: 'High', score: 48, status: 'open' },
    { area: 'Visual', risk: 'Checkout layout broken on mobile', impact: 'High', likelihood: 'Medium', score: 45, status: 'open' },
    { area: 'Functional', risk: 'User list filter not persisting state', impact: 'Low', likelihood: 'High', score: 32, status: 'mitigated' },
    { area: 'Visual', risk: 'Dashboard font weight inconsistency', impact: 'Low', likelihood: 'Low', score: 18, status: 'closed' },
];

const AREA_CHART = [
    { area: 'Security', critical: 3, high: 1, medium: 0 },
    { area: 'Functional', critical: 0, high: 1, medium: 1 },
    { area: 'Performance', critical: 0, high: 0, medium: 1 },
    { area: 'Visual', critical: 0, high: 1, medium: 1 },
    { area: 'Accessibility', critical: 0, high: 0, medium: 1 },
    { area: 'API', critical: 1, high: 0, medium: 0 },
];

const impactColors = { Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#10b981' };
const impactBgs = { Critical: '#fee2e2', High: '#fff7ed', Medium: '#fef3c7', Low: '#d1fae5' };
const areaColors = { Security: '#ef4444', Functional: '#6366f1', Performance: '#f59e0b', Visual: '#ec4899', Accessibility: '#0ea5e9', API: '#14b8a6' };
const areaBgs = { Security: '#fee2e2', Functional: '#eef2ff', Performance: '#fef3c7', Visual: '#fce7f3', Accessibility: '#e0f2fe', API: '#ccfbf1' };
const statusStyle = {
    open: { cls: 'bg-red-50 text-red-600', label: 'Open' },
    mitigated: { cls: 'bg-amber-50 text-amber-600', label: 'Mitigated' },
    closed: { cls: 'bg-green-50 text-green-600', label: 'Closed' },
};

const overallRisk = Math.round(RISK_ITEMS.reduce((a, b) => a + b.score, 0) / RISK_ITEMS.length);

export default function RiskAnalysis() {
    const [filter, setFilter] = useState('All');
    const { targetUrl: url } = useTargetUrl();
    const filtered = filter === 'All' ? RISK_ITEMS : RISK_ITEMS.filter(r => r.area === filter || r.status === filter.toLowerCase());

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={20} className="text-red-500" />
                </div>
                <div className="shrink-0">
                    <h2 className="text-xl font-black text-slate-900">Risk Analysis</h2>
                    <p className="text-sm text-slate-400">Overall risk posture · Threat modeling · Priority matrix · Trend tracking</p>
                </div>

                {/* URL Input */}
                <div className="flex items-center flex-1 min-w-[220px] gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                    <Globe size={13} className="text-slate-400 shrink-0" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://your-app.com"
                        className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none font-medium"
                    />
                    {url && <button onClick={() => setUrl('')} className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>}
                    <button className="ml-1 bg-red-500 hover:bg-red-600 text-white rounded-lg px-2.5 py-1 text-xs font-black transition-all flex items-center gap-1">
                        <Search size={10} /> Analyze
                    </button>
                </div>

                {/* Overall Risk Score */}
                <div className="flex items-center gap-3 px-5 py-3 bg-red-50 rounded-2xl border border-red-100 shrink-0">
                    <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-wider">Overall Risk Score</p>
                        <p className="text-3xl font-black text-red-600">{overallRisk}<span className="text-sm font-semibold text-red-300">/100</span></p>
                    </div>
                    <AlertTriangle size={28} className="text-red-300" />
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Open Risks', value: RISK_ITEMS.filter(r => r.status === 'open').length, color: '#ef4444', bg: '#fee2e2', icon: XCircle, sub: 'Require action' },
                    { label: 'Mitigated', value: RISK_ITEMS.filter(r => r.status === 'mitigated').length, color: '#f59e0b', bg: '#fef3c7', icon: Shield, sub: 'In progress' },
                    { label: 'Closed', value: RISK_ITEMS.filter(r => r.status === 'closed').length, color: '#10b981', bg: '#d1fae5', icon: CheckCircle, sub: 'Resolved' },
                    { label: 'Critical Risks', value: RISK_ITEMS.filter(r => r.impact === 'Critical').length, color: '#7c3aed', bg: '#ede9fe', icon: Target, sub: 'Immediate action' },
                ].map((m, i) => (
                    <motion.div key={m.label} {...card(i)} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: m.bg }}>
                            <m.icon size={22} style={{ color: m.color }} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
                            <p className="text-2xl font-black text-slate-900">{m.value}</p>
                            <p className="text-[11px] text-slate-400">{m.sub}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Radar */}
                <motion.div {...card(4)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Risk by Dimension</h3>
                    <ResponsiveContainer width="100%" height={210}>
                        <RadarChart data={RISK_DIMENSIONS}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                            <Radar name="Risk" dataKey="score" stroke="#ef4444" fill="#fee2e2" fillOpacity={0.5} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Trend */}
                <motion.div {...card(5)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Risk Score Trend</h3>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={14} className="text-green-500" />
                        <span className="text-xs font-bold text-green-600">Improving — down 15pts this week</span>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                        <AreaChart data={RISK_TREND}>
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[30, 80]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                            <Area type="monotone" dataKey="score" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} name="Risk Score" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Area chart */}
                <motion.div {...card(6)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Risks by Area</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={AREA_CHART} layout="vertical" barSize={10} barGap={3}>
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="area" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} width={72} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                            <Bar dataKey="critical" fill="#ef4444" radius={[0, 4, 4, 0]} name="Critical" stackId="a" />
                            <Bar dataKey="high" fill="#f97316" radius={[0, 4, 4, 0]} name="High" stackId="a" />
                            <Bar dataKey="medium" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Medium" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Risk Register */}
            <motion.div {...card(7)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <h3 className="font-black text-slate-900 text-sm">Risk Register</h3>
                    <div className="flex gap-2 flex-wrap">
                        {['All', 'Security', 'API', 'Functional', 'open', 'mitigated', 'closed'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors capitalize ${filter === f ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                {['Area', 'Risk', 'Impact', 'Likelihood', 'Risk Score', 'Status'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.sort((a, b) => b.score - a.score).map((r, i) => {
                                const ss = statusStyle[r.status];
                                return (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ background: areaBgs[r.area], color: areaColors[r.area] }}>{r.area}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-700 max-w-[240px]">{r.risk}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded-md text-xs font-black" style={{ background: impactBgs[r.impact], color: impactColors[r.impact] }}>{r.impact}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-500">{r.likelihood}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-100 h-1.5 rounded-full">
                                                    <div className="h-1.5 rounded-full" style={{ width: `${r.score}%`, background: r.score >= 75 ? '#ef4444' : r.score >= 50 ? '#f59e0b' : '#10b981' }} />
                                                </div>
                                                <span className="text-xs font-black text-slate-700">{r.score}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${ss.cls}`}>{ss.label}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
