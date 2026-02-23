import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, Activity, Zap } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [showPass, setShowPass] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden selection:bg-indigo-500/30 selection:text-white">

            {/* Artistic Dynamic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[160px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, -60, 0],
                        opacity: [0.1, 0.15, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600 rounded-full blur-[200px]"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100" />
            </div>

            {/* Logo Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 text-center mb-10"
            >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.75rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(79,70,229,0.3)] border border-white/20">
                    <Shield className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2">Inspectra <span className="text-indigo-500 font-medium">AI</span></h1>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] opacity-80">Autonomous Quality Intelligence Engine</p>
            </motion.div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-[500px] relative z-20 group"
            >
                {/* Visual Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                <div className="relative bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-8 sm:p-12 shadow-2xl">
                    <div className="mb-10 text-center sm:text-left">
                        <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                            <Sparkles size={16} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Alpha Access Protocol</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Identity Verification</h2>
                        <p className="text-slate-400 font-medium text-sm mt-1">Authenticate to access neural diagnostic results.</p>
                    </div>

                    <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    placeholder="agent@inspectra.ai"
                                    className="w-full px-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 focus:bg-white/10 transition-all font-medium text-white text-sm placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Key (Password)</label>
                                <button type="button" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Emergency Reset</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    className="w-full px-12 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 focus:bg-white/10 transition-all font-medium text-white text-sm placeholder:text-slate-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            onMouseEnter={() => setIsHovering(true)}
                            onMouseLeave={() => setIsHovering(false)}
                            className="w-full relative group/btn overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-indigo-600 group-hover/btn:bg-blue-600 transition-colors duration-300" />
                            <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-shimmer" />
                            <div className="relative py-4 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                                <span>Initialize Access</span>
                                <motion.div
                                    animate={isHovering ? { x: 4 } : { x: 0 }}
                                >
                                    <ArrowRight size={14} strokeWidth={3} />
                                </motion.div>
                            </div>
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center gap-2 grayscale group-hover:grayscale-0 transition-all duration-700">
                            <Activity size={18} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AES-256 Valid</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 grayscale group-hover:grayscale-0 transition-all duration-700">
                            <Zap size={18} className="text-amber-500" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sub-ms Latency</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-10 text-center"
            >
                <p className="text-slate-500 font-bold text-xs">
                    Protected by <span className="text-slate-300">Inspectra Bio-Shield™</span> Protocol v7.0
                </p>
            </motion.div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    from { transform: translateX(-150%) skewX(-20deg); }
                    to { transform: translateX(150%) skewX(-20deg); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite linear;
                }
            `}} />
        </div>
    );
};

export default Login;
