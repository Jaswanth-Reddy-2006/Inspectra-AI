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
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoadingSpinner from './components/LoadingSpinner';
import { runScan } from './services/api';

function App() {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scanUrl, setScanUrl] = useState('');

    const [projectsList] = useState([
        { name: 'Acme E-commerce', url: 'https://acme.com', score: 85, issues: 12, lastScan: '2h ago', status: 'healthy' },
        { name: 'Marketing Blog', url: 'https://blog.marketing.io', score: 92, issues: 3, lastScan: 'Active', status: 'active' },
        { name: 'User Dashboard', url: 'https://app.dashboard.com', score: 78, issues: 24, lastScan: '1d ago', status: 'warning' }
    ]);

    const [recentScans] = useState([
        { name: 'Nexus Payments API', type: 'Backend Scan', status: 'Completed', score: 85, timestamp: '2h ago' },
        { name: 'Customer Dashboard Mobile', type: 'Frontend Scan', status: 'In Progress', score: 45, timestamp: '5m ago' },
        { name: 'Inventory Sync Service', type: 'Full Scan', status: 'Completed', score: 92, timestamp: '4h ago' },
        { name: 'Auth Portal V2', type: 'Security Audit', status: 'Completed', score: 78, timestamp: '1d ago' },
        { name: 'Legacy Checkout Bridge', type: 'Compliance', status: 'Completed', score: 62, timestamp: '2d ago' }
    ]);

    const handleScanStart = async (url) => {
        setScanUrl(url);
        setIsScanning(true);
        setError(null);

        // Minimum display time = 5 steps × 1.8s each + 1s buffer = 10s
        // This ensures users see the full animated step sequence
        const MIN_DISPLAY_MS = 10000;
        const startTime = Date.now();

        try {
            const data = await Promise.all([
                runScan(url),
                new Promise((resolve) => setTimeout(resolve, MIN_DISPLAY_MS))
            ]);
            setScanResult(data[0]);
            setIsScanning(false);
            navigate('/dashboard');
        } catch (err) {
            // Even on error, show the loading screen for the full sequence
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
            setTimeout(() => {
                console.error('Scan failed:', err);
                setError(err.response?.data?.error || 'Failed to scan application.');
                setIsScanning(false);
                navigate('/dashboard');
            }, remaining);
        }
    };

    // Wrapper for pages that require the Sidebar/TopBar layout
    const AppLayout = ({ children }) => (
        <div className="min-h-screen bg-[#f8fafc] flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            {/* Main content area — pushes right of sidebar on desktop */}
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
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login onLogin={() => { }} />} />

                {/* Main App Routes */}
                <Route path="/home" element={
                    isScanning ? (
                        <LoadingSpinner scanUrl={scanUrl} />
                    ) : (
                        <Home onScanStart={handleScanStart} />
                    )
                } />

                <Route path="/dashboard" element={
                    <AppLayout>
                        <Dashboard result={scanResult} />
                    </AppLayout>
                } />

                <Route path="/projects" element={
                    <AppLayout>
                        <Projects projects={projectsList} />
                    </AppLayout>
                } />

                <Route path="/scans" element={
                    <AppLayout>
                        <Scans scans={recentScans} />
                    </AppLayout>
                } />

                <Route path="/settings" element={
                    <AppLayout>
                        <Settings />
                    </AppLayout>
                } />

                <Route path="/profile" element={
                    <AppLayout>
                        <Profile />
                    </AppLayout>
                } />

                <Route path="/docs" element={<Documentation />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {error && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 text-white rounded-full shadow-2xl font-black text-xs uppercase tracking-widest animate-bounce z-[60] max-w-[90vw] text-center">
                    {error}
                </div>
            )}
        </div>
    );
}

export default App;
