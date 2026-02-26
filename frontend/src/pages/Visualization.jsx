import React from 'react';
import { motion } from 'framer-motion';
import { Network, FileText, BarChart3, Presentation, Download } from 'lucide-react';

const Visualization = () => {
    return (
        <div className="max-w-[1600px] mx-auto p-6 lg:p-12 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Data Topography</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Visualization</h1>
                    </div>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Insightful dashboards and visual reports designed for clear defect tracking and executive decision-making. We transform raw code issues into interactive graphs.
                    </p>
                </div>
                <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all hover:shadow-2xl hover:shadow-slate-200">
                    <Download size={18} />
                    Export Analytics
                </button>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-12 border border-slate-800 text-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://inspectra.ai/pattern-bg.png')] opacity-5" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between lg:items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Network size={24} className="text-indigo-400" />
                            <h2 className="text-2xl font-black tracking-tight">Defect Knowledge Graph</h2>
                        </div>
                        <p className="text-slate-400 font-medium max-w-lg mb-8 leading-relaxed">
                            Maps relational dependencies between failing components and their parents. This intelligent visualization reveals cascading logic errors across your architecture.
                        </p>
                        <ul className="space-y-4">
                            {[
                                '3D Node Proximity Clustering',
                                'Severity Color-Coded Edges',
                                'Interactive Drilldown Layers',
                            ].map((li, i) => (
                                <li key={i} className="flex gap-3 text-sm font-black text-indigo-200 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                                    {li}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Faux graph rendering visual */}
                    <div className="w-full md:w-1/2 min-h-[300px] bg-slate-800/50 rounded-[2rem] border border-white/10 flex items-center justify-center p-8 relative">
                        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-indigo-600/20 rounded-full blur-[50px] -translate-x-1/2 -translate-y-1/2" />

                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="w-full h-full relative border-2 border-dashed border-white/5 rounded-full p-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                            <div className="absolute bottom-1/4 right-0 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                            <div className="absolute bottom-1/4 left-0 w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            <div className="w-full h-full border border-white/10 rounded-full flex items-center justify-center">
                                <div className="w-1/2 h-1/2 bg-indigo-600 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { label: 'Executive Reporting', desc: 'Pre-compiled PDF matrices ready for stakeholder presentations.', icon: Presentation, color: 'text-emerald-600' },
                    { label: 'Continuous Metrics', desc: 'Historical quality trending and remediation velocity tracking.', icon: BarChart3, color: 'text-amber-600' }
                ].map((card, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} className="bg-white p-8 lg:p-10 rounded-[3rem] border border-slate-100 shadow-sm"
                    >
                        <div className={`w-14 h-14 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-6`}>
                            <card.icon size={26} className={card.color} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">{card.label}</h3>
                        <p className="text-sm font-medium text-slate-500 max-w-[300px]">{card.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Visualization;
