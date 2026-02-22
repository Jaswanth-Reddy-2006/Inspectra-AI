import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SeverityChart = ({ summary }) => {
    const data = [
        { name: 'Critical', value: summary.critical, color: '#ef4444' },
        { name: 'High', value: summary.high, color: '#f97316' },
        { name: 'Medium', value: summary.medium, color: '#f59e0b' },
        { name: 'Low', value: summary.low, color: '#2563eb' },
    ].filter(item => item.value > 0);

    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-white rounded-3xl card-shadow p-8">
                <p className="text-muted-foreground italic">No issues detected</p>
            </div>
        );
    }

    return (
        <div className="h-64 bg-white rounded-3xl card-shadow p-8 flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Severity Distribution</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SeverityChart;
