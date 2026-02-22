import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const PageTable = ({ pages }) => {
    const [expandedRow, setExpandedRow] = useState(null);

    const getSeverityColor = (severity) => {
        switch (severity.toLowerCase()) {
            case 'critical': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-amber-600 bg-amber-50';
            case 'low': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity.toLowerCase()) {
            case 'critical': return <AlertCircle className="w-4 h-4" />;
            case 'high': return <AlertTriangle className="w-4 h-4" />;
            default: return <Info className="w-4 h-4" />;
        }
    };

    return (
        <div className="bg-white rounded-3xl card-shadow overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Scanned Pages</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                            <th className="px-6 py-4">URL</th>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4">Issues</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pages.map((page, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-xs">{page.url}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${page.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {page.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{page.issues.length}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                            {expandedRow === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === idx && (
                                    <tr className="bg-gray-50/50">
                                        <td colSpan="4" className="px-6 py-4">
                                            <div className="space-y-3">
                                                {page.issues.length === 0 ? (
                                                    <p className="text-sm text-gray-500 italic">No issues found on this page.</p>
                                                ) : (
                                                    page.issues.map((issue, iIdx) => (
                                                        <div key={iIdx} className="flex items-start gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                            <span className={`p-1.5 rounded-lg ${getSeverityColor(issue.severity)}`}>
                                                                {getSeverityIcon(issue.severity)}
                                                            </span>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-800">{issue.type}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{issue.description}</p>
                                                            </div>
                                                            <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getSeverityColor(issue.severity)}`}>
                                                                {issue.severity}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PageTable;
