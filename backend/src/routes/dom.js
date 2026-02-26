/**
 * DOM Analysis Routes
 *
 * POST  /api/dom/analyze   — analyze single URL, return elements + tree + scores
 * GET   /api/dom/results   — list stored results
 */

const express = require('express');
const router = express.Router();
const { analyzeDom } = require('../services/domAnalyzer');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/dom_results.json');

function loadResults() {
    try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveResults(data) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// POST /api/dom/analyze (Alias for intelligence engine spec)
router.post(['/analyze', '/intelligence'], async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url required' });
    try {
        const result = await analyzeDom(url);
        const store = loadResults();
        store[url] = result;
        saveResults(store);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('[DOM/analyze]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/dom/results
router.get('/results', (req, res) => {
    const store = loadResults();
    res.json({ success: true, results: Object.values(store) });
});

module.exports = router;
