/**
 * Network Monitor Routes
 *
 * POST  /api/network/monitor   — run CDP network capture (SSE streaming)
 * GET   /api/network/results   — load stored captures
 */

const express = require('express');
const router = express.Router();
const { monitorNetwork } = require('../services/networkMonitor');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/network_results.json');

function loadResults() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveResults(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// POST /api/network/monitor — SSE progress + final result
router.post('/monitor', async (req, res) => {
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
        const result = await monitorNetwork(url, (progress) => {
            send('progress', progress);
        });
        const store = loadResults();
        store[url] = { ...result, screenshot: undefined }; // don't persist screenshot
        saveResults(store);
        send('result', { result });
        send('done', { pct: 100 });
    } catch (err) {
        console.error('[Network/monitor]', err.message);
        send('error', { message: err.message });
    }
    res.end();
});

// GET /api/network/results
router.get('/results', (req, res) => {
    const store = loadResults();
    res.json({ success: true, results: Object.values(store) });
});

module.exports = router;
