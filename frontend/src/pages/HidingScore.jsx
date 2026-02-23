import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Hash, GitBranch, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const card = (i = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 } });

const HIDDEN_ITEMS = [
    { id: 'H-001', type: 'Route', url: '/admin/users', method: 'GET', score: 94, reason: 'No nav link, direct URL access', auth: false, status: 403 },
    { id: 'H-002', type: 'Route', url: '/api/internal/debug', method: 'GET', score: 99, reason: 'Exposed debug endpoint', auth: false, status: 200 },
    { id: 'H-003', type: 'Element', url: '/settings', method: '—', score: 72, reason: 'CSS display:none toggle', auth: true, status: 200 },
    { id: 'H-004', type: 'Route', url: '/reports/export', method: 'POST', score: 81, reason: 'Anchor tag href detected by JS', auth: true, status: 200 },
    { id: 'H-005', type: 'Element', url: '/dashboard', method: '—', score: 65, reason: 'ARIA hidden="true" element', auth: true, status: 200 },
    { id: 'H-006', type: 'Route', url: '/api/v1/admin/stats', method: 'GET', score: 97, reason: 'Discovered via JS injection', auth: false, status: 200 },
    { id: 'H-007', type: 'Element', url: '/login', method: '—', score: 58, reason: 'Off-screen form inputs', auth: false, status: 200 },
    { id: 'H-008', type: 'Route', url: '/internal/health', method: 'GET', score: 88, reason: 'Robots.txt disallowed route', auth: false, status: 200 },
];

const PIE = [
    { name: 'Routes', value: 5, color: '#6366f1' },
    { name: 'Elements', value: 3, color: '#ec4899' },
];

const BY_METHOD = [
    { name: 'GET', count: 6 }, { name: 'POST', count: 1 }, { name: 'Element', count: 3 },
];

const ScoreGauge = ({ score }) => {
    const color = score >= 85 ? '#ef4444' : score >= 65 ? '#f59e0b' : '#10b981';
    return (
        <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={`${(score / 100) * 163.4} 163.4`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color }}>{score}</span>
        </div>
    );
};

export default function HidingScore() {
    const [selected, setSelected] = useState(null);
    const avgScore = Math.round(HIDDEN_ITEMS.reduce((a, b) => a + b.score, 0) / HIDDEN_ITEMS.length);
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <EyeOff size={20} className="text-purple-600" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-900">Hiding Score</h2>
                    <p className="text-sm text-slate-400">Hidden routes · Concealed elements · Obfuscation analysis · Exposure risk scoring</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-xl">
                    <Search size={13} className="text-purple-500" />
                    <span className="text-xs font-bold text-purple-600">{HIDDEN_ITEMS.length} hidden items found</span>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Hidden Routes', value: '5', sub: 'Undisclosed endpoints', color: '#6366f1', bg: '#eef2ff', icon: GitBranch },
                    { label: 'Hidden Elements', value: '3', sub: 'CSS/ARIA concealed', color: '#ec4899', bg: '#fce7f3', icon: EyeOff },
                    { label: 'Unprotected', value: '4', sub: 'No auth required', color: '#ef4444', bg: '#fee2e2', icon: Lock },
                    { label: 'Avg Hiding Score', value: avgScore, sub: 'Exposure severity', color: '#f59e0b', bg: '#fef3c7', icon: Hash },
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div {...card(4)} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Type Breakdown</h3>
                    <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                            <Pie data={PIE} cx="50%" cy="50%" innerRadius={40} outerRadius={62} dataKey="value" paddingAngle={4}>
                                {PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-1">
                        {PIE.map(p => (
                            <div key={p.name} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                                <span className="text-xs font-semibold text-slate-500">{p.name} ({p.value})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div {...card(5)} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h3 className="font-black text-slate-800 text-sm mb-3">Hiding Score Distribution</h3>
                    <div className="space-y-3">
                        {HIDDEN_ITEMS.map((item) => {
                            const color = item.score >= 85 ? '#ef4444' : item.score >= 65 ? '#f59e0b' : '#10b981';
                            return (
                                <div key={item.id} onClick={() => setSelected(item)} className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors">
                                    <span className="font-mono text-[10px] font-black text-slate-400 w-12">{item.id}</span>
                                    <span className="font-mono text-xs text-slate-600 w-48 truncate shrink-0">{item.url}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                                        <div className="h-2 rounded-full transition-all" style={{ width: `${item.score}%`, background: color }} />
                                    </div>
                                    <span className="text-xs font-black w-8 text-right" style={{ color }}>{item.score}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Detail Table */}
            <motion.div {...card(6)} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-900 text-sm">Hidden Items Registry</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-left">
                                {['ID', 'Type', 'URL / Selector', 'Method', 'Reason', 'Auth', 'Status', 'Score'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {HIDDEN_ITEMS.map((item, i) => {
                                const color = item.score >= 85 ? '#ef4444' : item.score >= 65 ? '#f59e0b' : '#10b981';
                                const bg = item.score >= 85 ? '#fee2e2' : item.score >= 65 ? '#fef3c7' : '#d1fae5';
                                return (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-black text-slate-400">{item.id}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.type === 'Route' ? 'bg-indigo-50 text-indigo-600' : 'bg-pink-50 text-pink-600'}`}>{item.type}</span></td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[160px] truncate">{item.url}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.method}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">{item.reason}</td>
                                        <td className="px-4 py-3"><span className={`text-xs font-bold ${item.auth ? 'text-green-600' : 'text-red-500'}`}>{item.auth ? '🔒 Yes' : '⚠️ No'}</span></td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${item.status === 200 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{item.status}</span></td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-black px-2 py-1 rounded-lg" style={{ background: bg, color }}>{item.score}</span>
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
