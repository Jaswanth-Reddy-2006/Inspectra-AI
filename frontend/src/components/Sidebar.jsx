import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, Folder, CheckSquare, Settings, Shield, X,
    Map, Lock, Layers, GitBranch, Network, Zap, Cpu, Eye,
    Bug, BarChart2, ShieldCheck, AlertTriangle, ChevronDown, ChevronRight
} from 'lucide-react';

const NAV_SECTIONS = [
    {
        section: 'Overview',
        items: [
            { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
            { path: '/projects', icon: Folder, label: 'Projects' },
            { path: '/scans', icon: CheckSquare, label: 'Scans' },
        ],
    },
    {
        section: 'QA Agents',
        items: [
            { path: '/discovery', icon: Map, label: 'Discovery Agent' },
            { path: '/auth-agent', icon: Lock, label: 'Auth Agent' },
            { path: '/classifier', icon: Layers, label: 'Page Classifier' },
            { path: '/dom', icon: GitBranch, label: 'DOM Analysis' },
            { path: '/network', icon: Network, label: 'Network Monitor' },
            { path: '/performance', icon: Zap, label: 'Performance & A11y' },
            { path: '/functional', icon: Cpu, label: 'Functional Judge' },
            { path: '/visual', icon: Eye, label: 'Visual Judge' },
        ],
    },
    {
        section: 'Analysis',
        items: [
            { path: '/defects', icon: Bug, label: 'Defect Graphs' },
            { path: '/severity', icon: BarChart2, label: 'Severity Matrix' },
            { path: '/hygiene', icon: ShieldCheck, label: 'Hygiene Score' },
            { path: '/risk', icon: AlertTriangle, label: 'Risk Analysis' },
        ],
    },
    {
        section: 'Settings',
        items: [
            { path: '/settings', icon: Settings, label: 'Settings' },
        ],
    },
];

const Sidebar = ({ isOpen, onClose }) => {
    // Track which sections are collapsed (default all open)
    const [collapsed, setCollapsed] = useState({});
    const toggleSection = (sec) => setCollapsed(prev => ({ ...prev, [sec]: !prev[sec] }));

    const SidebarContent = () => (
        <aside className="h-full w-[260px] bg-white border-r border-[#f1f5f9] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 pb-4 flex items-center justify-between shrink-0">
                <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
                    <div className="w-9 h-9 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0 transition-transform group-hover:scale-105">
                        <Shield className="text-white fill-white/10" size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-[16px] tracking-tight text-[#0f172a] leading-none">Inspectra AI</h1>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 leading-none">Autonomous QA Platform</span>
                    </div>
                </Link>
                <button
                    onClick={onClose}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                {NAV_SECTIONS.map((sec) => {
                    const isCollapsed = collapsed[sec.section];
                    return (
                        <div key={sec.section} className="mb-1">
                            {/* Section Label */}
                            <button
                                onClick={() => toggleSection(sec.section)}
                                className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5 rounded-lg hover:bg-slate-50 transition-colors group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">
                                    {sec.section}
                                </span>
                                {isCollapsed
                                    ? <ChevronRight size={12} className="text-slate-300" />
                                    : <ChevronDown size={12} className="text-slate-300" />
                                }
                            </button>

                            {/* Items */}
                            <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="overflow-hidden space-y-0.5"
                                    >
                                        {sec.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={onClose}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all
                                                        ${isActive
                                                            ? 'bg-[#eff6ff] text-[#2563eb] font-bold'
                                                            : 'text-slate-500 hover:bg-[#f8fafc] hover:text-slate-900'}
                                                    `}
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            <Icon size={16} className={isActive ? 'text-[#2563eb]' : 'text-slate-400'} />
                                                            <span className="truncate">{item.label}</span>
                                                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2563eb] shrink-0" />}
                                                        </>
                                                    )}
                                                </NavLink>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Profile Widget */}
            <div className="p-3 border-t border-slate-100 shrink-0">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#f8fafc]">
                    <div className="w-8 h-8 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0">
                        <Shield className="text-[#2563eb]" size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-black text-[#0f172a] leading-tight truncate">Alex Rivera</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">Pro Account</span>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop */}
            <div className="hidden lg:block fixed left-0 top-0 h-screen z-50">
                <SidebarContent />
            </div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="lg:hidden fixed left-0 top-0 h-full z-50 shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
