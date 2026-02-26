import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const ArchitectureRadar = ({ telemetry }) => {
    const radarData = useMemo(() => [
        { subject: 'Responsive Cov.', A: telemetry.radar.coverage, fullMark: 100 },
        { subject: 'Layout Stabil.', A: telemetry.radar.layout, fullMark: 100 },
        { subject: 'Touch Access.', A: telemetry.radar.touch, fullMark: 100 },
        { subject: 'Perf. Degrade.', A: telemetry.radar.performance, fullMark: 100 },
        { subject: 'Breakpoint Opt.', A: telemetry.radar.breakpoints, fullMark: 100 },
    ], [telemetry]);

    const renderPolarAxis = (props) => {
        const { payload, x, y, cx, cy, ...rest } = props;
        return (
            <text {...rest} x={x} y={y} cx={cx} cy={cy} className="fill-slate-400 font-bold" fontSize="10" textAnchor="middle">
                {payload.value}
            </text>
        );
    };

    return (
        <div className="bg-[#121a2f] border border-slate-800 flex flex-col p-6 shrink-0 h-full">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Dimension Integrity</h3>
            <div className="flex-1 w-full relative min-h-[160px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={renderPolarAxis} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} hide />
                        <Radar
                            name="Architecture"
                            dataKey="A"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="#3b82f6"
                            fillOpacity={0.2}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default React.memo(ArchitectureRadar);
