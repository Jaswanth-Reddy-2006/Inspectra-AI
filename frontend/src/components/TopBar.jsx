import React, { useState, useEffect, useRef } from 'react';
import { Plus, Menu, Globe, X, Check, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScanContext } from '../context/ScanContext';

const PAGE_TITLES = {
    dashboard: 'Dashboard',
    discovery: 'Discovery Agent',
    'auth-agent': 'Auth Agent',
    classifier: 'Page Classifier',
    dom: 'DOM Analysis',
    network: 'Network Monitor',
    performance: 'Performance & A11y',
    functional: 'Functional Judge',
    visual: 'Visual Judge',
    defects: 'Defect Graph',
    severity: 'Severity Matrix',
    hygiene: 'Hygiene Score',
    risk: 'Risk Analysis',
    projects: 'Projects',
    scans: 'Scans',
    settings: 'Settings',
    profile: 'Profile',
};

const TopBar = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { targetUrl, setTargetUrl, clearTargetUrl, scanResult } = useScanContext();

    // Local draft — only committed on Enter or ✓ click
    const [draft, setDraft] = useState(targetUrl);
    const [focused, setFocused] = useState(false);
    const inputRef = useRef(null);

    // Keep draft in sync when external changes happen (e.g. from a page)
    useEffect(() => {
        if (!focused) setDraft(targetUrl);
    }, [targetUrl, focused]);

    const getPageTitle = () => {
        const seg = location.pathname.split('/').filter(Boolean)[0] || '';
        return PAGE_TITLES[seg] || (seg ? seg.charAt(0).toUpperCase() + seg.slice(1) : 'Dashboard');
    };

    const commit = () => {
        const trimmed = draft.trim();
        setTargetUrl(trimmed);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') {
            setDraft(targetUrl);
            inputRef.current?.blur();
        }
    };

    const handleClear = () => {
        setDraft('');
        clearTargetUrl();
        inputRef.current?.focus();
    };

    const isDirty = draft.trim() !== targetUrl;

    return (
        <header className="h-16 border-b border-[#f1f5f9] bg-white sticky top-0 z-30 px-4 sm:px-6 flex items-center gap-4">
            {/* Left: Hamburger (mobile) + Dynamic Title */}
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>
                <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight italic whitespace-nowrap hidden sm:block">
                    {getPageTitle()}
                </h2>
            </div>

            {/* ── Shared URL Display ───────────────────────────────────────── */}
            <div className="flex-1 flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                    {/* URL Input */}
                    <div className={`relative flex items-center transition-all ${focused ? 'w-80 sm:w-96' : 'w-48 sm:w-64'}`}>
                        <div className="absolute left-3.5 text-slate-400">
                            <Globe size={14} className={targetUrl ? 'text-blue-500' : ''} />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setTimeout(() => setFocused(false), 200)}
                            placeholder="Target App URL..."
                            className={`w-full h-10 pl-10 pr-20 bg-slate-50 border-2 rounded-xl text-[12px] font-bold outline-none transition-all ${focused ? 'bg-white border-blue-600/20 shadow-lg shadow-blue-500/5' : 'border-slate-50 hover:border-slate-200'}`}
                        />

                        {/* Action Buttons */}
                        <div className="absolute right-1.5 flex items-center gap-1">
                            {isDirty ? (
                                <>
                                    <button onClick={commit} className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-200 hover:bg-blue-700 transition-all">
                                        <Check size={14} strokeWidth={3} />
                                    </button>
                                    <button onClick={() => setDraft(targetUrl)} className="w-7 h-7 bg-white border border-slate-200 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all">
                                        <X size={14} strokeWidth={2.5} />
                                    </button>
                                </>
                            ) : (
                                draft && (
                                    <button onClick={handleClear} className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-100 transition-all">
                                        <X size={14} />
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* Stats Row (only if scanResult exists) */}
                    {scanResult && (
                        <div className="hidden md:flex items-center gap-4 border-l border-slate-100 pl-4 shrink-0">
                            <div className="flex items-center gap-1.5">
                                <Activity size={12} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{Math.round(scanResult.duration / 1000)}s</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Cpu size={12} className="text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{scanResult.totalPagesScanned} Nodes</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: New Scan Button */}
            <div className="flex items-center shrink-0">
                <button
                    onClick={() => navigate('/home')}
                    className="bg-[#2563eb] text-white px-3 sm:px-5 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200/50 hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span className="hidden sm:inline">New Scan</span>
                </button>
            </div>
        </header>
    );
};

export default TopBar;
