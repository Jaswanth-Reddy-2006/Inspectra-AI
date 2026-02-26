import React from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

const IntegrityMatrix = ({ telemetry, activeView, setActiveView }) => {
    return (
        <div className="bg-[#121a2f] border border-slate-800 flex flex-col w-full h-full">
            <div className="p-3 border-b border-slate-800 bg-[#0b101e]">
                <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Cross-Device Integrity Matrix</h3>
            </div>
            <div className="flex-1 w-full p-0">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-[#0b101e]/80 border-b border-slate-800/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 z-10">
                            <th className="p-3 font-medium w-[180px]">Device</th>
                            <th className="p-3 font-medium text-center w-[80px]">Score</th>
                            <th className="p-3 font-medium text-center w-[110px]">Orientation</th>
                            <th className="p-3 font-medium text-center w-[110px]">Interaction</th>
                            <th className="p-3 font-medium text-center w-[100px]">Overflow</th>
                            <th className="p-3 font-medium w-[110px]">Stability</th>
                        </tr>
                    </thead>
                    <tbody>
                        {telemetry.integrityMatrix.map((row, i) => {
                            const isActive = activeView?.class === row.class;
                            return (
                                <tr
                                    key={i}
                                    onClick={() => setActiveView(row)}
                                    className={`border-b border-slate-800/50 cursor-pointer transition-colors text-[12px] font-mono group ${isActive ? 'bg-blue-900/40 text-white border-l-2 border-l-blue-500' : 'hover:bg-[#1a233a] text-slate-300 hover:text-white border-l-2 border-l-transparent'}`}
                                >
                                    <td className="p-3 flex items-center gap-2">
                                        {row.class.includes('Phone') ? <Smartphone size={14} className="text-slate-500" /> : row.class.includes('Tablet') ? <Tablet size={14} className="text-slate-500" /> : <Monitor size={14} className="text-slate-500" />}
                                        <div className="flex flex-col">
                                            <span className={`font-bold transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`}>{row.class}</span>
                                            <span className="text-[9px] text-slate-500">{row.size}</span>
                                        </div>
                                    </td>
                                    <td className={`p-3 text-center ${row.score < 75 ? 'text-red-400' : 'text-emerald-400'} font-bold`}>{row.score}</td>
                                    <td className={`p-3 text-center ${row.orientationScore < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>{row.orientationScore}%</td>
                                    <td className={`p-3 text-center opacity-80`}>{row.interactionDensity}</td>
                                    <td className="p-3 text-center">
                                        <span className={`${row.overflowSeverity !== 'None' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'} border px-2 py-0.5 rounded text-[10px]`}>
                                            {row.overflowSeverity}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${row.stability === 'Weak' ? 'text-red-400' : row.stability === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>{row.stability}</span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default React.memo(IntegrityMatrix);
