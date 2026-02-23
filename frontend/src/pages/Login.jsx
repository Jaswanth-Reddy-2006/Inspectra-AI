<<<<<<< HEAD
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Mail, Lock } from 'lucide-react';

const Login = ({ onLogin }) => {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-5 sm:p-6 selection:bg-blue-100 selection:text-blue-700">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-200">
                    <Shield className="text-white" size={22} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">AutoQA Agent</h1>
                <p className="text-slate-500 font-medium text-sm mt-1">High-fidelity automated testing</p>
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10"
            >
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Sign in to your account</h2>
                    <p className="text-slate-400 font-medium text-sm mt-1">Welcome back! Please enter your details.</p>
                </div>

                <form className="space-y-5 sm:space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 ring-blue-50 focus:border-blue-600 transition-all font-medium text-slate-900 text-sm"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 ring-blue-50 focus:border-blue-600 transition-all font-medium text-slate-900 text-sm"
                                required
                            />
                            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                <Eye size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 transition-colors group-hover:border-blue-600">
                                <input type="checkbox" className="peer absolute opacity-0 cursor-pointer" />
                                <div className="hidden peer-checked:block text-blue-600">
                                    <Shield size={12} fill="currentColor" />
                                </div>
                            </div>
                            <span className="text-sm font-bold text-slate-500">Remember me</span>
                        </label>
                        <a href="#" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 sm:py-4 bg-[#2563eb] text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-xl shadow-blue-200/50 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-2"
                    >
                        Sign In
                    </button>
                </form>

                <div className="relative my-6 sm:my-8 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <span className="relative bg-white px-4">Or continue with</span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <button className="flex items-center justify-center gap-2 sm:gap-3 py-3 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-bold text-slate-700">Google</span>
                    </button>
                    <button className="flex items-center justify-center gap-2 sm:gap-3 py-3 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all group">
                        <Shield className="text-slate-900" size={18} />
                        <span className="text-xs sm:text-sm font-bold text-slate-700">GitHub</span>
                    </button>
                </div>
            </motion.div>

            <div className="mt-6 sm:mt-8 text-center text-sm">
                <span className="text-slate-500 font-medium">Don't have an account? </span>
                <button className="text-blue-600 font-black hover:underline tracking-tight">Start your 14-day free trial</button>
            </div>

            <div className="mt-8 sm:mt-12 flex items-center gap-6 sm:gap-10 opacity-30 grayscale saturate-0 pointer-events-none">
                <div className="flex items-center gap-2">
                    <Shield size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">SOC2 TYPE II</span>
                </div>
                <div className="flex items-center gap-2">
                    <Lock size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">256-BIT AES</span>
                </div>
            </div>
=======
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
>>>>>>> localcode
        </div>
    );
};

export default Login;
