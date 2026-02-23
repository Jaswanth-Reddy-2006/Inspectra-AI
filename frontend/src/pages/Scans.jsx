import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Terminal,
    ShieldAlert,
    BarChart,
    Search
} from 'lucide-react';

const Scans = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] bg-white flex flex-col items-center justify-center overflow-hidden relative px-5 sm:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="max-w-4xl w-full flex flex-col items-center"
            >
                {/* Laser Diagnostic Container */}
                <div className="w-full relative py-8 sm:py-12 px-6 sm:px-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] sm:rounded-[3.375rem] bg-slate-50/20 mb-8 sm:mb-10 overflow-hidden flex flex-col items-center">

                    {/* HUD corner dots */}
                    <div className="absolute top-5 left-5 flex gap-2">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        <div className="w-8 h-1 bg-slate-100 rounded-full" />
                    </div>

                    {/* Scan circle */}
                    <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center mb-8 sm:mb-10">
                        <motion.div
                            animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.2, 1] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="absolute inset-0 bg-blue-500 rounded-full blur-[50px]"
                        />

                        <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-full border-[5px] border-slate-50 shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-blue-50/50">
                            <div className="absolute inset-0 p-5 flex flex-col justify-center space-y-2 opacity-20">
                                <div className="h-1.5 bg-blue-100 rounded-full w-full" />
                                <div className="h-1.5 bg-blue-100 rounded-full w-3/4" />
                                <div className="h-1.5 bg-blue-100 rounded-full w-full" />
                            </div>

                            <motion.div
                                animate={{ top: ['-10%', '110%'], opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent z-30 shadow-[0_0_10px_rgba(37,99,235,0.8)]"
                            />

                            <motion.div
                                animate={{ scale: [0.95, 1.05, 0.95] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="relative z-20 text-blue-600"
                            >
                                <Search size={36} strokeWidth={1.5} />
                            </motion.div>
                        </div>
                    </div>

                    <div className="text-center space-y-3 max-w-md z-10 px-2">
                        <h2 className="text-2xl sm:text-[32px] font-black text-[#0f172a] tracking-tight">No scans yet</h2>
                        <p className="text-sm sm:text-base font-semibold text-slate-400 leading-relaxed">
                            Initialize your first automated scan sequence to reveal latent security vulnerabilities and performance bottlenecks.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="mt-7 sm:mt-8 flex flex-col items-center w-full max-w-[260px] relative z-20">
                        <button
                            onClick={() => navigate('/home')}
                            className="bg-[#2563eb] text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 w-full"
                        >
                            <Plus size={16} strokeWidth={3} />
                            <span>Run Your First Scan</span>
                        </button>
                    </div>
                </div>

                {/* Capability Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
                    {[
                        { icon: Terminal, title: "Code Analysis", desc: "Static & dynamic runtime safety" },
                        { icon: ShieldAlert, title: "Risk Detection", desc: "AI-driven threat assessments" },
                        { icon: BarChart, title: "Perf Tuning", desc: "Vitals & latency optimization" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center sm:flex-col sm:items-center gap-4 sm:gap-0 p-5 sm:p-6 rounded-2xl bg-white border border-[#f1f5f9] hover:border-blue-100 hover:shadow-xl hover:shadow-slate-100 transition-all group">
                            <div className="w-10 h-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-blue-600 shrink-0 sm:mb-4 group-hover:bg-blue-50 transition-colors">
                                <item.icon size={20} strokeWidth={2.5} />
                            </div>
                            <div className="sm:text-center">
                                <h4 className="text-sm font-bold text-[#0f172a] sm:mb-1">{item.title}</h4>
                                <p className="text-[12px] font-medium text-slate-400">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default Scans;
