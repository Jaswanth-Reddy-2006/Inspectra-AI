import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Scans from './pages/Scans';
import Documentation from './pages/Documentation';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

// QA Agent Pages
import DiscoveryAgent from './pages/DiscoveryAgent';
import AuthAgent from './pages/AuthAgent';
import PageClassifier from './pages/PageClassifier';
import DOMAnalysis from './pages/DOMAnalysis';
import NetworkMonitor from './pages/NetworkMonitor';
import PerformanceAccessibility from './pages/PerfAccessibility';
import FunctionalJudge from './pages/FunctionalJudge';
import VisualJudge from './pages/VisualJudge';

// Analysis Pages
import DefectGraphs from './pages/DefectGraphs';
import SeverityMatrix from './pages/SeverityMatrix';
import HygieneScore from './pages/HygieneScore';
import RiskAnalysis from './pages/RiskAnalysis';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoadingSpinner from './components/LoadingSpinner';
import { runScan } from './services/api';
import { useToast } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';

function App() {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const { addToast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleScanStart = async (url) => {
        setIsScanning(true);
        setIsProcessing(true);
        setScanResult(null);

        try {
            console.log('Initiating blocking scan for:', url);
            const data = await runScan(url);

            if (data.success) {
                console.log('Scan completed successfully');
                setScanResult(data);
                addToast('Scan completed successfully!', 'success');
                navigate('/dashboard');
            } else {
                throw new Error(data.error || 'Failed to complete scan.');
            }
        } catch (err) {
            console.error('Scan request failed:', err);
            const msg = err.response?.data?.error || err.message || 'Failed to scan application.';
            addToast(msg, 'error');
        } finally {
            setIsScanning(false);
            setIsProcessing(false);
        }
    };

    // Wrapper for pages that require the Sidebar/TopBar layout
    const AppLayout = ({ children }) => (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px]">
                <TopBar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen selection:bg-blue-100 selection:text-blue-700">
            {isScanning && (
                <LoadingSpinner
                    isProcessing={isProcessing}
                    scanStartTime={Date.now()}
                />
            )}

            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login onLogin={() => { }} />} />

                {/* Main App Routes */}
                <Route path="/home" element={
                    <Home onScanStart={handleScanStart} isScanning={isScanning} />
                } />

                {/* ── Overview ──────────────────────────────── */}
                <Route path="/dashboard" element={
                    <AppLayout><Dashboard result={scanResult} /></AppLayout>
                } />
                <Route path="/projects" element={
                    <AppLayout><Projects /></AppLayout>
                } />
                <Route path="/scans" element={
                    <AppLayout><Scans /></AppLayout>
                } />

                {/* ── QA Agents ─────────────────────────────── */}
                <Route path="/discovery" element={
                    <AppLayout><DiscoveryAgent /></AppLayout>
                } />
                <Route path="/auth-agent" element={
                    <AppLayout><AuthAgent /></AppLayout>
                } />
                <Route path="/classifier" element={
                    <AppLayout><PageClassifier /></AppLayout>
                } />
                <Route path="/dom" element={
                    <AppLayout><DOMAnalysis /></AppLayout>
                } />
                <Route path="/network" element={
                    <AppLayout><NetworkMonitor /></AppLayout>
                } />
                <Route path="/performance" element={
                    <AppLayout><PerformanceAccessibility /></AppLayout>
                } />
                <Route path="/functional" element={
                    <AppLayout><FunctionalJudge /></AppLayout>
                } />
                <Route path="/visual" element={
                    <AppLayout><VisualJudge /></AppLayout>
                } />

                {/* ── Analysis ──────────────────────────────── */}
                <Route path="/defects" element={
                    <AppLayout><DefectGraphs /></AppLayout>
                } />
                <Route path="/severity" element={
                    <AppLayout><SeverityMatrix /></AppLayout>
                } />
                <Route path="/hygiene" element={
                    <AppLayout><HygieneScore /></AppLayout>
                } />
                <Route path="/risk" element={
                    <AppLayout><RiskAnalysis /></AppLayout>
                } />

                {/* ── Settings & Profile ─────────────────────── */}
                <Route path="/settings" element={
                    <AppLayout><Settings /></AppLayout>
                } />
                <Route path="/profile" element={
                    <AppLayout><Profile /></AppLayout>
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
