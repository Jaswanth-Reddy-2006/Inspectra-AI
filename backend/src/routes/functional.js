/**
 * Functional Judge Routes — SSE streaming
 * POST /api/functional/run     — run all/selected flows against a URL
 * GET  /api/functional/results — retrieve stored results
 */
const express = require('express');
const router = express.Router();
const { runAllFlows, FLOW_DEFINITIONS } = require('../services/functionalJudge');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/functional_results.json');

function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; } }
function save(d) {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

// GET /api/functional/flows  — available flow definitions (no auth, no Playwright)
router.get('/flows', (_req, res) => {
    const flows = Object.entries(FLOW_DEFINITIONS).map(([id, f]) => ({
        id, name: f.name, goal: f.goal, icon: f.icon, color: f.color,
        stepCount: f.steps.length,
    }));
    res.json({ success: true, flows });
});

// POST /api/functional/run — SSE
router.post('/run', async (req, res) => {
    const { url, flows: flowIds } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url required' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (type, data) => {
        try { res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`); if (res.flush) res.flush(); } catch { }
    };

    const allIds = flowIds?.length ? flowIds : Object.keys(FLOW_DEFINITIONS);
    const total = allIds.length;
    let done = 0;

    try {
        const results = await runAllFlows(
            url,
            flowIds,
            (flowResult) => {
                done++;
                send('flow_complete', { flow: flowResult, progress: { done, total } });
            },
            (flowId, step, stepNum) => {
                send('step', { flowId, step, stepNum });
            }
        );

        // Persist (without screenshots to keep file small)
        const stored = load();
        const entry = {
            url,
            runAt: new Date().toISOString(),
            results: results.map(r => ({
                ...r,
                steps: r.steps.map(s => ({ ...s, screenshot: undefined })),
            })),
        };
        stored.unshift(entry);
        save(stored.slice(0, 20));   // keep last 20 runs

        send('done', { results });
    } catch (err) {
        console.error('[Functional/run]', err.message);
        send('error', { message: err.message });
    }

    res.end();
});

// GET /api/functional/results
router.get('/results', (_req, res) => {
    res.json({ success: true, results: load() });
});

module.exports = router;
