import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Shield, Search, Zap, CheckCircle2, Activity } from 'lucide-react';

const LoadingSpinner = ({ isProcessing, scanStartTime }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.round((Date.now() - scanStartTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [scanStartTime]);

    const stages = [
        { id: 1, label: 'Initializing Autonomous Agent', icon: <Activity size={18} />, time: 0 },
        { id: 2, label: 'Crawling application paths', icon: <Search size={18} />, time: 10 },
        { id: 3, label: 'Running deep accessibility audit', icon: <Shield size={18} />, time: 30 },
        { id: 4, label: 'Analyzing performance bottlenecks', icon: <Zap size={18} />, time: 60 },
        { id: 5, label: 'Generating quality insights', icon: <CheckCircle2 size={18} />, time: 120 }
    ];

    const currentStageIndex = stages.reduce((acc, stage, idx) => {
        return elapsed >= stage.time ? idx : acc;
    }, 0);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
            >
                <div className="relative mb-12">
                    {/* Animated Rings */}
                    <div className="absolute inset-0 scale-150 opacity-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full border-4 border-dashed border-blue-600 rounded-full"
                        />
                    </div>

                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 relative overflow-hidden group">
                        <motion.div
                            animate={{
                                y: [-40, 40],
                                rotate: [0, 360]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 bg-blue-500 opacity-50 blur-2xl"
                        />
                        <Loader2 className="text-white animate-spin relative z-10" size={48} />
                    </div>
                </div>

                <div className="max-w-md w-full space-y-8">
                    <div className="space-y-2">
                        <motion.h2
                            key={stages[currentStageIndex].label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                        >
                            {stages[currentStageIndex].label}
                        </motion.h2>
                        <p className="text-slate-400 font-medium text-sm sm:text-base">
                            Agent is performing deep inspection. This may take up to 3 minutes.
                        </p>
                    </div>

                    {/* Stage Timeline */}
                    <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 shadow-inner">
                        <div className="space-y-4">
                            {stages.map((stage, idx) => (
                                <div key={stage.id} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${idx <= currentStageIndex ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-200 text-slate-400'}`}>
                                        {idx < currentStageIndex ? <CheckCircle2 size={16} /> : stage.icon}
                                    </div>
                                    <span className={`text-xs sm:text-sm font-black uppercase tracking-widest ${idx === currentStageIndex ? 'text-blue-600' : idx < currentStageIndex ? 'text-slate-900 line-through opacity-50' : 'text-slate-300'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200/50 shadow-sm">
                            <Activity size={14} className="animate-pulse text-blue-600" />
                            Elapsed: {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / 3:00
                        </div>
                    </div>
                </div>

                {/* Bottom Footer Info */}
                <div className="absolute bottom-10 left-0 w-full px-6 flex justify-center">
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        <span>Secure Scan</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span>Playwright Engine</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span>v2.4.0</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default LoadingSpinner;
