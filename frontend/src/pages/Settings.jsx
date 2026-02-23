import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Shield,
    Key,
    Bell,
    Globe,
    Mail,
    Trash2,
    Save,
    ChevronRight,
    LogOut
} from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'api', icon: Key, label: 'API Keys' },
        { id: 'notifications', icon: Bell, label: 'Alerts' }
    ];

    return (
        <div className="p-5 sm:p-10 max-w-6xl mx-auto min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] overflow-y-auto">
            {/* Header */}
            <header className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-[#0f172a] tracking-tight mb-1 sm:mb-2">Platform Settings</h1>
                    <p className="text-slate-400 font-bold flex items-center gap-2 text-sm">
                        <Globe size={14} />
                        Global Configuration & Workspace Control
                    </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <button className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-50 text-red-600 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider hover:bg-red-100 transition-all">
                        <LogOut size={14} />
                        Sign Out
                    </button>
                    <button className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#2563eb] text-white rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-xl shadow-blue-200/50 active:scale-95">
                        <Save size={14} />
                        Apply Changes
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-12">
                {/* Tab Navigation */}
                <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 lg:flex-shrink flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black transition-all text-sm ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)]'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 bg-slate-50/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-4">
                                <tab.icon size={16} strokeWidth={2.5} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </div>
                            {activeTab === tab.id && <ChevronRight size={16} strokeWidth={3} className="hidden lg:block" />}
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <main className="lg:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 p-6 sm:p-10 shadow-sm"
                        >
                            {activeTab === 'profile' && (
                                <div className="space-y-8 sm:space-y-10">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                                        <div className="relative group">
                                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-2xl">
                                                AR
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-white shadow-xl border border-slate-50 rounded-2xl flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
                                                <User size={16} />
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-[#0f172a]">Alex Rivera</h3>
                                            <p className="text-slate-400 font-bold text-sm">Enterprise Administrator</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">Pro Account</span>
                                                <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-wider">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
                                        <div className="space-y-2 sm:space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity</label>
                                            <input type="text" defaultValue="Alex Rivera" className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl outline-none font-black text-slate-900 focus:bg-white focus:border-blue-200 transition-all text-sm" />
                                        </div>
                                        <div className="space-y-2 sm:space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input type="email" defaultValue="alex@acme-corp.com" className="w-full pl-10 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl outline-none font-black text-slate-900 focus:bg-white focus:border-blue-200 transition-all text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 sm:pt-8 border-t border-slate-50">
                                        <h4 className="font-black text-slate-900 mb-4 text-sm sm:text-base">Danger Zone</h4>
                                        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-red-50/50 border border-red-50 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="font-black text-red-900 text-sm">Delete Workspace</p>
                                                <p className="text-red-600/60 text-xs font-bold mt-0.5">Permanently remove all project data and scans.</p>
                                            </div>
                                            <button className="p-2.5 sm:p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all shrink-0">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 sm:space-y-8">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">Security Fundamentals</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Two-Factor Authentication', status: 'Enabled', desc: 'Secure your account with biological or app auth.' },
                                            { label: 'Login Notifications', status: 'Active', desc: 'Get alerted on new device sign-ins.' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/50 border border-slate-50 gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 text-sm">{item.label}</p>
                                                    <p className="text-slate-400 text-xs font-bold mt-0.5 truncate">{item.desc}</p>
                                                </div>
                                                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hidden sm:block">{item.status}</span>
                                                    <div className="w-11 h-6 bg-blue-600 rounded-full relative p-1 cursor-pointer">
                                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'api' && (
                                <div className="space-y-6 sm:space-y-8">
                                    <header className="flex items-center justify-between">
                                        <h3 className="text-lg sm:text-xl font-black text-slate-900">Integration Tokens</h3>
                                        <button className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all whitespace-nowrap">
                                            + New Key
                                        </button>
                                    </header>
                                    <div className="space-y-4">
                                        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-sans">Scanning API Key</span>
                                                <span className="text-slate-900 font-bold text-xs sm:text-sm truncate max-w-[240px] sm:max-w-none">ak_test_4eC39HqLyjWDarjtT1zdp7dc</span>
                                            </div>
                                            <button className="text-blue-600 font-black text-xs px-3 py-1.5 hover:bg-white rounded-lg transition-all border border-blue-100 shrink-0">Copy</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6 sm:space-y-8">
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">Alert Orchestration</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Critical Scan Failures', channel: 'Email/Slack' },
                                            { label: 'Score Change Alerts', channel: 'Browser' },
                                            { label: 'Weekly Hygiene Report', channel: 'Email' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/50 border border-slate-50 gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 text-sm">{item.label}</p>
                                                    <p className="text-slate-400 text-xs font-bold mt-0.5">Delivered via {item.channel}</p>
                                                </div>
                                                <div className="w-11 h-6 bg-slate-200 rounded-full relative p-1 cursor-pointer shrink-0">
                                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Settings;
