import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    Folder,
    CheckSquare,
    Settings,
    Shield,
    X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const navItems = [
        { path: '/dashboard', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
        { path: '/projects', icon: <Folder size={20} />, label: 'Projects' },
        { path: '/scans', icon: <CheckSquare size={20} />, label: 'Scans' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    const SidebarContent = () => (
        <aside className="h-full w-[260px] bg-white border-r border-[#f1f5f9] flex flex-col">
            {/* Header Section */}
            <div className="p-6 pb-8 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
                    <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0 transition-transform group-hover:scale-105">
                        <Shield className="text-white fill-white/10" size={22} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="font-bold text-[17px] tracking-tight text-[#0f172a] leading-none">AutoQA Agent</h1>
                        <span className="text-[11px] text-slate-400 font-medium mt-1.5 leading-none">Quality Assurance Platform</span>
                    </div>
                </Link>
                {/* Close button — only visible on mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) => `
                            flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-sm transition-all
                            ${isActive
                                ? 'bg-[#eff6ff] text-[#2563eb]'
                                : 'text-slate-500 hover:bg-[#f8fafc] hover:text-slate-900'}
                        `}
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Profile Widget */}
            <div className="p-4">
                <div className="flex items-center gap-3.5 px-4 py-4 rounded-xl bg-[#f8fafc] border border-transparent">
                    <div className="w-9 h-9 rounded-full bg-[#dbeafe] flex items-center justify-center shrink-0">
                        <Shield className="text-[#2563eb]" size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-black text-[#0f172a] leading-tight truncate">Alex Rivera</span>
                        <span className="text-[11px] text-slate-400 font-bold mt-1 leading-none uppercase tracking-wider">Pro Account</span>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Desktop Sidebar — always visible */}
            <div className="hidden lg:block fixed left-0 top-0 h-screen z-50">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar — overlay drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={onClose}
                            className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        />
                        {/* Drawer */}
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
