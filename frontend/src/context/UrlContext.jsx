import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Global URL Context
 * Stores the single "active target URL" that is shared across all pages.
 * Persisted to localStorage so it survives page refreshes.
 */
const UrlContext = createContext(null);

export const UrlProvider = ({ children }) => {
    const [targetUrl, setTargetUrlState] = useState(
        () => localStorage.getItem('inspectra_target_url') || ''
    );

    const setTargetUrl = useCallback((url) => {
        setTargetUrlState(url);
        if (url) {
            localStorage.setItem('inspectra_target_url', url);
        } else {
            localStorage.removeItem('inspectra_target_url');
        }
    }, []);

    const clearTargetUrl = useCallback(() => {
        setTargetUrlState('');
        localStorage.removeItem('inspectra_target_url');
    }, []);

    return (
        <UrlContext.Provider value={{ targetUrl, setTargetUrl, clearTargetUrl }}>
            {children}
        </UrlContext.Provider>
    );
};

export const useTargetUrl = () => {
    const context = useContext(UrlContext);
    if (!context) {
        throw new Error('useTargetUrl must be used within a UrlProvider');
    }
    return context;
};
