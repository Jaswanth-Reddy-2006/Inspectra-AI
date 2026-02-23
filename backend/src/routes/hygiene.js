/** GET /api/hygiene/score */
const express = require('express');
const router = express.Router();
const { computeHygieneScore } = require('../services/hygieneScore');

router.get('/score', (_req, res) => {
    try { res.json({ success: true, score: computeHygieneScore() }); }
    catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
