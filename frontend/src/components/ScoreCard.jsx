import React from 'react';
import { motion } from 'framer-motion';

const ScoreCard = ({ score }) => {
    const getColor = (s) => {
        if (s >= 80) return '#22c55e'; // Green
        if (s >= 50) return '#f59e0b'; // Amber
        return '#ef4444'; // Red
    };

    const color = getColor(score);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl card-shadow">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Overall Score</h3>
            <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-100"
                    />
                    <motion.circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke={color}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={552.92}
                        initial={{ strokeDashoffset: 552.92 }}
                        animate={{ strokeDashoffset: 552.92 - (552.92 * score) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold" style={{ color }}>{score}</span>
                    <span className="text-sm text-gray-400 font-medium">/ 100</span>
                </div>
            </div>
            <p className="mt-6 text-sm font-medium text-gray-500">
                {score >= 80 ? 'Excellent Hygiene' : score >= 50 ? 'Needs Improvement' : 'Critical Issues Detected'}
            </p>
        </div>
    );
};

export default ScoreCard;
