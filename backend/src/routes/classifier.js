/**
 * Page Classifier Routes
 *
 * POST   /api/classifier/classify        — classify a single URL
 * POST   /api/classifier/batch           — SSE stream: classify list of URLs
 * PATCH  /api/classifier/override        — override a page's type
 * GET    /api/classifier/results         — get all stored results
 * DELETE /api/classifier/results/:key    — delete a stored result
 */

const express = require('express');
const router = express.Router();
const { classifyPage, classifyPages, overridePagType, getAllClassified } = require('../services/pageClassifier');
const fs = require('fs');
const path = require('path');

// ── POST /api/classifier/classify ─────────────────────────────────────────────
router.post('/classify', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url is required' });
    try {
        const result = await classifyPage(url);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[Classifier/classify]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ── POST /api/classifier/batch  (SSE) ────────────────────────────────────────
router.post('/batch', async (req, res) => {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls) || urls.length === 0)
        return res.status(400).json({ success: false, error: 'urls array required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (type, data) => {
        try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); if (res.flush) res.flush(); } catch { }
    };

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        send('progress', { index: i, total: urls.length, url, pct: Math.round((i / urls.length) * 95) });
        try {
            const result = await classifyPage(url);
            send('result', { index: i, result });
        } catch (err) {
            send('error', { index: i, url, message: err.message });
        }
    }
    send('done', { total: urls.length, pct: 100 });
    res.end();
});

// ── PATCH /api/classifier/override ────────────────────────────────────────────
router.patch('/override', (req, res) => {
    const { url, pageType } = req.body;
    if (!url || !pageType) return res.status(400).json({ success: false, error: 'url and pageType required' });
    const ok = overridePagType(url, pageType);
    if (!ok) return res.status(404).json({ success: false, error: 'Page not found in store' });
    res.json({ success: true });
});

// ── GET /api/classifier/results ───────────────────────────────────────────────
router.get('/results', (req, res) => {
    const pages = getAllClassified();
    res.json({ success: true, pages });
});

// ── DELETE /api/classifier/results/:key ──────────────────────────────────────
router.delete('/results/:key', (req, res) => {
    const file = path.join(__dirname, '../../data/classified_pages.json');
    try {
        const store = JSON.parse(fs.readFileSync(file, 'utf8'));
        const key = decodeURIComponent(req.params.key);
        if (!store[key]) return res.status(404).json({ success: false, error: 'Not found' });
        delete store[key];
        fs.writeFileSync(file, JSON.stringify(store, null, 2));
        res.json({ success: true });
    } catch {
        res.status(500).json({ success: false, error: 'Store error' });
    }
});

module.exports = router;
