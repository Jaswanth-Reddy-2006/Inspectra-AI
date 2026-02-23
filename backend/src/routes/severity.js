/**
 * Severity Matrix Routes
 * GET /api/severity/matrix — compute + return scored defect registry
 */
const express = require('express');
const router = express.Router();
const { buildSeverityMatrix } = require('../services/severityMatrix');

router.get('/matrix', (_req, res) => {
    try {
        const matrix = buildSeverityMatrix();
        res.json({ success: true, matrix });
    } catch (err) {
        console.error('[Severity/matrix]', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
