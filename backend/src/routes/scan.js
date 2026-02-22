const express = require('express');
const router = express.Router();
const { chromium } = require('playwright');
const { crawl } = require('../services/crawler');
const { runAccessibilityAudit } = require('../services/accessibility');
const { calculatePageScore, calculateOverallScore, summarizeIssues } = require('../services/scorer');

/**
 * @route POST /api/scan
 * @desc Start an autonomous scan and wait for final results (Blocking)
 */
router.post('/', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const scanId = Math.random().toString(36).substring(2, 11);

    try {
        const result = await performScan(scanId, url);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error(`[Scan ${scanId}] Fatal Route Error:`, error);
        res.status(500).json({ success: false, error: error.message || 'Failed to scan application.' });
    }
});

/**
 * Background orchestration engine
 */
async function performScan(scanId, url) {
    const scanStartTime = Date.now();
    const MAX_SCAN_DURATION = 180000; // 180s (3m) Hard Limit

    const session = {
        browsers: [],
        crawlResults: []
    };

    const finalCleanup = async () => {
        for (const browser of session.browsers) {
            try { await browser.close(); } catch (e) { /* silent kill */ }
        }
    };

    const runCoreScan = async () => {
        console.log(`[Scan ${scanId}] Starting blocking scan for ${url}...`);

        // 1. Autonomous Crawl
        session.crawlResults = await crawl(url, 8);

        console.log(`[Scan ${scanId}] Crawl complete. Found ${session.crawlResults.length} pages.`);

        // 2. Deep Accessibility Audit & Analysis
        const browser = await chromium.launch({ headless: true });
        session.browsers.push(browser);

        try {
            for (let i = 0; i < session.crawlResults.length; i++) {
                const pageResult = session.crawlResults[i];
                const page = await browser.newPage();

                try {
                    console.log(`[Scan ${scanId}] Deep Inspection: ${pageResult.url}`);
                    await page.goto(pageResult.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    const a11yIssues = await runAccessibilityAudit(page);
                    pageResult.issues.push(...a11yIssues);
                    pageResult.score = calculatePageScore(pageResult.issues);
                } catch (navError) {
                    console.warn(`[Scan ${scanId}] Meta-analysis failed for ${pageResult.url}`);
                } finally {
                    await page.close();
                }
            }
        } finally {
            await browser.close();
            session.browsers = session.browsers.filter(b => b !== browser);
        }

        return { success: true };
    };

    const runTimeoutGuard = () => new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), MAX_SCAN_DURATION));

    try {
        const raceResult = await Promise.race([runCoreScan(), runTimeoutGuard()]);
        const isTimedOut = raceResult?.timedOut || false;

        if (isTimedOut) {
            console.warn(`[Scan ${scanId}] Hard timeout reached (60s).`);
            await finalCleanup();
        }

        const overallScore = calculateOverallScore(session.crawlResults);
        const issuesSummary = summarizeIssues(session.crawlResults);
        const failures = session.crawlResults.filter(r => r.failureCategory).map(r => r.failureCategory);

        const meta = { timedOut: isTimedOut };
        if (failures.length > 0) {
            meta.failureCategory = failures[0];
            meta.failureCount = failures.length;
        }

        const finalResult = {
            id: scanId,
            overallScore,
            totalPagesScanned: session.crawlResults.length,
            issuesSummary,
            pages: session.crawlResults,
            meta,
            scanDuration: Math.round((Date.now() - scanStartTime) / 1000)
        };

        return finalResult;

    } catch (error) {
        await finalCleanup();
        throw error;
    }
}

module.exports = router;
