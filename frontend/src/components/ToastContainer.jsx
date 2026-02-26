import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TYPES = {
    success: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-50',
        border: 'border-green-100',
        accent: 'bg-green-500'
    },
    error: {
        icon: AlertCircle,
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-100',
        accent: 'bg-red-500'
    },
    warning: {
        icon: AlertTriangle,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        accent: 'bg-amber-500'
    },
    info: {
        icon: Info,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        accent: 'bg-blue-500'
    }
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-[400px]">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => {
                    const config = TYPES[toast.type] || TYPES.info;
                    const Icon = config.icon;

                    return (
                        <motion.div
                            key={toast.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto relative group flex items-start gap-3 p-4 pr-10 ${config.bg} ${config.border} border rounded-2xl shadow-xl shadow-slate-200/50 min-w-[320px] overflow-hidden`}
                        >
                            {/* Left Accent Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />

                            {/* Icon */}
                            <div className={`shrink-0 mt-0.5 ${config.color}`}>
                                <Icon size={20} strokeWidth={2.5} />
                            </div>

                            {/* Message */}
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 leading-tight">
                                    {toast.message}
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="absolute top-2 right-2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
