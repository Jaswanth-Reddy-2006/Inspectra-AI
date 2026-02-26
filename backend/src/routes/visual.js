/**
 * Visual Judge Routes
 * POST /api/visual/compare    — run comparison (SSE)
 * GET  /api/visual/results    — fetch stored results
 */
const express = require('express');
const router = express.Router();
const { compareScreenshots, VIEWPORTS } = require('../services/visualJudge');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/visual_results.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; } }
function save(d) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

router.post('/compare', async (req, res) => {
    const { baselineUrl, currentUrl, viewport = 'desktop' } = req.body;
    if (!baselineUrl || !currentUrl)
        return res.status(400).json({ success: false, error: 'baselineUrl and currentUrl required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (type, data) => {
        try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); if (res.flush) res.flush(); } catch { }
    };

    try {
        const result = await compareScreenshots(baselineUrl, currentUrl, viewport, p => send('progress', p));
        const stored = load();
        // Save without full-size PNGs to keep file reasonable
        stored.unshift({ ...result, baselineImg: undefined, currentImg: undefined, diffImg: undefined });
        save(stored.slice(0, 15));
        send('result', { result });
    } catch (err) {
        console.error('[Visual/compare]', err.message);
        send('error', { message: err.message });
    }
    res.end();
});

router.get('/viewports', (_req, res) => res.json({ success: true, viewports: Object.keys(VIEWPORTS) }));
router.get('/results', (_req, res) => res.json({ success: true, results: load() }));

module.exports = router;
