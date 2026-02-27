/** GET /api/hygiene/score */
const express = require('express');
const router = express.Router();
const { computeHygieneScore } = require('../services/hygieneScore');

router.get('/score', (req, res) => {
    const { url } = req.query;
    try { res.json({ success: true, score: computeHygieneScore(url) }); }
    catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
