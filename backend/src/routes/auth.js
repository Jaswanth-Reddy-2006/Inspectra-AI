/**
 * Auth Agent Routes
 * POST /api/auth/detect   — detect login forms on a URL
 * POST /api/auth/generate — generate Playwright script from detected form
 * POST /api/auth/replay   — replay login with credentials
 * GET  /api/auth/sessions — list persisted sessions
 * GET  /api/auth/scripts  — list generated scripts
 * DELETE /api/auth/sessions/:domain — remove a saved session
 */

const express = require('express');
const router = express.Router();
const {
    detectAuthForms,
    replayAuth,
    generateScript,
    getStoredSessions,
    getStoredScripts,
    saveScript,
} = require('../services/authAgent');

// ─── POST /api/auth/detect ────────────────────────────────────────────────────
router.post('/detect', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    try {
        const result = await detectAuthForms(url);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Auth/detect]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /api/auth/generate ──────────────────────────────────────────────────
router.post('/generate', (req, res) => {
    const { url, form, credentialKey = 'default' } = req.body;
    if (!url || !form) return res.status(400).json({ success: false, error: 'url and form required' });

    try {
        const script = generateScript(url, form, credentialKey);
        const stored = saveScript(url, form, credentialKey, script);
        res.json({ success: true, script, storedAt: stored.generatedAt });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── POST /api/auth/replay ────────────────────────────────────────────────────
router.post('/replay', async (req, res) => {
    const { url, form, credentials } = req.body;
    if (!url || !form || !credentials) {
        return res.status(400).json({ success: false, error: 'url, form and credentials required' });
    }
    if (!credentials.username || !credentials.password) {
        return res.status(400).json({ success: false, error: 'username and password required' });
    }

    try {
        const result = await replayAuth(url, form, credentials);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Auth/replay]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── GET /api/auth/sessions ───────────────────────────────────────────────────
router.get('/sessions', (req, res) => {
    const sessions = getStoredSessions();
    res.json({ success: true, sessions });
});

// ─── GET /api/auth/scripts ────────────────────────────────────────────────────
router.get('/scripts', (req, res) => {
    const scripts = getStoredScripts();
    res.json({ success: true, scripts });
});

// ─── DELETE /api/auth/sessions/:key ──────────────────────────────────────────
router.delete('/sessions/:key', (req, res) => {
    const { key } = req.params;
    const sessions = getStoredSessions();
    const decoded = decodeURIComponent(key);
    if (!sessions[decoded]) return res.status(404).json({ success: false, error: 'Session not found' });
    delete sessions[decoded];
    const fs = require('fs');
    const path = require('path');
    const file = path.join(__dirname, '../../data/auth_sessions.json');
    fs.writeFileSync(file, JSON.stringify(sessions, null, 2));
    res.json({ success: true });
});

module.exports = router;
