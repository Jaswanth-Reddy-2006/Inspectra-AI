import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { runScan } from '../services/api';
import { useToast } from './ToastContext';

/**
 * Global Scan Context
 * Manages the single active scan state shared across all pages.
 */
const ScanContext = createContext(null);

export const ScanProvider = ({ children }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Persisted Target URL
    const [targetUrl, setTargetUrlState] = useState(
        () => localStorage.getItem('inspectra_target_url') || ''
    );

    // Persisted Baseline URL
    const [baselineUrl, setBaselineUrlState] = useState(
        () => localStorage.getItem('inspectra_baseline_url') || ''
    );

    // Scan State
    const [scanResult, setScanResultState] = useState(() => {
        const saved = localStorage.getItem('inspectra_scan_result');
        return saved ? JSON.parse(saved) : null;
    });

    const [credentials, setCredentialsState] = useState(() => {
        const saved = localStorage.getItem('inspectra_scan_credentials');
        return saved ? JSON.parse(saved) : {};
    });

    // Scan History Persistence
    const [scanHistory, setScanHistory] = useState(() => {
        const saved = localStorage.getItem('inspectra_scan_history');
        return saved ? JSON.parse(saved) : [];
    });

    const addToHistory = useCallback((url) => {
        setScanHistory(prev => {
            const exists = prev.find(h => h.url === url);
            let updated;
            if (exists) {
                updated = [
                    { ...exists, timestamp: new Date().toISOString() },
                    ...prev.filter(h => h.url !== url)
                ];
            } else {
                updated = [{ url, timestamp: new Date().toISOString() }, ...prev].slice(0, 50);
            }
            localStorage.setItem('inspectra_scan_history', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const setScanResult = useCallback((result) => {
        setScanResultState(result);
        if (result) {
            localStorage.setItem('inspectra_scan_result', JSON.stringify(result));
        } else {
            localStorage.removeItem('inspectra_scan_result');
        }
    }, []);

    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [scanStartTime, setScanStartTime] = useState(null);

    const setTargetUrl = useCallback((url) => {
        if (url !== targetUrl) {
            setScanResult(null);
            setCredentialsState({});
            localStorage.removeItem('inspectra_scan_credentials');
        }
        setTargetUrlState(url);
        if (url) {
            localStorage.setItem('inspectra_target_url', url);
        } else {
            localStorage.removeItem('inspectra_target_url');
        }
    }, [targetUrl]);

    const clearTargetUrl = useCallback(() => {
        setTargetUrlState('');
        setBaselineUrlState('');
        localStorage.removeItem('inspectra_target_url');
        localStorage.removeItem('inspectra_baseline_url');
    }, []);

    const setBaselineUrl = useCallback((url) => {
        setBaselineUrlState(url);
        if (url) {
            localStorage.setItem('inspectra_baseline_url', url);
        } else {
            localStorage.removeItem('inspectra_baseline_url');
        }
    }, []);

    const startScan = useCallback(async (url, credentials = {}) => {
        setIsScanning(true);
        setIsProcessing(true);
        setScanStartTime(Date.now());
        setScanResult(null);
        setTargetUrl(url);
        setCredentialsState(credentials);
        if (Object.keys(credentials).length > 0) {
            localStorage.setItem('inspectra_scan_credentials', JSON.stringify(credentials));
        } else {
            localStorage.removeItem('inspectra_scan_credentials');
        }

        try {
            console.log('Initiating global scan for:', url);
            const data = await runScan(url, credentials);

            if (data.success) {
                console.log('Scan results received:', {
                    hasSummary: !!data.issuesSummary,
                    hasIntelligence: !!data.issuesSummary?.productionIntelligence,
                    hasPillars: !!data.issuesSummary?.productionIntelligence?.pillars
                });

                if (data.issuesSummary?.productionIntelligence?.pillars) {
                    console.log('Scan completed successfully');
                    setScanResult(data);
                    addToHistory(url);
                    addToast('Scan completed successfully!', 'success');
                    navigate('/dashboard');
                } else {
                    console.error('Incomplete payload received:', data);
                    throw new Error("Received incomplete intelligence engine payload. Please check backend logs.");
                }
            } else {
                throw new Error(data.error || 'Failed to complete scan.');
            }
        } catch (err) {
            console.error('Scan request failed:', err);
            const msg = err.response?.data?.error || err.message || 'Failed to scan application.';
            addToast(msg, 'error');
            // Revert state if we failed and completely wiped it initially
            setScanResult(JSON.parse(localStorage.getItem('inspectra_scan_result') || 'null'));
        } finally {
            setIsScanning(false);
            setIsProcessing(false);
        }
    }, [addToast, navigate, setTargetUrl, addToHistory]);

    return (
        <ScanContext.Provider value={{
            targetUrl,
            setTargetUrl,
            clearTargetUrl,
            scanResult,
            setScanResult,
            isScanning,
            isProcessing,
            scanStartTime,
            startScan,
            credentials,
            setCredentials: setCredentialsState,
            baselineUrl,
            setBaselineUrl,
            scanHistory
        }}>
            {children}
        </ScanContext.Provider>
    );
};

export const useScanContext = () => {
    const context = useContext(ScanContext);
    if (!context) {
        throw new Error('useScanContext must be used within a ScanProvider');
    }
    return context;
};