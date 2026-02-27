import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Scans from './pages/Scans';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// ── 9 Core Pillars ──────────────────────
import AIAgents from './pages/AIAgents';
import DiscoveryAgent from './pages/DiscoveryAgent';
import BugDetection from './pages/BugDetection';
import HygieneScore from './pages/HygieneScore';
import QualityEngineering from './pages/QualityEngineering';
import DeviceArchitecture from './pages/DeviceArchitecture';
import SeverityMatrix from './pages/SeverityMatrix';
import AgentResult from './pages/AgentResult';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoadingSpinner from './components/LoadingSpinner';
import { useScanContext } from './context/ScanContext';
import ToastContainer from './components/ToastContainer';

// Wrapper for pages that require the Sidebar/TopBar layout
const AppLayout = ({ children, sidebarOpen, setSidebarOpen }) => (
    <div className="min-h-screen bg-[#f8fafc] flex">
        {/* Structural Spacer for Fixed Sidebar */}
        <div className="hidden lg:block w-[260px] shrink-0" aria-hidden="true" />

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
            <main className="flex-1 w-full bg-[#f8fafc]">
                {children}
            </main>
        </div>
    </div>
);

// Wrapper for true Fullscreen Command Center experiences (no TopBar)
const FullscreenAppLayout = ({ children, sidebarOpen, setSidebarOpen }) => (
    <div className="min-h-screen bg-[#f8fafc] flex">
        <div className="hidden lg:block w-[260px] shrink-0" aria-hidden="true" />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto w-full">
                {children}
            </main>
        </div>
    </div>
);

function App() {
    const { scanResult, isScanning, isProcessing, scanStartTime } = useScanContext();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen selection:bg-blue-100 selection:text-blue-700">
            {isScanning && (
                <LoadingSpinner
                    isProcessing={isProcessing}
                    scanStartTime={scanStartTime || Date.now()}
                />
            )}

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login onLogin={() => { }} />} />

                {/* Main App Routes */}
                <Route path="/home" element={<Home />} />

                {/* ── Overview ──────────────────────────────── */}
                <Route path="/dashboard" element={
                    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Dashboard result={scanResult} /></AppLayout>
                } />
                <Route path="/projects" element={
                    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Projects /></AppLayout>
                } />
                <Route path="/scans" element={
                    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Scans /></AppLayout>
                } />

                {/* ── 9 Core AI Pillars ──────────────────────── */}
                <Route path="/agents" element={<AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><AIAgents /></AppLayout>} />
                <Route path="/discovery" element={<FullscreenAppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><DiscoveryAgent /></FullscreenAppLayout>} />
                <Route path="/bugs" element={<FullscreenAppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><BugDetection /></FullscreenAppLayout>} />
                <Route path="/hygiene" element={<FullscreenAppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><HygieneScore /></FullscreenAppLayout>} />
                <Route path="/quality" element={<FullscreenAppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><QualityEngineering /></FullscreenAppLayout>} />
                <Route path="/device" element={<AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><DeviceArchitecture /></AppLayout>} />
                <Route path="/scoring" element={<AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><SeverityMatrix /></AppLayout>} />
                <Route path="/agents/detail/:agentId" element={<AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><AgentResult /></AppLayout>} />

                {/* ── Settings & Profile ─────────────────────── */}
                <Route path="/settings" element={
                    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Settings /></AppLayout>
                } />
                <Route path="/profile" element={
                    <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}><Profile /></AppLayout>
                } />

                <Route path="/docs" element={<Documentation />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <ToastContainer />
        </div>
    );
}

export default App;
