import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useScanContext } from '../context/ScanContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Layers, Globe, Plus, Trash2, Play, RefreshCw, Loader,
    CheckCircle, XCircle, Edit3, ChevronDown, X,
    Home, List, FileText, ShoppingCart, CreditCard,
    LayoutGrid, GitBranch, Box, Search, Upload,
    BarChart2, Eye, Database, Cpu, Zap, Filter,
    ArrowUpDown, Download
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis
} from 'recharts';
import { API_BASE } from '../services/config';

// ─── Page Type Config ─────────────────────────────────────────────────────────

const PAGE_TYPES = {
    Home: { color: '#f59e0b', bg: '#fef3c7', icon: Home, label: 'Home' },
    Listing: { color: '#10b981', bg: '#d1fae5', icon: List, label: 'Listing' },
    Form: { color: '#6366f1', bg: '#eef2ff', icon: FileText, label: 'Form' },
    Product: { color: '#ec4899', bg: '#fce7f3', icon: ShoppingCart, label: 'Product' },
    Checkout: { color: '#ef4444', bg: '#fee2e2', icon: CreditCard, label: 'Checkout' },
    Dashboard: { color: '#0ea5e9', bg: '#e0f2fe', icon: LayoutGrid, label: 'Dashboard' },
    Wizard: { color: '#f97316', bg: '#fff7ed', icon: GitBranch, label: 'Wizard' },
    Modal: { color: '#8b5cf6', bg: '#ede9fe', icon: Box, label: 'Modal' },
    Unknown: { color: '#94a3b8', bg: '#f1f5f9', icon: Globe, label: 'Unknown' },
};

const PT_LIST = Object.keys(PAGE_TYPES).filter(k => k !== 'Unknown');

const confColor = (c) => c >= 75 ? '#10b981' : c >= 50 ? '#f59e0b' : '#ef4444';
const confBg = (c) => c >= 75 ? '#d1fae5' : c >= 50 ? '#fef3c7' : '#fee2e2';

// ─── Feature Vector Display ────────────────────────────────────────────────────

