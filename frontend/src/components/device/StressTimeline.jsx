import React from 'react';
import { Terminal } from 'lucide-react';

const StressTimeline = ({ telemetry }) => {
    return (
        <div className="bg-[#121a2f] border border-slate-800 flex flex-col w-full h-full min-h-[250px] max-h-[400px]">
            <div className="p-3 border-b border-slate-800 bg-[#0b101e] flex justify-between items-center shrink-0">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} /> Stress Timeline
                </h3>
            </div>
            <div className="p-4 font-mono text-[11px] text-slate-400 overflow-y-auto space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-800 shadow-inner bg-[#0b101e]">
                {telemetry.timeline.map((step, idx) => {
                    const err = step.status === 'error';
                    const warn = step.status === 'warn';
                    return (
                        <div key={idx} className="flex gap-4">
                            <span className="text-slate-600 shrink-0 w-12 text-right">[{step.time}]</span>
                            <span className={`${err ? 'text-red-400 font-bold' : warn ? 'text-orange-400' : 'text-slate-300'}`}>
                                » {step.event}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default StressTimeline;
