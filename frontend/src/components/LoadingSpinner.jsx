import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Shield, Search } from 'lucide-react';

const STEPS = [
    { id: 0, label: 'Scanning DOM structure & page hierarchy...' },
    { id: 1, label: 'Mapping buttons, links & interactive elements...' },
    { id: 2, label: 'Identifying authentication requirements...' },
    { id: 3, label: 'Running accessibility & security checks...' },
    { id: 4, label: 'Generating quality execution report...' },
];

const STEP_DURATION = 1600; // ms per step

const LoadingSpinner = ({ scanUrl }) => {
    const [completedSteps, setCompletedSteps] = useState([]);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        let step = 0;
        const advance = () => {
            if (step < STEPS.length) {
                setActiveStep(step);
                setTimeout(() => {
                    setCompletedSteps((prev) => [...prev, step]);
                    step++;
                    if (step < STEPS.length) {
                        setTimeout(advance, 200);
                    }
                }, STEP_DURATION);
            }
        };
        const t = setTimeout(advance, 400);
        return () => clearTimeout(t);
    }, []);

    const displayUrl = scanUrl || 'https://example.com';

    return (
        <div className="min-h-screen w-full bg-[#f0f2f8] flex items-center justify-center p-5">
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 w-full max-w-[520px] px-8 sm:px-12 py-10 sm:py-12 flex flex-col items-center text-center"
            >
                {/* Spinning Ring + Search Icon */}
                <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                    {/* Static outer track */}
                    <div className="absolute inset-0 rounded-full border-[6px] border-blue-50" />

                    {/* Spinning arc */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: 'transparent',
                            border: '6px solid transparent',
                            borderTopColor: '#2563eb',
                            borderRightColor: '#2563eb',
                        }}
                    />

                    {/* Inner icon circle */}
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center z-10">
                        <Search size={26} className="text-blue-600" strokeWidth={2} />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-[22px] sm:text-[26px] font-bold text-[#1a1d3b] tracking-tight mb-3">
                    Initializing Autonomous Agent...
                </h2>

                {/* URL Display */}
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-8">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], backgroundColor: ['#22c55e', '#16a34a', '#22c55e'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full shrink-0"
                    />
                    <span>Analyzing application structure:&nbsp;</span>
                    <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-semibold hover:underline truncate max-w-[180px] sm:max-w-[220px]"
                    >
                        {displayUrl}
                    </a>
                </div>

                {/* Step List */}
                <div className="w-full space-y-3.5 mb-10 text-left">
                    {STEPS.map((step) => {
                        const isComplete = completedSteps.includes(step.id);
                        const isActive = activeStep === step.id && !isComplete;
                        const isPending = !isComplete && !isActive;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0.3 }}
                                animate={{ opacity: isPending ? 0.4 : 1 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-3"
                            >
                                {/* Icon */}
                                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                    {isComplete ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', damping: 12 }}
                                        >
                                            <CheckCircle2 size={18} className="text-green-500 fill-green-50" />
                                        </motion.div>
                                    ) : isActive ? (
                                        <motion.div
                                            animate={{ scale: [1, 1.4, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="w-2.5 h-2.5 bg-blue-600 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`text-sm font-medium transition-colors duration-300 ${isComplete
                                        ? 'text-slate-600 line-through decoration-slate-300'
                                        : isActive
                                            ? 'text-[#1a1d3b] font-semibold'
                                            : 'text-slate-400'
                                    }`}>
                                    {step.label}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
                    <motion.div
                        animate={{ width: `${((completedSteps.length) / STEPS.length) * 100}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                </div>

                {/* Powered by footer */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Powered by</span>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Shield size={13} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="font-black text-sm text-slate-600 tracking-tight">AutoQA Agent</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingSpinner;
