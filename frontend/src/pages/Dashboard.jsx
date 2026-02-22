import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    TrendingDown,
    CheckCircle2,
    Clock,
    AlertTriangle,
    AlertCircle,
    Info,
    ExternalLink,
    ArrowUpRight,
    ArrowDownRight,
    Shield
} from 'lucide-react';

const scans = [
    { name: 'Acme E-commerce', url: 'acme.com', type: 'Full Scan', score: 85, issues: 12, status: 'Completed', time: '2h ago', statusColor: 'bg-emerald-50 text-emerald-600' },
    { name: 'Marketing Blog', url: 'blog.marketing.io', type: 'Frontend Scan', score: 92, issues: 3, status: 'Completed', time: '5h ago', statusColor: 'bg-emerald-50 text-emerald-600' },
    { name: 'User Dashboard', url: 'app.dashboard.com', type: 'Security Audit', score: 71, issues: 24, status: 'Warning', time: '1d ago', statusColor: 'bg-amber-50 text-amber-600' },
    { name: 'Auth Portal V2', url: 'auth.portal.com', type: 'Accessibility', score: 95, issues: 2, status: 'Completed', time: '2d ago', statusColor: 'bg-emerald-50 text-emerald-600' },
    { name: 'Checkout Bridge', url: 'checkout.legacy.io', type: 'Performance', score: 62, issues: 38, status: 'Critical', time: '3d ago', statusColor: 'bg-red-50 text-red-600' },
];

const topIssues = [
    { type: 'Missing Alt Text', pages: 14, severity: 'Minor', color: 'bg-blue-50 text-blue-600', icon: Info },
    { type: 'Slow LCP (> 4s)', pages: 3, severity: 'Major', color: 'bg-amber-50 text-amber-600', icon: AlertTriangle },
    { type: 'Broken Links (404)', pages: 7, severity: 'Major', color: 'bg-amber-50 text-amber-600', icon: AlertTriangle },
    { type: 'No HTTPS Redirect', pages: 1, severity: 'Critical', color: 'bg-red-50 text-red-600', icon: AlertCircle },
];

const scoreColor = (s) => {
    if (s >= 90) return 'text-emerald-600';
    if (s >= 75) return 'text-blue-600';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
};

const scoreBg = (s) => {
    if (s >= 90) return 'bg-emerald-50 text-emerald-700';
    if (s >= 75) return 'bg-blue-50 text-blue-700';
    if (s >= 60) return 'bg-amber-50 text-amber-700';
    return 'bg-red-50 text-red-700';
};

const HealthRing = ({ score }) => {
    const r = 46;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - score / 100);
    return (
        <div className="relative w-32 h-32 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="fill-none stroke-current text-slate-100" strokeWidth="7" cx="50" cy="50" r={r} />
                <motion.circle
                    className="fill-none stroke-current text-blue-600"
                    strokeWidth="7"
                    strokeLinecap="round"
                    cx="50" cy="50" r={r}
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900">{score}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Score</span>
            </div>
        </div>
    );
};

