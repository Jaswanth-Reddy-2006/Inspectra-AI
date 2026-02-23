const express = require('express');
const router = express.Router();
const { chromium } = require('playwright');
const { crawl } = require('../services/crawler');
const { runAccessibilityAudit } = require('../services/accessibility');
const { runHygieneCheck } = require('../services/hygiene');
const { calculatePageScore, calculateOverallScore, summarizeIssues } = require('../services/scorer');

/**
 * Utility: Deduplicate issues using ruleId + selector hash
 */
function deduplicateIssues(issues) {
    const seen = new Set();
    return issues.filter(issue => {
        const selector = issue.element?.selector || 'no-selector';
        const key = `${issue.ruleId}-${selector}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

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
    const MAX_SCAN_DURATION = 90000; // 90s (1.5m) Hard Limit (REDUCED)

    const session = {
        browsers: [],
        crawlResults: [],
        agents: {
            crawler: { name: 'Autonomous Discovery Agent', status: 'idle', count: 0, time: 0 },
            runtime: { name: 'Runtime Integrity Agent', status: 'idle', count: 0, time: 0 },
            accessibility: { name: 'Accessibility Audit Agent', status: 'idle', count: 0, time: 0 },
            hygiene: { name: 'Structural Hygiene Agent', status: 'idle', count: 0, time: 0 },
            scorer: { name: 'Quality Intelligence Agent', status: 'idle', count: 0, time: 0 }
        }
    };

    const finalCleanup = async () => {
        for (const browser of session.browsers) {
            try { await browser.close(); } catch (e) { /* silent kill */ }
        }
    };

    const runCoreScan = async () => {
        console.log(`[Scan ${scanId}] Starting blocking scan for ${url} (90s Cap)...`);

        // 1. Autonomous Crawl
        const crawlStart = Date.now();
        session.agents.crawler.status = 'running';
        session.crawlResults = await crawl(url, 15);
        session.agents.crawler.time = Date.now() - crawlStart;
        session.agents.crawler.count = session.crawlResults.length;
        session.agents.crawler.status = 'completed';

        console.log(`[Scan ${scanId}] Crawl complete. Found ${session.crawlResults.length} pages. Starting Deep Inspection...`);

        // 2. Deep Inspection (A11y + Hygiene + Runtime)
        const browser = await chromium.launch({ headless: true });
        session.browsers.push(browser);

        session.agents.runtime.status = 'running';
        session.agents.accessibility.status = 'running';
        session.agents.hygiene.status = 'running';

        const runtimeStart = Date.now();
        let totalA11y = 0;
        let totalHygiene = 0;
        let totalRuntime = 0;

        try {
            for (let i = 0; i < session.crawlResults.length; i++) {
                // Check if we are approaching timeout
                if (Date.now() - scanStartTime > MAX_SCAN_DURATION - 5000) break;

                const pageResult = session.crawlResults[i];
                const page = await browser.newPage();

                try {
                    await page.goto(pageResult.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

                    // Run A11y and Hygiene in parallel for speed
                    const [a11yIssues, hygieneIssues, perfMetrics] = await Promise.all([
                        runAccessibilityAudit(page),
                        runHygieneCheck(page),
                        page.evaluate(() => {
                            let domContentLoaded, loadTime, fcp;
                            const nav = performance.getEntriesByType('navigation')[0];
                            if (nav) {
                                domContentLoaded = nav.domContentLoadedEventEnd;
                                loadTime = nav.loadEventEnd;
                            } else if (performance.timing) {
                                const t = performance.timing;
                                domContentLoaded = t.domContentLoadedEventEnd - t.navigationStart;
                                loadTime = t.loadEventEnd - t.navigationStart;
                            }

                            const paint = performance.getEntriesByType('paint');
                            const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');
                            fcp = fcpEntry ? fcpEntry.startTime : null;

                            return {
                                domContentLoaded: domContentLoaded && domContentLoaded > 0 ? Math.round(domContentLoaded) : "Not Measurable",
                                loadTime: loadTime && loadTime > 0 ? Math.round(loadTime) : "Not Measurable",
                                fcp: fcp && fcp > 0 ? Math.round(fcp) : "Not Measurable"
                            };
                        })
                    ]);

                    totalA11y += a11yIssues.length;
                    totalHygiene += hygieneIssues.length;
                    totalRuntime += pageResult.issues.length; // From crawler capture

                    pageResult.perf = perfMetrics;
                    pageResult.loadTime = perfMetrics.loadTime || pageResult.loadTime;

                    const combinedIssues = [...pageResult.issues, ...a11yIssues, ...hygieneIssues];
                    pageResult.issues = deduplicateIssues(combinedIssues);
                    pageResult.score = calculatePageScore(pageResult.issues);
                } catch (navError) {
                    console.warn(`[Scan ${scanId}] Deep Inspection failed for ${pageResult.url}:`, navError.message);
                } finally {
                    await page.close();
                }
            }
        } finally {
            await browser.close();
            session.browsers = session.browsers.filter(b => b !== browser);

            const deepEnd = Date.now();
            session.agents.runtime.time = deepEnd - runtimeStart;
            session.agents.runtime.count = totalRuntime;
            session.agents.runtime.status = 'completed';

            session.agents.accessibility.time = deepEnd - runtimeStart;
            session.agents.accessibility.count = totalA11y;
            session.agents.accessibility.status = 'completed';

            session.agents.hygiene.time = deepEnd - runtimeStart;
            session.agents.hygiene.count = totalHygiene;
            session.agents.hygiene.status = 'completed';
        }

        return { success: true };
    };

    const runTimeoutGuard = () => new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), MAX_SCAN_DURATION));

    try {
        const raceResult = await Promise.race([runCoreScan(), runTimeoutGuard()]);
        const isTimedOut = raceResult?.timedOut || false;

        if (isTimedOut) {
            console.warn(`[Scan ${scanId}] Hard timeout reached (90s). Finalizing partial results.`);
            await finalCleanup();
            // Mark agents as partial if timed out
            Object.values(session.agents).forEach(a => { if (a.status === 'running') a.status = 'partial'; });
        }

        session.agents.scorer.status = 'running';
        const scorerStart = Date.now();
        const overallScore = calculateOverallScore(session.crawlResults);
        const issuesSummary = summarizeIssues(session.crawlResults);
        session.agents.scorer.time = Date.now() - scorerStart;
        session.agents.scorer.status = 'completed';

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
            scanDuration: Math.round((Date.now() - scanStartTime) / 1000),
            agentOverview: Object.values(session.agents)
        };

        return finalResult;

    } catch (error) {
        await finalCleanup();
        throw error;
    }
}

module.exports = router;
