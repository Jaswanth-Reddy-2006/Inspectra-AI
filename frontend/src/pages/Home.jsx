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

const Home = ({ onScanStart, isScanning }) => {
    const [url, setUrl] = useState('');
    const navigate = useNavigate();

    const handleScan = (e) => {
        e.preventDefault();
        if (url && !isScanning) onScanStart(url);
    };

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
                        <span className="font-black text-lg sm:text-xl tracking-tighter text-slate-900 italic">AutoQA <span className="text-slate-400 not-italic">Agent</span></span>
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
            <main className="flex-1 pt-28 sm:pt-40 pb-16 sm:pb-24 px-5 sm:px-8 flex flex-col items-center relative z-10">
                <div className="text-center mb-10 sm:mb-14 space-y-3 sm:space-y-4 px-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                    >
                        <Zap size={12} className="fill-current" />
                        Next-Gen Automation
                    </motion.div>
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

                        <button
                            type="submit"
                            disabled={isScanning}
                            className={`w-full py-3.5 sm:py-4 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-200/50 transition-all flex items-center justify-center gap-2.5 ${isScanning ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 active:scale-[0.98] hover:scale-[1.01]'}`}
                        >
                            {isScanning ? (
                                <>
                                    <Activity size={16} className="animate-pulse" />
                                    Agent Initializing...
                                </>
                            ) : (
                                <>
                                    <Rocket size={16} className="fill-current" />
                                    Launch AutoQA Scan
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-8 sm:gap-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] pt-8 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-blue-600/50" /> Security
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-blue-600/50" /> Fast
                        </div>
                        <div className="flex items-center gap-2">
                            <FileText size={14} className="text-blue-600/50" /> Reports
                        </div>
                    </div>
                </motion.div>

                {/* Audit Cards Grid */}
                <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
                    {[
                        {
                            icon: <Search className="text-blue-600" size={24} />,
                            title: "Autonomous Discovery",
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
