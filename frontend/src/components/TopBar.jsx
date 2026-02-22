import React from 'react';
import { Plus, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const TopBar = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();

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
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>

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
                </button>
            </div>
        </header>
    );
};

export default TopBar;
