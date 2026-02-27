import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
    Shield,
    Rocket,
    Search,
    Activity,
    FileText,
    Link as LinkIcon,
    Zap,
    BarChart3
} from 'lucide-react';

import { useScanContext } from '../context/ScanContext';

const Home = () => {
    const { startScan, isScanning, baselineUrl, setBaselineUrl, targetUrl } = useScanContext();
    const [url, setUrl] = useState(targetUrl || '');
    const navigate = useNavigate();

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleScan = (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (url && !isScanning) {
            startScan(url, { username, password });
        }
    };

    // Auto-run removed to favor the manual 'Launch' button as requested.
    // The scan will now trigger via the form submit or the Rocket button.

    const navLinks = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Recent Scans', path: '/scans' },
        { label: 'Documentation', path: '/docs' }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col selection:bg-blue-100 selection:text-blue-700 relative overflow-hidden font-sans">
            {/* Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -left-[10%] w-[60%] sm:w-[40%] h-[40%] rounded-full bg-blue-500/[0.03] blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] -right-[10%] w-[50%] sm:w-[35%] h-[35%] rounded-full bg-indigo-500/[0.03] blur-[100px]"
                />
            </div>

            {/* Navigation Header */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100/60">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50 group-hover:rotate-6 transition-transform">
                            <Shield className="text-white" size={18} />
                        </div>
                        <span className="font-black text-lg sm:text-xl tracking-tighter text-slate-900 italic">Inspectra <span className="text-slate-400 not-italic">AI</span></span>
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-8">
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((item, idx) => (
                                <Link
                                    key={idx}
                                    to={item.path}
                                    className="text-[11px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-[0.15em]"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                        <Link
                            to="/login"
                            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-[10px] sm:text-[11px] font-black shadow-xl shadow-blue-200/50 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all uppercase tracking-wider whitespace-nowrap"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 pt-24 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8 flex flex-col items-center relative z-10">
                <div className="text-center mb-6 sm:mb-10 space-y-3 sm:space-y-4 px-2">
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-none tracking-tighter max-w-2xl mx-auto"
                    >
                        Scan. Discover. <span className="text-blue-600">Optimize.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-base sm:text-xl text-slate-400 font-medium tracking-tight max-w-xl mx-auto"
                    >
                        Start your autonomous quality scan by entering your application URL below.
                    </motion.p>
                </div>

                {/* Scan Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 p-6 sm:p-10 mb-14 sm:mb-20"
                >
                    <form onSubmit={handleScan} className="space-y-5 sm:space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Application Endpoint</label>
                            <div className="relative">
                                <div className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-300">
                                    <LinkIcon size={18} />
                                </div>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    disabled={isScanning}
                                    placeholder="https://app.your-startup.com"
                                    className="w-full pl-11 sm:pl-12 pr-4 sm:pr-6 py-4 sm:py-5 bg-slate-50 border-2 border-slate-50 rounded-xl sm:rounded-2xl outline-none focus:bg-white focus:border-blue-600/20 transition-all font-bold text-slate-900 text-sm sm:text-base placeholder:text-slate-300 shadow-inner disabled:opacity-50"
                                    required
                                />
                            </div>
                        </div>

                        {/* Advanced Settings Toggle */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
                            >
                                <Zap size={12} className={showAdvanced ? 'fill-current' : ''} />
                                {showAdvanced ? 'Hide Advanced Settings' : 'Add Authentication Credentials'}
                            </button>
                        </div>

                        {showAdvanced && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4 pt-2"
                            >
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Baseline URL (for Comparisons)</label>
                                    <input
                                        type="url"
                                        value={baselineUrl}
                                        onChange={(e) => setBaselineUrl(e.target.value)}
                                        placeholder="https://production.site.com"
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-600/20 transition-all font-bold text-slate-900 text-xs shadow-inner"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Username</label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Test User"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-600/20 transition-all font-bold text-slate-900 text-xs shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-[0.2em]">Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-600/20 transition-all font-bold text-slate-900 text-xs shadow-inner"
                                        />
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-medium leading-relaxed bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                                    Controlled Authentication Mode: Inspectra will attempt to log in using these credentials to perform a deep scan of protected routes.
                                </p>
                            </motion.div>
                        )}

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={isScanning || !url}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs sm:text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 group"
                            >
                                {isScanning ? (
                                    <>
                                        <Activity size={18} className="animate-pulse" />
                                        <span>Pipeline Active...</span>
                                    </>
                                ) : (
                                    <>
                                        <Rocket size={18} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                                        <span>Launch Full Scan</span>
                                    </>
                                )}
                            </button>

                            <div className="w-full py-4 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2">
                                {isScanning ? (
                                    <p className="text-[10px] text-slate-400 font-bold animate-pulse">Scanning application nodes & assets…</p>
                                ) : (
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-60"></p>
                                )}
                            </div>
                        </div>
                    </form>
                </motion.div>

                {/* Audit Cards Grid */}
                <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                    {[
                        {
                            icon: <Search className="text-blue-600" size={24} />,
                            title: "Behavioral Discovery",
                            text: "Agent automatically crawls your entire application identifying every interactive element with high fidelity."
                        },
                        {
                            icon: <Activity className="text-blue-600" size={24} />,
                            title: "Deep Quality Scan",
                            text: "Advanced analysis of accessibility (axe-core), performance bottlenecks, and critical security flaws."
                        },
                        {
                            icon: <FileText className="text-blue-600" size={24} />,
                            title: "Smart Reporting",
                            text: "Receive detailed actionable feedback, screenshots, and Jira-ready bug reports automatically."
                        }
                    ].map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * idx }}
                            className="bg-white p-7 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                        >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-5 sm:mb-8 group-hover:scale-110 transition-transform">
                                {card.icon}
                            </div>
                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mb-3">{card.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed tracking-tight text-sm">
                                {card.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Home;
