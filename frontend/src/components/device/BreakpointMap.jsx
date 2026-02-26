import React from 'react';

const BreakpointMap = ({ telemetry }) => {
    return (
        <div className="bg-[#121a2f] border border-slate-800 flex flex-col shrink-0 min-h-[160px]">
            <div className="p-3 border-b border-slate-800 bg-[#0b101e] flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Breakpoint Graph</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded">
                    Optimization Score: {telemetry.advanced.breakpointOptimizationScore}%
                </span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-[11px] bg-[#0b101e]">
                {telemetry.breakpoints.map((bp, i) => {
                    const isVulnerable = telemetry.vulnerableViewport.includes(bp.width.toString());
                    return (
                        <div key={i} className={`flex flex-col relative bg-[#121a2f] p-3 border hover:border-blue-500/50 transition-colors ${isVulnerable ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-red-950/20' : 'border-slate-800/50'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-blue-400 font-bold text-[14px]">{bp.width}px</span>
                                <div className={`px-2 py-0.5 uppercase tracking-widest text-[9px] border ${bp.status === 'Active' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : bp.status === 'Redundant' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10'}`}>
                                    {bp.status}
                                </div>
                            </div>
                            <span className="text-slate-500 text-[10px]">{bp.type}</span>
                            {isVulnerable && (
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-bold uppercase px-2 py-0.5 rounded shadow whitespace-nowrap z-10">
                                    Structural Threshold Detector 🔥
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default BreakpointMap;
