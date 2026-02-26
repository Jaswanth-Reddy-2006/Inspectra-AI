/** GET /api/risk/analysis */
const express = require('express');
const router = express.Router();
const { computeRiskAnalysis } = require('../services/riskAnalysis');

router.get('/analysis', (_req, res) => {
    try { res.json({ success: true, analysis: computeRiskAnalysis() }); }
    catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
