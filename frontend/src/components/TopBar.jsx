<<<<<<< HEAD
import React from 'react';
import { Plus, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
=======
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Menu, Globe, X, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTargetUrl } from '../context/UrlContext';

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
>>>>>>> localcode

const TopBar = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
<<<<<<< HEAD

    const getPageTitle = () => {
        const path = location.pathname.split('/').filter(Boolean)[0];
        if (!path) return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <header className="h-16 sm:h-20 border-b border-[#f1f5f9] bg-white sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between gap-4">
            {/* Left: Hamburger (mobile) + Dynamic Title */}
            <div className="flex items-center gap-3">
                {/* Hamburger — only on mobile/tablet */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
=======
    const { targetUrl, setTargetUrl, clearTargetUrl } = useTargetUrl();

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
        <header className="h-16 sm:h-16 border-b border-[#f1f5f9] bg-white sticky top-0 z-30 px-4 sm:px-6 flex items-center gap-3">
            {/* Left: Hamburger (mobile) + Dynamic Title */}
            <div className="flex items-center gap-3 shrink-0">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
>>>>>>> localcode
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>

<<<<<<< HEAD
                <h2 className="text-base sm:text-xl font-black text-[#0f172a] tracking-tight italic truncate">
                    {getPageTitle()} <span className="text-slate-300 not-italic ml-1 sm:ml-2 hidden sm:inline">// Overview</span>
                </h2>
            </div>

            {/* Right: Action Button */}
            <div className="flex items-center shrink-0">
                <button
                    onClick={() => navigate('/home')}
                    className="bg-[#2563eb] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200/50 hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                    <Plus size={14} strokeWidth={3} className="sm:hidden" />
                    <Plus size={16} strokeWidth={3} className="hidden sm:block" />
                    <span className="hidden sm:inline">New Project</span>
                    <span className="sm:hidden">New</span>
=======
                <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight italic whitespace-nowrap hidden sm:block">
                    {getPageTitle()}
                </h2>
            </div>

            {/* ── Global URL Input ───────────────────────────────────────── */}
            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${focused
                    ? 'bg-white border-blue-400 shadow-sm shadow-blue-100'
                    : targetUrl
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}>
                <Globe
                    size={14}
                    className={`shrink-0 transition-colors ${targetUrl ? 'text-blue-500' : 'text-slate-400'}`}
                />
                <input
                    ref={inputRef}
                    type="url"
                    value={draft}
                    placeholder="Enter target URL — shared across all pages…"
                    onChange={e => setDraft(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-xs font-medium text-slate-700 placeholder-slate-400 outline-none min-w-0"
                />
                {/* If the user has typed but not saved, show the commit button */}
                {isDirty && draft.trim() && (
                    <button
                        onMouseDown={e => { e.preventDefault(); commit(); }}
                        className="shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 rounded-lg text-white hover:bg-blue-600 transition-colors"
                        title="Apply URL (Enter)"
                    >
                        <Check size={11} strokeWidth={3} />
                    </button>
                )}
                {/* Clear button when URL is set */}
                {targetUrl && !isDirty && (
                    <button
                        onMouseDown={e => { e.preventDefault(); handleClear(); }}
                        className="shrink-0 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors rounded"
                        title="Clear URL"
                    >
                        <X size={12} />
                    </button>
                )}
                {/* "Active" indicator dot */}
                {targetUrl && !focused && !isDirty && (
                    <div className="shrink-0 w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Active target URL" />
                )}
            </div>

            {/* Right: New Project Button */}
            <div className="flex items-center shrink-0">
                <button
                    onClick={() => navigate('/home')}
                    className="bg-[#2563eb] text-white px-3 sm:px-5 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200/50 hover:scale-105 active:scale-95 whitespace-nowrap"
                >
                    <Plus size={14} strokeWidth={3} />
                    <span className="hidden sm:inline">New Scan</span>
>>>>>>> localcode
                </button>
            </div>
        </header>
    );
};

export default TopBar;
