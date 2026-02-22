const express = require('express');
const router = express.Router();
const { chromium } = require('playwright');
const { crawl } = require('../services/crawler');
const { runAccessibilityAudit } = require('../services/accessibility');
const { calculatePageScore, calculateOverallScore, summarizeIssues } = require('../services/scorer');

router.post('/', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    try {
        console.log(`Starting scan for: ${url}`);

        // 1. Initial Crawl & Functional Analysis
        const crawlResults = await crawl(url);

        // 2. Perform Accessibility Audit on each page
        // We launch another browser instance or use the same context if we had passed it.
        // For simplicity and decoupling, we run it separately or refine crawler to include it.
        // Refined approach: Include accessibility in the crawler to avoid multiple visits.
        // Let's modify the crawler to accept an optional audit function.

        const browser = await chromium.launch({ headless: true });
        try {
            for (let pageResult of crawlResults) {
                const page = await browser.newPage();
                await page.goto(pageResult.url, { waitUntil: 'networkidle' });
                const a11yIssues = await runAccessibilityAudit(page);
                pageResult.issues.push(...a11yIssues);
                await page.close();

                // Calculate score for this page
                pageResult.score = calculatePageScore(pageResult.issues);
            }
        } finally {
            await browser.close();
        }

        // 3. Overall Scoring
        const overallScore = calculateOverallScore(crawlResults);
        const issuesSummary = summarizeIssues(crawlResults);

        res.json({
            success: true,
            overallScore,
            totalPagesScanned: crawlResults.length,
            issuesSummary,
            pages: crawlResults
        });

    } catch (error) {
        console.error('Scan failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
