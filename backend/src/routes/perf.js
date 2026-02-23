/**
 * Performance & Accessibility Routes
 *
 * POST  /api/perf/analyze   — run analysis (SSE streaming progress)
 * GET   /api/perf/results   — load stored results
 */

const express = require('express');
const router = express.Router();
const { analyzePerformanceAndAccessibility } = require('../services/perfAccessibility');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/perf_results.json');

function loadResults() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveResults(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// POST /api/perf/analyze  — SSE
router.post('/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (type, data) => {
        try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); if (res.flush) res.flush(); } catch { }
    };

    try {
        const result = await analyzePerformanceAndAccessibility(url, (progress) => {
            send('progress', progress);
        });
        const store = loadResults();
        // persist without screenshot to keep file small
        store[url] = { ...result, screenshot: undefined };
        saveResults(store);
        send('result', { result });
        send('done', { pct: 100 });
    } catch (err) {
        console.error('[Perf/analyze]', err.message);
        send('error', { message: err.message });
    }
    res.end();
});

// GET /api/perf/results
router.get('/results', (req, res) => {
    const store = loadResults();
    res.json({ success: true, results: Object.values(store) });
});

module.exports = router;
