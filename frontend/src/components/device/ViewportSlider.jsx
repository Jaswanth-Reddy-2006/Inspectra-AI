import React, { useState, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

const ViewportSlider = ({ telemetry, viewportWidth, setViewportWidth }) => {
    // Add debounce locally if needed, but for smooth dragging we might just use the native onChange.
    // To prevent iframe lag, we could debounce the iframe style update, but keeping it simple for now.

    const handlePresetClick = (val) => setViewportWidth(val);

    return (
        <div className="h-24 bg-[#121a2f] border-t border-slate-800 p-4 flex flex-col shrink-0">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <MoveHorizontal size={12} /> Dimension Checksum Slider
                </span>
                <div className="flex gap-2">
                    <button onClick={() => handlePresetClick(390)} className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition">390 (M)</button>
                    <button onClick={() => handlePresetClick(768)} className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition">768 (T)</button>
                    <button onClick={() => handlePresetClick(1440)} className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition">1440 (D)</button>
                </div>
            </div>

            <div className="relative w-full h-8 flex items-center">
                <input
                    type="range"
                    min="320" max="2560"
                    value={viewportWidth}
                    onChange={(e) => setViewportWidth(parseInt(e.target.value, 10))}
                    className="absolute w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-ew-resize z-10"
                />
                {telemetry.breakpoints.map((bp, i) => {
                    // Map 320-2560 to 0%-100%
                    const leftPos = ((bp.width - 320) / (2560 - 320)) * 100;
                    let bpColor = 'bg-blue-500';
                    if (bp.status === 'Redundant') bpColor = 'bg-amber-500';
                    if (bp.status === 'Conflict') bpColor = 'bg-red-500';

                    return (
                        <div key={i} className="absolute h-4 w-1 flex flex-col items-center group z-0" style={{ left: `${leftPos}%` }}>
                            <div className={`h-full w-full ${bpColor} opacity-40 group-hover:opacity-100 transition`} />
                            <span className="text-[9px] font-mono text-slate-500 absolute top-5 opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-slate-900 border border-slate-800 px-1 z-20">{bp.width}px</span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default ViewportSlider;
