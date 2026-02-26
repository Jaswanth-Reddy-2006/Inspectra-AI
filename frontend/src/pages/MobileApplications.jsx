import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Zap, CheckCircle2, LayoutGrid, MonitorSmartphone } from 'lucide-react';

const MobileApplications = () => {
    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-12 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">Cross-Platform Efficiency</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mobile Applications</h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        High-performance, user-centric mobile optimization. We simulate touch interactions, responsive bounds, and performance parity to ensure scalable cross-platform efficiency.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Mobile Simulation Metric */}
                <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-800 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Viewport Fluidity</h4>
                                <p className="text-xl font-black text-white tracking-tight">Cross-Platform Integrity</p>
                            </div>
                            <div className="w-12 h-12 rounded-3xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                <MonitorSmartphone size={24} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { view: 'iOS Web (Safari)', size: '390x844', status: 'Optimal', icon: Smartphone, color: 'text-emerald-400' },
                                { view: 'Android Web (Chrome)', size: '412x915', status: 'Optimal', icon: Smartphone, color: 'text-emerald-400' },
                                { view: 'Tablet Breakpoint', size: '768x1024', status: 'Warning', icon: LayoutGrid, color: 'text-amber-400' },
                            ].map((env, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <env.icon size={18} className="text-white/40" />
                                        <div>
                                            <p className="text-xs font-bold font-mono">{env.view}</p>
                                            <p className="text-[10px] text-white/40">{env.size}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${env.color}`}>{env.status}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                        { title: 'Touch Target Density', desc: 'Validating WCAG 2.1 touch target minimums (44x44 CSS pixels) for mobile navigation usability.', icon: CheckCircle2 },
                        { title: 'Responsive Reflow', desc: 'Analyzing layout shifts during orientation change and viewport resizing (CSS Flex/Grid constraints).', icon: LayoutGrid },
                        { title: 'Mobile Latency', desc: 'Throttling CPU and network to Fast 3G levels to ensure performance parity with high-end desktop.', icon: Zap }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                            <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
                                <feature.icon size={22} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-3">{feature.title}</h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[250px]">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileApplications;
