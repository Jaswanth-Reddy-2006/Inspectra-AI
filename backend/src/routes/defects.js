/**
 * Defect Graph Routes
 * GET /api/defects/graph   — build + return graph from stored analysis data
 */
const express = require('express');
const router = express.Router();
const { buildGraph } = require('../services/defectGraph');

router.get('/graph', (_req, res) => {
    try {
        const graph = buildGraph();
        res.json({ success: true, graph });
    } catch (err) {
        console.error('[Defects/graph]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