const BarChart = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const vals = [3, 7, 5, 9, 6, 4, 8];
    const max = Math.max(...vals);
    return (
        <div className="flex items-end gap-2 h-24 mt-2">
            {vals.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / max) * 80}px` }}
                        transition={{ duration: 0.8, delay: i * 0.07, ease: 'easeOut' }}
                        className={`w-full rounded-t-lg ${i === 6 ? 'bg-blue-600' : 'bg-blue-100'}`}
                    />
                    <span className="text-[9px] font-bold text-slate-400">{days[i]}</span>
                </div>
            ))}
        </div>
    );
};

const DonutChart = () => {
    const segments = [
        { label: 'Critical', count: 2, color: '#ef4444', pct: 6 },
        { label: 'Major', count: 8, color: '#f97316', pct: 25 },
        { label: 'Minor', count: 22, color: '#2563eb', pct: 69 },
    ];
    let cumulative = 0;
    const r = 38;
    const circ = 2 * Math.PI * r;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" strokeWidth="16" stroke="#f1f5f9" />
                    {segments.map((seg, i) => {
                        const dash = circ * (seg.pct / 100);
                        const gap = circ - dash;
                        const offset = circ * (1 - cumulative / 100);
                        cumulative += seg.pct;
                        return (
                            <motion.circle
                                key={i}
                                cx="50" cy="50" r="38"
                                fill="none"
                                strokeWidth="16"
                                stroke={seg.color}
                                strokeDasharray={`${dash} ${gap}`}
                                strokeDashoffset={offset}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-900">32</span>
                    <span className="text-[9px] font-bold text-slate-400">Issues</span>
                </div>
            </div>
            <div className="space-y-2.5">
                {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-xs font-bold text-slate-500 w-14">{s.label}</span>
                        <span className="text-xs font-black text-slate-900">{s.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Dashboard = ({ result }) => {
    const navigate = useNavigate();
    const hasData = true; // Always show data

    const statCards = [
        {
            label: 'Overall Health Score',
            value: null,
            ring: 87,
            trend: '+3.2%',
            trendUp: true,
            sub: 'vs last week'
        },
        {
            label: 'Issues Found',
            value: '32',
            ring: null,
            trend: 'Down from 41',
            trendUp: true,
            icon: AlertTriangle,
            iconColor: 'text-amber-500',
            iconBg: 'bg-amber-50',
            sub: 'issues resolved'
        },
        {
            label: 'Test Suites Passed',
            value: '119/124',
            ring: null,
            trend: '95.9% pass rate',
            trendUp: true,
            icon: CheckCircle2,
            iconColor: 'text-emerald-500',
            iconBg: 'bg-emerald-50',
            sub: 'suites passing'
        },
        {
            label: 'Avg. Scan Time',
            value: '4.2s',
            ring: null,
            trend: '-0.8s faster',
            trendUp: true,
            icon: Clock,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-50',
            sub: 'per scan'
        }
    ];

    return (
        <div className="p-5 sm:p-8 space-y-6 bg-[#f8fafc] min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)]">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">Quality Overview</h1>
                    <p className="text-slate-400 font-medium text-sm mt-0.5">Last scan completed 2 hours ago</p>
                </div>
                <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-lg shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
                >
                    <Plus size={14} strokeWidth={3} />
                    New Scan
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                {statCards.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                        {card.ring !== null ? (
                            <HealthRing score={card.ring} />
                        ) : (
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                                <card.icon size={22} className={card.iconColor} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{card.label}</p>
                            {card.value && <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-1">{card.value}</p>}
                            <div className={`flex items-center gap-1 text-[11px] font-bold ${card.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {card.trendUp ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                                <span>{card.trend}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {/* Severity Donut */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Severity Breakdown</h3>
                        <span className="text-[10px] font-bold text-slate-400">Current Sprint</span>
                    </div>
                    <DonutChart />
                </motion.div>

                {/* Scan Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Scan Activity</h3>
                        <span className="text-[10px] font-bold text-slate-400">Last 7 days</span>
                    </div>
                    <BarChart />
                </motion.div>
            </div>

            {/* Recent Scans Table */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Recent Scans</h3>
                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-slate-50">
                                {['Application', 'Scan Type', 'Health Score', 'Issues', 'Status', 'Time'].map((h) => (
                                    <th key={h} className="px-5 sm:px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {scans.map((scan, i) => (
                                <motion.tr
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.45 + i * 0.06 }}
                                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-5 sm:px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                                <Shield size={14} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{scan.name}</p>
                                                <p className="text-[11px] text-slate-400 font-medium">{scan.url}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 sm:px-6 py-4">
                                        <span className="text-xs font-bold text-slate-500">{scan.type}</span>
                                    </td>
                                    <td className="px-5 sm:px-6 py-4">
                                        <span className={`text-sm font-black ${scoreColor(scan.score)}`}>{scan.score}</span>
                                        <span className="text-slate-300 text-xs">/100</span>
                                    </td>
                                    <td className="px-5 sm:px-6 py-4">
                                        <span className="text-sm font-bold text-slate-600">{scan.issues}</span>
                                    </td>
                                    <td className="px-5 sm:px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${scan.statusColor}`}>{scan.status}</span>
                                    </td>
                                    <td className="px-5 sm:px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">{scan.time}</span>
                                            <ExternalLink size={12} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Top Issues */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Top Issues Found</h3>
                    <span className="text-[10px] font-bold text-slate-400">Across all scans</span>
                </div>
                <div className="divide-y divide-slate-50">
                    {topIssues.map((issue, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 + i * 0.05 }}
                            className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${issue.color.split(' ')[0]}`}>
                                    <issue.icon size={16} className={issue.color.split(' ')[1]} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{issue.type}</p>
                                    <p className="text-[11px] text-slate-400 font-medium">{issue.pages} pages affected</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${issue.color}`}>{issue.severity}</span>
                                <ArrowUpRight size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