const FEATURE_GROUPS = [
    { key: 'formCount', label: 'Forms', max: 10 },
    { key: 'inputCount', label: 'Inputs', max: 20 },
    { key: 'repeatingCards', label: 'Cards', max: 20 },
    { key: 'priceMatches', label: 'Prices', max: 10 },
    { key: 'chartCount', label: 'Charts', max: 8 },
    { key: 'tableCount', label: 'Tables', max: 6 },
    { key: 'imageCount', label: 'Images', max: 30 },
    { key: 'navLinks', label: 'Nav Links', max: 20 },
    { key: 'stepEls', label: 'Step Elems', max: 6 },
    { key: 'modalEls', label: 'Modal Elems', max: 4 },
    { key: 'statCards', label: 'Stat Cards', max: 8 },
    { key: 'headerCount', label: 'Headings', max: 20 },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

function TypeBadge({ type, size = 'md', onClick }) {
    const pt = PAGE_TYPES[type] || PAGE_TYPES.Unknown;
    const Icon = pt.icon;
    const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1', lg: 'text-sm px-3 py-1.5' };
    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-lg font-bold ${sizes[size]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
            style={{ background: pt.bg, color: pt.color }}>
            <Icon size={size === 'sm' ? 10 : 12} />
            {type}
        </span>
    );
}

function ConfBar({ value }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-1.5 rounded-full"
                    style={{ background: confColor(value) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                />
            </div>
            <span className="text-xs font-black w-8 text-right" style={{ color: confColor(value) }}>{value}%</span>
        </div>
    );
}

// Override dropdown
function OverrideDropdown({ current, onSelect }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors border border-dashed border-slate-200 hover:border-indigo-300">
                <Edit3 size={9} /> Override
                <ChevronDown size={9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-100 rounded-xl shadow-xl p-1.5 w-40">
                        {PT_LIST.map(t => {
                            const pt = PAGE_TYPES[t]; const Icon = pt.icon;
                            return (
                                <button key={t}
                                    onClick={() => { onSelect(t); setOpen(false); }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${current === t ? 'text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    style={current === t ? { background: pt.color } : {}}>
                                    <Icon size={11} style={{ color: current === t ? 'white' : pt.color }} />
                                    {t}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Page card
function PageCard({ page, onOverride, onDelete, onSelect, selected }) {
    const pt = PAGE_TYPES[page.pageType] || PAGE_TYPES.Unknown;
    const Icon = pt.icon;
    const radarData = Object.entries(page.scores || {}).map(([key, val]) => ({ page: key, score: val }));

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={() => onSelect(page)}
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden ${selected ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>

            {/* Screenshot */}
            <div className="relative h-36 bg-slate-50 overflow-hidden">
                {page.screenshot ? (
                    <img src={page.screenshot} alt={page.url} className="w-full h-full object-cover object-top transition-transform group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Globe size={28} className="text-slate-200" />
                    </div>
                )}
                {/* Type pill overlay */}
                <div className="absolute top-2 left-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black backdrop-blur-sm border border-white/30 shadow"
                        style={{ background: pt.color + 'ee', color: 'white' }}>
                        <Icon size={11} />
                        {page.pageType}
                    </div>
                </div>
                {/* Override / Delete controls */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); onDelete(page.url); }}
                        className="w-6 h-6 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors shadow">
                        <Trash2 size={11} />
                    </button>
                </div>
                {/* Confidence badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black backdrop-blur-sm shadow"
                    style={{ background: confBg(page.confidence || 0), color: confColor(page.confidence || 0) }}>
                    {page.confidence || 0}%
                </div>
                {page.overridden && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-600">
                        overridden
                    </div>
                )}
            </div>

            {/* Card body */}
            <div className="p-3.5">
                {/* URL */}
                <p className="font-mono text-xs font-bold text-slate-700 truncate mb-2" title={page.url}>
                    {(() => { try { return new URL(page.url).pathname || '/'; } catch { return page.url; } })()}
                </p>

                {/* Confidence bar */}
                <ConfBar value={page.confidence || 0} />

                {/* Runner up */}
                {page.runner_up?.type && page.runner_up.score > 15 && (
                    <p className="text-[10px] text-slate-400 font-semibold mt-1.5">
                        Also looks like <span className="font-black" style={{ color: PAGE_TYPES[page.runner_up.type]?.color }}>{page.runner_up.type}</span>
                        {' '}({page.runner_up.score}%)
                    </p>
                )}

                {/* Feature mini-grid */}
                <div className="mt-2.5 flex gap-2 flex-wrap">
                    {[
                        { label: 'Inputs', val: page.features?.inputCount },
                        { label: 'Forms', val: page.features?.formCount },
                        { label: 'Cards', val: page.features?.repeatingCards },
                        { label: 'Prices', val: page.features?.priceMatches },
                    ].filter(f => f.val > 0).map(f => (
                        <span key={f.label} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                            {f.label}: {f.val}
                        </span>
                    ))}
                </div>

                {/* Override */}
                <div className="mt-3 flex items-center justify-between">
                    <OverrideDropdown current={page.pageType} onSelect={(t) => onOverride(page.url, t)} />
                    {page.title && <p className="text-[10px] text-slate-400 truncate max-w-[120px]" title={page.title}>{page.title}</p>}
                </div>
            </div>
        </motion.div>
    );
}

// Detail panel
function DetailPanel({ page, onClose, onOverride }) {
    if (!page) return null;
    const pt = PAGE_TYPES[page.pageType] || PAGE_TYPES.Unknown;
    const Icon = pt.icon;
    const radarData = Object.entries(page.scores || {}).map(([key, val]) => ({ page: key, s: val }));
    const barData = FEATURE_GROUPS.map(f => ({ name: f.label, val: page.features?.[f.key] || 0, max: f.max }));

    return (
        <AnimatePresence>
            <motion.div
                key="detail"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                className="w-[340px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: pt.bg }}>
                        <Icon size={15} style={{ color: pt.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-800 truncate">
                            {(() => { try { return new URL(page.url).pathname || '/'; } catch { return page.url; } })()}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{page.title}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <X size={13} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Screenshot */}
                    {page.screenshot && (
                        <img src={page.screenshot} alt="Page screenshot" className="w-full rounded-xl border border-slate-100" />
                    )}

                    {/* Classified type + override */}
                    <div className="flex items-center justify-between">
                        <TypeBadge type={page.pageType} size="lg" />
                        <OverrideDropdown current={page.pageType} onSelect={(t) => onOverride(page.url, t)} />
                    </div>

                    {/* Confidence */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Confidence</span>
                            <span className="text-xs font-black" style={{ color: confColor(page.confidence) }}>{page.confidence}%</span>
                        </div>
                        <ConfBar value={page.confidence} />
                    </div>

                    {/* Score breakdown radar */}
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Type Score Breakdown</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <RadarChart data={radarData} margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="page" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar dataKey="s" stroke={pt.color} fill={pt.color} fillOpacity={0.18} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Feature vector */}
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Feature Vector</p>
                        <div className="space-y-1.5">
                            {FEATURE_GROUPS.map(f => {
                                const val = page.features?.[f.key] || 0;
                                const pct = Math.min(100, Math.round((val / f.max) * 100));
                                if (val === 0) return null;
                                return (
                                    <div key={f.key} className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 w-20 font-semibold shrink-0">{f.label}</span>
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 w-6 text-right">{val}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Boolean signals */}
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Detected Signals</p>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                { key: 'hasAddToCart', label: 'Add to Cart' },
                                { key: 'hasCheckout', label: 'Checkout' },
                                { key: 'hasLoginBtn', label: 'Login Button' },
                                { key: 'hasPriceText', label: 'Price Found' },
                                { key: 'hasNextPrev', label: 'Next/Prev' },
                                { key: 'hasFilter', label: 'Filter/Search' },
                                { key: 'hasCTA', label: 'CTA Button' },
                                { key: 'hasWelcome', label: 'Welcome Text' },
                                { key: 'hasStepNumbers', label: 'Step Numbers' },
                                { key: 'hasModalOpen', label: 'Modal Open' },
                            ].filter(s => page.features?.[s.key]).map(s => (
                                <span key={s.key} className="flex items-center gap-1 text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                                    <CheckCircle size={8} /> {s.label}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {[
                            { l: 'Status Code', v: page.statusCode || '—' },
                            { l: 'DOM Elements', v: page.features?.totalElements || '—' },
                            { l: 'Images', v: page.features?.imageCount || 0 },
                            { l: 'Tables', v: page.features?.tableCount || 0 },
                        ].map(m => (
                            <div key={m.l} className="bg-slate-50 rounded-xl p-2">
                                <p className="text-slate-400 font-semibold">{m.l}</p>
                                <p className="font-black text-slate-700 text-xs">{m.v}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PageClassifier() {
    const { targetUrl, scanResult, isScanning: globalScanning } = useScanContext();
    const [pages, setPages] = useState([]);
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState({ index: 0, total: 0, url: '', pct: 0 });

    const prevUrlRef = useRef(targetUrl);
    // Clear results when a global scan starts
    useEffect(() => {
        if (globalScanning) {
            setPages([]);
            setSelectedPage(null);
            setProgress({ index: 0, total: 0, url: '', pct: 0 });
        }
    }, [globalScanning]);

    // Reset state when target URL changes
    useEffect(() => {
        if (prevUrlRef.current !== targetUrl) {
            setPages([]); // Clear previous scan data as requested
            setSelectedPage(null);
            setProgress({ index: 0, total: 0, url: '', pct: 0 });
            prevUrlRef.current = targetUrl;
        }
    }, [targetUrl]);

    // Auto-run classification when URL is present and no results exist
    useEffect(() => {
        if (targetUrl && pages.length === 0 && !running && progress.pct === 0 && !globalScanning) {
            handleClassify();
        }
    }, [targetUrl, pages.length, running, progress.pct, globalScanning, handleClassify]);

    const [selectedPage, setSelectedPage] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [sortKey, setSortKey] = useState('confidence');
    const [view, setView] = useState('grid');   // grid | table
    const [loadingStored, setLoadingStored] = useState(false);
    const abortRef = useRef(null);

    // URL list management removed to centralize on global targetUrl
    // Persistent results fetch removed to avoid mixing previous data with current session as requested.

    // URL list management
    // URL list management removed to centralize on global targetUrl

    // Batch classify via SSE
    const handleClassify = useCallback(async () => {
        if (!targetUrl) return;

        // Collect all pages from the scan if available, otherwise just targetUrl
        const scanPages = scanResult?.pages?.map(p => p.url) || [];
        const urlsToProcess = scanPages.length > 0 ? scanPages : [targetUrl];

        setRunning(true);
        setProgress({ index: 0, total: urlsToProcess.length, url: urlsToProcess[0], pct: 0 });

        try {
            abortRef.current = new AbortController();
            const res = await fetch(`${API_BASE}/api/classifier/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: urlsToProcess }),
                signal: abortRef.current.signal,
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const ev = JSON.parse(line.slice(6));
                        if (ev.type === 'progress') {
                            setProgress({ index: ev.index, total: ev.total, url: ev.url, pct: ev.pct });
                        } else if (ev.type === 'result') {
                            setPages(prev => {
                                const without = prev.filter(p => p.url !== ev.result.url);
                                return [...without, ev.result];
                            });
                        }
                    } catch { }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        } finally {
            setRunning(false);
            setProgress(p => ({ ...p, pct: 100 }));
        }
    }, [targetUrl, scanResult]);

    // Override page type
    const handleOverride = useCallback(async (url, newType) => {
        try {
            await fetch(`${API_BASE}/api/classifier/override`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, pageType: newType }),
            });
            setPages(prev => prev.map(p => p.url === url ? { ...p, pageType: newType, overridden: true, confidence: 100 } : p));
            setSelectedPage(prev => prev?.url === url ? { ...prev, pageType: newType, overridden: true } : prev);
        } catch { }
    }, []);

    // Delete
    const handleDelete = useCallback(async (url) => {
        try {
            await fetch(`${API_BASE}/api/classifier/results/${encodeURIComponent(url)}`, { method: 'DELETE' });
            setPages(prev => prev.filter(p => p.url !== url));
            if (selectedPage?.url === url) setSelectedPage(null);
        } catch { }
    }, [selectedPage]);

    // Filtered + sorted pages
    const displayPages = useMemo(() => {
        if (!targetUrl) return [];
        // Only show pages that belong to the current targetUrl domain to avoid showing unrelated stored results
        const hostname = new URL(targetUrl).hostname;
        const filteredByDomain = pages.filter(p => {
            try { return new URL(p.url).hostname === hostname; } catch { return false; }
        });

        let list = filterType === 'all' ? filteredByDomain : filteredByDomain.filter(p => p.pageType === filterType);
        return [...list].sort((a, b) => {
            if (sortKey === 'confidence') return (b.confidence || 0) - (a.confidence || 0);
            if (sortKey === 'type') return (a.pageType || '').localeCompare(b.pageType || '');
            return 0;
        });
    }, [pages, filterType, sortKey, targetUrl]);

    // Stats
    const stats = useMemo(() => {
        const typeCounts = {};
        for (const p of pages) typeCounts[p.pageType] = (typeCounts[p.pageType] || 0) + 1;
        const avgConf = pages.length ? Math.round(pages.reduce((s, p) => s + (p.confidence || 0), 0) / pages.length) : 0;
        const pieData = Object.entries(typeCounts).map(([type, count]) => ({ name: type, value: count, color: PAGE_TYPES[type]?.color || '#94a3b8' }));
        return { typeCounts, avgConf, pieData };
    }, [pages]);

    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] bg-[#f8fafc]">

            {/* ── Header ──────────────────────────────────────────────── */}
            {/* ── Top Header ──────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-wrap shadow-sm gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Layers size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-800">Page Classifier</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Hybrid ML · 8 page types</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-1 max-w-2xl">
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex-1 min-w-0">
                        <Globe size={14} className="text-blue-400 shrink-0" />
                        <span className="text-sm font-mono text-slate-700 truncate">{targetUrl || <span className="text-slate-400 italic">No active scan URL…</span>}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Manual run button removed to favor auto-run logic */}
                        {running && (
                            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black">
                                <Loader size={13} className="animate-spin" /> Classifying…
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* URL Selection & Progress */}
            {running && (
                <div className="px-6 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                            <motion.div className="h-full bg-indigo-500" animate={{ width: `${progress.pct}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Classifying {progress.index + 1} of {progress.total}
                        </span>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-600 truncate max-w-md">{progress.url}</span>
                </div>
            )}

            {/* ── Summary Bar ──────────────────────────────────────────── */}
            {
                pages.length > 0 && (
                    <div className="px-6 pt-4 pb-2 grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Total */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Layers size={16} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Pages</p>
                                <p className="text-xl font-black text-slate-900">{pages.length}</p>
                            </div>
                        </div>
                        {/* Avg confidence */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                                <CheckCircle size={16} className="text-green-500" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Avg Confidence</p>
                                <p className="text-xl font-black text-slate-900">{stats.avgConf}%</p>
                            </div>
                        </div>
                        {/* Pie chart */}
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-4">
                            <ResponsiveContainer width={80} height={60}>
                                <PieChart><Pie data={stats.pieData} cx="50%" cy="50%" outerRadius={28} dataKey="value" paddingAngle={2}>
                                    {stats.pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie><Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} /></PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {stats.pieData.map(p => (
                                    <div key={p.name} className="flex items-center gap-1.5 cursor-pointer" onClick={() => setFilterType(p.name === filterType ? 'all' : p.name)}>
                                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                        <span className="text-[10px] font-bold text-slate-500">{p.name}</span>
                                        <span className="text-[10px] font-black" style={{ color: p.color }}>{p.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ── Controls ─────────────────────────────────────────────── */}
            {
                pages.length > 0 && (
                    <div className="px-6 pb-2 flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 mr-2">
                            <Filter size={12} className="text-slate-400" />
                            <span className="text-xs font-black text-slate-500">Filter:</span>
                        </div>
                        <button onClick={() => setFilterType('all')}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${filterType === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            All ({pages.length})
                        </button>
                        {Object.entries(stats.typeCounts).map(([type, count]) => {
                            const pt = PAGE_TYPES[type];
                            return (
                                <button key={type} onClick={() => setFilterType(type === filterType ? 'all' : type)}
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors ${filterType === type ? 'text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    style={filterType === type ? { background: pt?.color || '#6366f1' } : {}}>
                                    {type} ({count})
                                </button>
                            );
                        })}
                        <div className="ml-auto flex gap-2 items-center">
                            <select value={sortKey} onChange={e => setSortKey(e.target.value)}
                                className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer">
                                <option value="confidence">Sort: Confidence</option>
                                <option value="type">Sort: Type</option>
                            </select>
                            {[{ id: 'grid', icon: LayoutGrid }, { id: 'table', icon: List }].map(v => {
                                const Icon = v.icon;
                                return (
                                    <button key={v.id} onClick={() => setView(v.id)}
                                        className={`p-2 rounded-lg transition-colors ${view === v.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                        <Icon size={13} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            }

            {/* ── Main Body ────────────────────────────────────────────── */}
            <div className="flex-1 flex gap-4 px-6 pb-6 min-h-0 overflow-hidden">

                {/* Content area */}
                <div className="flex-1 min-w-0 overflow-y-auto">
                    {/* Empty state */}
                    {pages.length === 0 && !loadingStored && (
                        <div className="flex flex-col items-center justify-center min-h-[420px]">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                <Layers size={42} className="text-indigo-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-700 mb-2">Hybrid Page Classifier</h3>
                            <p className="text-slate-400 text-sm text-center max-w-md leading-relaxed">
                                Enter one or more URLs above and click <strong className="text-slate-600">Classify</strong>. The AI will launch a headless browser, extract DOM features, and label each page as Home, Listing, Form, Product, Checkout, Dashboard, Wizard, or Modal.
                            </p>
                            <div className="mt-8 grid grid-cols-4 gap-3 max-w-lg">
                                {PT_LIST.slice(0, 8).map(type => {
                                    const pt = PAGE_TYPES[type]; const Icon = pt.icon;
                                    return (
                                        <div key={type} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: pt.bg }}>
                                                <Icon size={15} style={{ color: pt.color }} />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-500">{type}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {false && ( // Loading indicator removed as it's confusing given the local-only state
                        <div className="flex items-center justify-center min-h-[200px]">
                            <Loader size={20} className="text-indigo-400 animate-spin" />
                        </div>
                    )}

                    {/* Grid view */}
                    {!loadingStored && view === 'grid' && displayPages.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                            <AnimatePresence>
                                {displayPages.map(p => (
                                    <PageCard key={p.url} page={p}
                                        selected={selectedPage?.url === p.url}
                                        onOverride={handleOverride}
                                        onDelete={handleDelete}
                                        onSelect={setSelectedPage}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Table view */}
                    {!loadingStored && view === 'table' && displayPages.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-2">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        {['URL', 'Type', 'Confidence', 'Inputs', 'Forms', 'Cards', 'Prices', 'Runner-Up', 'Override'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayPages.map((p, i) => (
                                        <tr key={p.url} onClick={() => setSelectedPage(p)}
                                            className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${selectedPage?.url === p.url ? 'bg-indigo-50/50' : ''}`}>
                                            <td className="px-4 py-3 max-w-[180px]">
                                                <p className="font-mono font-bold text-slate-700 truncate" title={p.url}>
                                                    {(() => { try { return new URL(p.url).pathname || '/'; } catch { return p.url; } })()}
                                                </p>
                                                {p.overridden && <span className="text-[9px] text-amber-500 font-bold">overridden</span>}
                                            </td>
                                            <td className="px-4 py-3"><TypeBadge type={p.pageType} size="sm" /></td>
                                            <td className="px-4 py-3 w-32">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-1.5 rounded-full" style={{ width: `${p.confidence}%`, background: confColor(p.confidence) }} />
                                                    </div>
                                                    <span className="font-black" style={{ color: confColor(p.confidence) }}>{p.confidence}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-500">{p.features?.inputCount || 0}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-500">{p.features?.formCount || 0}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-500">{p.features?.repeatingCards || 0}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-500">{p.features?.priceMatches || 0}</td>
                                            <td className="px-4 py-3">
                                                {p.runner_up?.type && p.runner_up?.score > 10
                                                    ? <TypeBadge type={p.runner_up.type} size="sm" />
                                                    : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                                <OverrideDropdown current={p.pageType} onSelect={(t) => handleOverride(p.url, t)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail panel */}
                {selectedPage && (
                    <DetailPanel
                        page={selectedPage}
                        onClose={() => setSelectedPage(null)}
                        onOverride={handleOverride}
                    />
                )}
            </div>
        </div >
    );
}
