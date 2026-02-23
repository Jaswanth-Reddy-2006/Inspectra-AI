import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Zap, Eye, TrendingUp, Clock, AlertTriangle, CheckCircle,
    Monitor, Smartphone, Tablet, Activity, BarChart2
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';

const card = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 } });

const VITALS = [
    { metric: 'LCP', label: 'Largest Contentful Paint', value: '1.8s', score: 89, target: '<2.5s', status: 'good' },
    { metric: 'FID', label: 'First Input Delay', value: '28ms', score: 95, target: '<100ms', status: 'good' },
    { metric: 'CLS', label: 'Cumulative Layout Shift', value: '0.08', score: 81, target: '<0.1', status: 'good' },
    { metric: 'FCP', label: 'First Contentful Paint', value: '0.9s', score: 97, target: '<1.8s', status: 'good' },
    { metric: 'TTFB', label: 'Time to First Byte', value: '380ms', score: 72, target: '<800ms', status: 'needs-improvement' },
    { metric: 'TTI', label: 'Time to Interactive', value: '3.4s', score: 55, target: '<3.8s', status: 'needs-improvement' },
];

const WCAG = [
    { criterion: '1.1.1 Non-text Content', level: 'A', status: 'fail', detail: '12 images missing alt text' },
    { criterion: '1.3.1 Info & Relationships', level: 'A', status: 'pass', detail: 'Semantic markup correct' },
    { criterion: '1.4.3 Contrast', level: 'AA', status: 'warn', detail: '6 elements below 4.5:1 ratio' },
    { criterion: '2.1.1 Keyboard', level: 'A', status: 'pass', detail: 'Tab order validated' },
    { criterion: '2.4.6 Headings & Labels', level: 'AA', status: 'pass', detail: 'All headings descriptive' },
    { criterion: '2.4.7 Focus Visible', level: 'AA', status: 'warn', detail: 'Focus rings missing on 3 buttons' },
    { criterion: '3.2.1 On Focus', level: 'A', status: 'pass', detail: 'No context changes on focus' },
    { criterion: '4.1.2 Name, Role, Value', level: 'A', status: 'fail', detail: '4 inputs without ARIA labels' },
];

const TREND = [
    { page: '/home', score: 92 }, { page: '/login', score: 88 }, { page: '/dashboard', score: 75 },
    { page: '/users', score: 68 }, { page: '/checkout', score: 55 }, { page: '/settings', score: 82 },
    { page: '/reports', score: 71 }, { page: '/analytics', score: 65 },
];

const RADAR_D = [
    { subject: 'Performance', A: 82 }, { subject: 'Accessibility', A: 74 },
    { subject: 'Best Practices', A: 88 }, { subject: 'SEO', A: 91 },
    { subject: 'PWA', A: 47 },
];

const statusColors = { good: '#10b981', 'needs-improvement': '#f59e0b', poor: '#ef4444' };
const wcagStatus = {
    pass: { bg: 'bg-green-50', text: 'text-green-600', label: 'PASS' },
    fail: { bg: 'bg-red-50', text: 'text-red-600', label: 'FAIL' },
    warn: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'WARN' },
};
const scoreColor = (s) => s >= 90 ? '#10b981' : s >= 70 ? '#f59e0b' : '#ef4444';
const scoreRing = (s) => s >= 90 ? 'text-green-500' : s >= 70 ? 'text-amber-500' : 'text-red-500';

export default function PerformanceAccessibility() {
    const [device, setDevice] = useState('Desktop');
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Zap size={20} className="text-amber-500" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900">Performance & Accessibility</h2>
                    <p className="text-sm text-slate-400">Core Web Vitals · WCAG 2.1 audit · Lighthouse scores · Device profiles</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {[{ label: 'Desktop', icon: Monitor }, { label: 'Tablet', icon: Tablet }, { label: 'Mobile', icon: Smartphone }].map(d => (
                        <button key={d.label} onClick={() => setDevice(d.label)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${device === d.label ? 'bg-amber-500 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                            <d.icon size={13} />{d.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Core Web Vitals */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {VITALS.map((v, i) => (
                    <motion.div key={v.metric} {...card(i)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">{v.metric}</span>
                                <p className="text-[11px] text-slate-400 mt-0.5">{v.label}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full border-4 flex items-center justify-center shrink-0"
                                style={{ borderColor: statusColors[v.status] }}>
                                <span className="text-[10px] font-black" style={{ color: statusColors[v.status] }}>{v.score}</span>
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{v.value}</p>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 mr-3">
                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${v.score}%`, background: statusColors[v.status] }} />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">Target {v.target}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div {...card(6)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Lighthouse Scores</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={RADAR_D}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                            <Radar name="Score" dataKey="A" stroke="#f59e0b" fill="#fef3c7" fillOpacity={0.6} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div {...card(7)} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Performance Score by Page</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={TREND} barSize={20}>
                            <XAxis dataKey="page" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]} name="Score"
                                fill="#f59e0b"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* WCAG Audit */}
            <motion.div {...card(8)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-sm">WCAG 2.1 Audit</h3>
                    <div className="flex gap-3 text-xs font-semibold text-slate-500">
                        <span className="text-green-600">✓ {WCAG.filter(w => w.status === 'pass').length} Pass</span>
                        <span className="text-amber-600">⚠ {WCAG.filter(w => w.status === 'warn').length} Warn</span>
                        <span className="text-red-600">✗ {WCAG.filter(w => w.status === 'fail').length} Fail</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                {['Criterion', 'Level', 'Status', 'Detail'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {WCAG.map((w, i) => {
                                const s = wcagStatus[w.status];
                                return (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{w.criterion}</td>
                                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold">{w.level}</span></td>
                                        <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-lg text-xs font-black ${s.bg} ${s.text}`}>{s.label}</span></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{w.detail}</td>
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
