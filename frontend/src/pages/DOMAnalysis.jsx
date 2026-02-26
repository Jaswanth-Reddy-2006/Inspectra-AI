import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Info,
    MousePointer2,
    Target,
    ShieldAlert,
    BarChart3,
    RefreshCw,
    Globe,
    ExternalLink,
    Brain,
    Activity,
    Loader2,
    Zap,
    Clock,
    ShieldCheck,
    Accessibility,
    Box,
    Crosshair,
    Network,
    Bug,
    Sparkles
} from 'lucide-react';
import { API_BASE } from '../services/config';

// ── Components ────────────────────────────────────────────────────────────────

const TreeNode = ({ node, depth = 0, onSelect, selectedId }) => {
    const [isOpen, setIsOpen] = useState(depth < 1);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
        <div className="select-none">
            <motion.div
                whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (hasChildren) setIsOpen(!isOpen);
                    if (onSelect) onSelect(node);
                }}
                className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
            >
                <div style={{ width: depth * 12 }} />
                {hasChildren ? (
                    isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                ) : (
                    <div className="w-3" />
                )}
                <span className={`text-[10px] font-black uppercase tracking-tighter`}>{node.tag}</span>
                <span className="text-[9px] text-slate-400 truncate max-w-[100px]">{node.text || node.id || ''}</span>
            </motion.div>
            {isOpen && hasChildren && (
                <div className="overflow-hidden">
                    {node.children.map((child, i) => (
                        <TreeNode
                            key={i}
                            node={child}
                            depth={depth + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function DOMAnalysis() {
    const { targetUrl: globalUrl, scanResult } = useScanContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [error, setError] = useState(null);
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedRisk, setSelectedRisk] = useState(null);
    const [activeTab, setActiveTab] = useState('interactions'); // interactions, risks, selectors, metrics
    const [sidebarTab, setSidebarTab] = useState('tree'); // tree, pages
    const [activePageUrl, setActivePageUrl] = useState(globalUrl);

    // Sync with global URL changes (e.g. from TopBar)
    useEffect(() => {
        if (globalUrl) setActivePageUrl(globalUrl);
    }, [globalUrl]);

    const fetchAnalysis = useCallback(async (urlToAnalyze) => {
        const url = urlToAnalyze || activePageUrl;
        if (!url) return;
        setLoading(true);
        setError(null);
        setSelectedElement(null);
        setSelectedRisk(null);

        const statuses = ["Analyzing DOM Structure...", "Classifying Page Intent...", "Mapping User Actions...", "Calculating Stability Scores..."];
        let statusIdx = 0;
        const interval = setInterval(() => {
            if (statusIdx < statuses.length) {
                setLoadingStatus(statuses[statusIdx]);
                statusIdx++;
            }
        }, 1200);

        try {
            const res = await fetch(`${API_BASE}/api/dom/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const result = await res.json();
            if (result.success) {
                setData(result);
                if (result.selectorAnalysis?.[0]) setSelectedElement(result.selectorAnalysis[0]);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    }, [activePageUrl]);

    useEffect(() => { fetchAnalysis(); }, [fetchAnalysis]);

    const handlePageChange = (newUrl) => {
        if (newUrl === activePageUrl) return;
        setData(null); // Clear old data to show loading
        setActivePageUrl(newUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!globalUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#f8fafc]">
                <Globe size={40} className="text-indigo-400 mb-6 animate-pulse" />
                <h2 className="text-2xl font-black text-slate-800 mb-2">Initialize Intelligence Engine</h2>
                <p className="text-slate-500 text-center max-w-md font-medium">Connect to a live domain to start the autonomous page understanding process.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#f8fafc]">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Brain size={32} className="text-indigo-600 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-black text-slate-800 mt-8 mb-2 tracking-tight">Autonomous Page Understanding</h2>
                <p className="text-indigo-500 font-black uppercase tracking-[0.2em] text-[10px]">{loadingStatus}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-[#f1f5f9] p-10">
                <AlertCircle size={48} className="text-rose-500 mb-4" />
                <h2 className="text-xl font-black text-slate-800 mb-2">Analysis Pipeline Error</h2>
                <p className="text-slate-500 mb-6 max-w-sm text-center font-medium leading-relaxed">{error}</p>
                <button onClick={() => fetchAnalysis()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Retry Intelligence Engine</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-sans">
            {/* 1. TOP HERO PANEL - PAGE UNDERSTANDING */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 z-30 shadow-sm shrink-0">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="bg-indigo-600 p-4 rounded-[1.5rem] shadow-lg shadow-indigo-200">
                            <Brain size={28} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">Page Intelligence Engine</h1>
                                <span className="px-3 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Live Agent v4.2</span>
                            </div>
                            <div className="flex items-center gap-6">
                                {scanResult?.pages?.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <Globe size={13} className="text-indigo-400" />
                                        <select
                                            value={activePageUrl}
                                            onChange={(e) => handlePageChange(e.target.value)}
                                            className="bg-transparent border-none p-0 text-[11px] font-bold text-indigo-600 uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-indigo-700"
                                        >
                                            {scanResult.pages.map(p => (
                                                <option key={p.url} value={p.url}>
                                                    {p.url.replace(/^https?:\/\//, '')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                                        <Globe size={13} /> {activePageUrl}
                                    </p>
                                )}
                                <div className="h-3 w-px bg-slate-200" />
                                <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                                    <Clock size={13} /> Analyzed in 2.4s
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="grid grid-cols-4 gap-8">
                            <div className="text-center group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Page Type</p>
                                <p className="text-sm font-black text-slate-800">{data?.pageType || 'Detecting...'}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Primary Goal</p>
                                <p className="text-sm font-black text-slate-800">{data?.pageUnderstanding?.primaryGoal || 'Analyzing...'}</p>
                            </div>
                            <div className="text-center group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Path</p>
                                <div className="flex items-center gap-1 justify-center">
                                    <p className="text-sm font-black text-slate-800">{data?.pageUnderstanding?.criticalUserPath?.[0] || 'N/A'}</p>
                                    {data?.pageUnderstanding?.criticalUserPath?.length > 1 && (
                                        <>
                                            <ChevronRight size={12} className="text-slate-300" />
                                            <span className="text-[10px] text-slate-400 font-bold">+{data.pageUnderstanding.criticalUserPath.length - 1} more</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="text-center group">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${data?.pageUnderstanding?.confidenceScore || 0}%` }} className="h-full bg-emerald-500" />
                                    </div>
                                    <p className="text-sm font-black text-emerald-600">{data?.pageUnderstanding?.confidenceScore || 0}%</p>
                                </div>
                            </div>
                        </div>
                        {/* Manual refresh button removed for autonomous workflow */}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 2. LEFT PANEL - INTERACTIVE DOM TREE / SITE MAP */}
                <div className="w-[300px] bg-white border-r border-slate-200 flex flex-col shrink-0">
                    <div className="flex border-b border-slate-100">
                        <button
                            onClick={() => setSidebarTab('tree')}
                            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'tree' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Structural Map
                        </button>
                        <button
                            onClick={() => setSidebarTab('pages')}
                            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'pages' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Site Map
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        {sidebarTab === 'tree' ? (
                            <div className="space-y-1">
                                {data?.domTree ? (
                                    <TreeNode
                                        node={data.domTree}
                                        onSelect={(node) => {
                                            const interactive = data.selectorAnalysis.find(el => el.tag === node.tag && (el.text?.includes(node.text) || el.id === node.id));
                                            if (interactive) setSelectedElement(interactive);
                                        }}
                                        selectedId={selectedElement?.id}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 opacity-40">
                                        <Loader2 size={24} className="animate-spin mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Parsing DOM...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {scanResult?.pages && scanResult.pages.length > 0 ? (
                                    scanResult.pages.map((p, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handlePageChange(p.url)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${activePageUrl === p.url ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 hover:border-indigo-200 group'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${p.score > 80 ? (activePageUrl === p.url ? 'bg-white' : 'bg-emerald-500') : (activePageUrl === p.url ? 'bg-white' : 'bg-amber-500')}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${activePageUrl === p.url ? 'text-indigo-100' : 'text-slate-400'}`}>Route {i + 1}</span>
                                                </div>
                                                <span className={`text-[10px] font-black ${activePageUrl === p.url ? 'text-white' : p.score > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{Math.round(p.score)}%</span>
                                            </div>
                                            <p className={`text-[11px] font-bold truncate ${activePageUrl === p.url ? 'text-white' : 'text-slate-800'}`}>{p.url.replace(/^https?:\/\//, '')}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                        <Sparkles size={24} className="text-slate-200 mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No Discovery Data</p>
                                        <p className="text-[10px] font-medium text-slate-300">Run a session-wide scan to populate the Site Intelligence map.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. CENTER PANEL - LIVE SITE PREVIEW */}
                <div className="flex-1 bg-slate-100/50 flex flex-col overflow-hidden relative">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 px-6 py-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200 border border-white flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider uppercase">Optical Preview Sync</span>
                        </div>
                        <div className="h-3 w-px bg-slate-200" />
                        <span className="text-[10px] font-bold text-slate-400">{data?.dimensions?.w}px × {data?.dimensions?.h}px</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-12 pt-24 flex justify-center items-start">
                        {data?.screenshot ? (
                            <div className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] rounded-3xl border border-white overflow-hidden bg-white shrink-0 group"
                                style={{ width: '100%', maxWidth: '1280px' }}>
                                <img src={data.screenshot} className="w-full h-auto block" alt="Intelligence Preview" />

                                {/* Intelligent Overlays */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {selectedElement?.rect && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute border-4 border-indigo-500 bg-indigo-500/10 shadow-[0_0_80px_rgba(99,102,241,0.6)] z-50 rounded-xl"
                                            style={{
                                                left: `${(selectedElement.rect.x / 1280) * 100}%`,
                                                top: `${(selectedElement.rect.y / (data?.dimensions?.h || 800)) * 100}%`,
                                                width: `${(selectedElement.rect.w / 1280) * 100}%`,
                                                height: `${(selectedElement.rect.h / (data?.dimensions?.h || 800)) * 100}%`
                                            }}
                                        >
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-2xl flex items-center gap-3">
                                                <Target size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{selectedElement.tag} #{selectedElement.id || 'dynamic'}</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Selected Risk Highlight */}
                                    {selectedRisk?.rect && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="absolute border-4 border-rose-500 bg-rose-500/10 shadow-[0_0_80px_rgba(244,63,94,0.6)] z-50 rounded-xl"
                                            style={{
                                                left: `${(selectedRisk.rect.x / 1280) * 100}%`,
                                                top: `${(selectedRisk.rect.y / (data?.dimensions?.h || 800)) * 100}%`,
                                                width: `${(selectedRisk.rect.w / 1280) * 100}%`,
                                                height: `${(selectedRisk.rect.h / (data?.dimensions?.h || 800)) * 100}%`
                                            }}
                                        >
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 bg-rose-600 text-white rounded-xl shadow-2xl flex items-center gap-3">
                                                <Bug size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{selectedRisk.type}</span>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Interaction Action Dots */}
                                    {data.interactionMap?.actions?.map((action, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-sm border-2 border-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair pointer-events-auto"
                                            style={{
                                                left: `${((action.element.rect.x + action.element.rect.w / 2) / 1280) * 100}%`,
                                                top: `${((action.element.rect.y + action.element.rect.h / 2) / (data?.dimensions?.h || 800)) * 100}%`
                                            }}
                                            onClick={() => { setSelectedElement(action.element); setSelectedRisk(null); }}
                                        >
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                        </div>
                                    ))}

                                    {/* Risk/Bug Markers */}
                                    {data.risks?.filter(r => r.rect).map((risk, i) => (
                                        <motion.div
                                            key={`risk-${i}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 bg-rose-500/20 backdrop-blur-sm border-2 border-rose-500 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto z-40 group/bug"
                                            style={{
                                                left: `${((risk.rect.x + risk.rect.w / 2) / 1280) * 100}%`,
                                                top: `${((risk.rect.y + risk.rect.h / 2) / (data?.dimensions?.h || 800)) * 100}%`
                                            }}
                                            onClick={() => { setSelectedRisk(risk); setSelectedElement(null); setActiveTab('risks'); }}
                                        >
                                            <Bug size={14} className="text-rose-600 animate-pulse group-hover/bug:scale-125 transition-transform" />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full w-full">
                                <Loader2 className="animate-spin text-slate-200" size={64} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. RIGHT PANEL - INTELLIGENCE TABS */}
                <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col shrink-0">
                    <div className="flex border-b border-slate-100 p-2">
                        {[
                            { id: 'interactions', icon: MousePointer2, label: 'Interactions' },
                            { id: 'risks', icon: ShieldAlert, label: 'Risks' },
                            { id: 'selectors', icon: Target, label: 'Selectors' },
                            { id: 'metrics', icon: Activity, label: 'Intelligence' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <tab.icon size={18} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'interactions' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(data?.interactionMap?.groupedActions || {}).map(([key, val]) => (
                                            <div key={key} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{key}</p>
                                                <p className="text-xl font-black text-slate-800">{val}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={12} className="text-amber-500" /> Intent Detected Actions
                                        </h4>
                                        {data?.interactionMap?.actions?.map((action, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setSelectedElement(action.element)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedElement === action.element ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedElement === action.element ? 'text-indigo-200' : 'text-indigo-600'}`}>{action.type}</span>
                                                    <span className={`text-[9px] font-bold ${selectedElement === action.element ? 'text-white/60' : 'text-slate-400'}`}>Score: {action.importanceScore}</span>
                                                </div>
                                                <p className={`text-[11px] font-black leading-tight ${selectedElement === action.element ? 'text-white' : 'text-slate-800'}`}>{action.element.text || 'Process interaction block'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'risks' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                                    {data?.risks?.map((risk, i) => (
                                        <div key={i}
                                            onClick={() => risk.rect && setSelectedRisk(risk)}
                                            className={`p-5 border rounded-[1.5rem] flex gap-4 transition-all cursor-pointer ${selectedRisk === risk ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-100' : 'bg-rose-50 border-rose-100 hover:border-rose-300'}`}
                                        >
                                            <div className={`p-3 rounded-2xl shadow-sm h-fit ${selectedRisk === risk ? 'bg-white/20' : 'bg-white'}`}>
                                                <Bug size={20} className={selectedRisk === risk ? 'text-white' : 'text-rose-500'} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`text-[11px] font-black uppercase tracking-widest ${selectedRisk === risk ? 'text-rose-100' : 'text-rose-800'}`}>{risk.type}</h4>
                                                    {risk.rect && <Target size={12} className={selectedRisk === risk ? 'text-rose-300' : 'text-rose-400'} />}
                                                </div>
                                                <p className={`text-[12px] font-medium leading-relaxed italic ${selectedRisk === risk ? 'text-white' : 'text-rose-700'}`}>"{risk.reason}"</p>
                                                {risk.severity && (
                                                    <div className="mt-3 flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${risk.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${selectedRisk === risk ? 'text-rose-200' : 'text-rose-400'}`}>{risk.severity} Severity</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'selectors' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                                    {data?.selectorAnalysis?.map((el, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedElement(el)}
                                            onMouseEnter={() => setSelectedElement(el)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedElement === el ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <code className={`text-[10px] font-black ${selectedElement === el ? 'text-indigo-400' : 'text-slate-800'}`}>{el.selector}</code>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${el.stabilityScore}%` }} className={`h-full ${el.stabilityScore > 70 ? 'bg-emerald-500' : el.stabilityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedElement === el ? 'text-slate-400' : 'text-slate-400'}`}>{el.reason}</p>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'metrics' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 py-6">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-48 h-48 flex items-center justify-center">
                                            <svg className="w-full h-full transform -rotate-90">
                                                <circle cx="96" cy="96" r="88" stroke="#f1f5f9" strokeWidth="16" fill="transparent" />
                                                <motion.circle
                                                    cx="96" cy="96" r="88"
                                                    stroke="#6366f1" strokeWidth="16" fill="transparent"
                                                    strokeDasharray={2 * Math.PI * 88}
                                                    initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                                    animate={{ strokeDashoffset: (2 * Math.PI * 88) - (data?.metrics?.finalScore / 100) * (2 * Math.PI * 88) }}
                                                    transition={{ duration: 2, ease: "circOut" }}
                                                />
                                            </svg>
                                            <div className="absolute flex flex-col items-center">
                                                <span className="text-4xl font-black text-slate-900">{data?.metrics?.finalScore}%</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Stability Score</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { label: 'Selector Stability', val: data?.metrics?.stability, icon: Target, color: 'indigo' },
                                            { label: 'Interaction Reachability', val: data?.metrics?.reachability, icon: MousePointer2, color: 'emerald' },
                                            { label: 'Accessibility Coverage', val: data?.metrics?.accessibility, icon: Accessibility, color: 'amber' }
                                        ].map((m, i) => (
                                            <div key={i} className="space-y-3">
                                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-2 text-slate-500"><m.icon size={13} /> {m.label}</span>
                                                    <span className={`text-${m.color}-600`}>{m.val}%</span>
                                                </div>
                                                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${m.val}%` }} className={`h-full bg-${m.color}-500`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Sparkles size={18} className="text-indigo-400" />
                                            <h4 className="text-[12px] font-black uppercase tracking-widest">AI Agent Verdict</h4>
                                        </div>
                                        <p className="text-[13px] font-medium leading-relaxed italic opacity-80">
                                            "This page exhibits high interaction complexity with potential accessibility gaps in search and checkout paths. Automation strategy should prioritize ARIA selection over text-dependent mapping."
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
            `}</style>
        </div>
    );
}
