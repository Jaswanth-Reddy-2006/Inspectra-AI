import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, BookOpen, ChevronRight, Search, FileText, Code, Zap } from 'lucide-react';

const Documentation = () => {
    const sections = [
        { title: 'Getting Started', icon: <Zap className="text-blue-600" />, items: ['Introduction', 'Core Concepts', 'Quick Start Guide'] },
        { title: 'Agent Configuration', icon: <Code className="text-blue-600" />, items: ['Playwright Integration', 'Environment Variables', 'Custom Selectors'] },
        { title: 'API Reference', icon: <FileText className="text-blue-600" />, items: ['Authentication', 'Scan Endpoint', 'Reporting API'] },
    ];

    return (
        <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-700">
            <nav className="h-16 border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Shield className="text-white" size={18} />
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-slate-800">Auto<span className="text-slate-900">QA</span> Docs</span>
                </Link>
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search documentation..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-4 ring-blue-50"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/home" className="text-sm font-bold text-blue-600">Back to App</Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 py-20 flex gap-20">
                <aside className="w-64 shrink-0 space-y-10">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                {section.icon}
                                <h4 className="font-black text-xs uppercase tracking-widest text-slate-900">{section.title}</h4>
                            </div>
                            <div className="space-y-1">
                                {section.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer group transtion-colors">
                                        <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600">{item}</span>
                                        <ChevronRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </aside>

                <section className="flex-1 max-w-3xl">
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">Guide</div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Getting Started with AutoQA</h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                Learn how to deploy your first autonomous QA agent in minutes. Our platform leverages high-fidelity Playwright environments to simulate real user behavior at scale.
                            </p>
                        </div>

                        <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Installation</span>
                                </div>
                                <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Copy</button>
                            </div>
                            <code className="block font-mono text-sm text-slate-300">
                                npm install @autoqa/agent-cli --global
                            </code>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">System Requirements</h3>
                            <ul className="space-y-4">
                                {[
                                    'Node.js 18.x or higher',
                                    'Access to application URL via public internet or tunnel',
                                    'Playwright dependencies (installed automatically)',
                                    'API Key for CI/CD integration'
                                ].map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-4 text-slate-500 font-medium">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Documentation;
