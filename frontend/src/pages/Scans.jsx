import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useScanContext } from '../context/ScanContext';
import {
    Plus,
    Terminal,
    ShieldAlert,
    BarChart,
    Search,
    Globe,
    Clock,
    ArrowRight,
    Zap,
    History
} from 'lucide-react';

const Scans = () => {
    const navigate = useNavigate();
    const { scanHistory, startScan } = useScanContext();

    const handleReScan = (url) => {
        startScan(url);
    };

    if (!scanHistory || scanHistory.length === 0) {
        return (
            <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] bg-white flex flex-col items-center justify-center overflow-hidden relative px-5 sm:px-8 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="max-w-4xl w-full flex flex-col items-center"
                >
                    <div className="w-full relative py-8 sm:py-12 px-6 sm:px-10 border-2 border-dashed border-slate-100 rounded-[2.5rem] sm:rounded-[3.375rem] bg-slate-50/20 mb-8 sm:mb-10 overflow-hidden flex flex-col items-center">
                        <div className="absolute top-5 left-5 flex gap-2">
                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            <div className="w-8 h-1 bg-slate-100 rounded-full" />
                        </div>
                        <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center mb-8 sm:mb-10">
                            <motion.div
                                animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.2, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute inset-0 bg-blue-500 rounded-full blur-[50px]"
                            />
                            <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-full border-[5px] border-slate-50 shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-blue-50/50">
                                <motion.div animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 5, repeat: Infinity }} className="relative z-20 text-blue-600">
                                    <Search size={36} strokeWidth={1.5} />
                                </motion.div>
                            </div>
                        </div>
                        <div className="text-center space-y-3 max-w-md z-10 px-2">
                            <h2 className="text-2xl sm:text-[32px] font-black text-[#0f172a] tracking-tight">No scan history</h2>
                            <p className="text-sm sm:text-base font-semibold text-slate-400 leading-relaxed">
                                Initialize your first autonomous audit cycle to reveal hidden defects and performance barriers.
                            </p>
                        </div>
                        <div className="mt-7 sm:mt-8 flex flex-col items-center w-full max-w-[260px] relative z-20">
                            <button
                                onClick={() => navigate('/home')}
                                className="bg-[#2563eb] text-white px-6 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 w-full"
                            >
                                <Plus size={16} strokeWidth={3} />
                                <span>Initiate New Scan</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto p-6 lg:p-12 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Archive v2.0</div>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autonomous Logs</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Scan History</h1>
                </div>
                <button
                    onClick={() => navigate('/home')}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                    <Plus size={16} />
                    New Scan Sequence
                </button>
            </div>

            {/* History List */}
            <div className="space-y-4">
                <AnimatePresence>
                    {scanHistory.map((item, idx) => (
                        <motion.div
                            key={item.url + item.timestamp}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Globe size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 truncate max-w-xs md:max-w-md">{item.url}</p>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleReScan(item.url)}
                                    className="px-5 py-3 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn"
                                >
                                    <Zap size={14} className="group-hover/btn:fill-white" />
                                    Re-Run Deep Scan
                                </button>
                                <button
                                    onClick={() => {
                                        // In a real app, we might load saved results for that URL
                                        // For now, we just redirect if it matches the current active scan
                                        navigate('/dashboard');
                                    }}
                                    className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Empty Context State (Footer) */}
            <div className="pt-12 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full text-slate-400">
                    <History size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Retaining last 50 autonomous cycles</span>
                </div>
            </div>
        </div>
    );
};

export default Scans;
