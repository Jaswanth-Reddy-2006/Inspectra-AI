import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

const Projects = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-80px)] bg-white flex flex-col items-center justify-center overflow-hidden relative px-5 sm:px-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-3xl w-full flex flex-col items-center text-center"
            >
                {/* Blueprint Build Illustration */}
                <div className="relative w-56 h-56 sm:w-80 sm:h-80 mb-8 sm:mb-12 flex items-center justify-center">
                    {/* Technical Grid Background */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 rounded-[3rem] sm:rounded-[4rem] bg-slate-50/50 border border-slate-100 overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-[0.2]" style={{
                            backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }} />
                        <motion.div
                            animate={{ x: ['-10%', '10%'], y: ['-10%', '10%'] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
                            className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent"
                        />
                    </motion.div>

                    <div className="relative">
                        {/* Floating pages */}
                        <AnimatePresence>
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: 20, opacity: 0, scale: 0.8, rotateX: 45 }}
                                    animate={{
                                        y: -70 - (i * 20),
                                        opacity: [0, 0.6, 0],
                                        scale: [0.8, 1.1, 0.9],
                                        rotateX: [30, 0, -30],
                                        x: (i % 2 === 0 ? 25 : -25)
                                    }}
                                    transition={{ duration: 5, repeat: Infinity, delay: i * 1.5, ease: "easeInOut" }}
                                    className="absolute left-6 top-0 w-10 h-14 bg-white border border-blue-100 rounded-lg shadow-xl z-0 flex flex-col gap-1.5 p-2"
                                    style={{ perspective: "1000px" }}
                                >
                                    <div className="w-full h-1 bg-blue-100 rounded-full" />
                                    <div className="w-3/4 h-1 bg-slate-100 rounded-full" />
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Folder SVG */}
                        <div className="relative z-10">
                            <motion.div
                                animate={{ rotateY: [-3, 3, -3], y: [0, -6, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <svg width="90" height="75" viewBox="0 0 24 20" fill="none" className="drop-shadow-[0_15px_15px_rgba(37,99,235,0.2)]">
                                    <path d="M22 18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V4C2 2.89543 2.89543 2 4 2H9.5L11.5 4H20C21.1046 4 22 4.89543 22 6V18Z" fill="#2563eb" />
                                    <motion.path
                                        animate={{ skewY: [-1, 1, -1] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                        d="M2 8C2 6.89543 2.89543 6 4 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V8Z"
                                        fill="rgba(255,255,255,0.15)"
                                    />
                                </svg>
                            </motion.div>

                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-blue-50"
                            >
                                <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center">
                                    <Plus size={14} className="text-white" strokeWidth={3} />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12 px-4">
                    <h2 className="text-2xl sm:text-[32px] font-black text-[#0f172a] tracking-tight">No projects yet</h2>
                    <p className="text-sm sm:text-base font-semibold text-slate-400 leading-relaxed max-w-lg mx-auto">
                        This is where your quality-guaranteed projects will live. Start building your ecosystem by initializing your first scan profile.
                    </p>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center w-full max-w-[260px]">
                    <button
                        onClick={() => navigate('/home')}
                        className="bg-[#2563eb] text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl shadow-blue-200/50 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 w-full"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>Create New Project</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Projects;
