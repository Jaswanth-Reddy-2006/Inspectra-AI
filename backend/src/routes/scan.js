const express = require('express');
const router = express.Router();
const { chromium } = require('playwright');
const { crawl } = require('../services/crawler');
const { runAccessibilityAudit } = require('../services/accessibility');
const { runHygieneCheck } = require('../services/hygiene');
const { runMobileAudit } = require('../services/mobileAudit');
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
    const MAX_SCAN_DURATION = 120000; // 120s (2m) Hard Limit

    const session = {
        browsers: [],
        crawlResults: [],
        agents: {
            crawler: { name: 'Autonomous Discovery Agent', status: 'idle', count: 0, time: 0 },
            runtime: { name: 'Runtime Integrity Agent', status: 'idle', count: 0, time: 0 },
            accessibility: { name: 'Accessibility Audit Agent', status: 'idle', count: 0, time: 0 },
            hygiene: { name: 'Structural Hygiene Agent', status: 'idle', count: 0, time: 0 },
            mobile: { name: 'Mobile Intelligence Agent', status: 'idle', count: 0, time: 0 },
            scorer: { name: 'Quality Intelligence Agent', status: 'idle', count: 0, time: 0 }
        },
        globalSignals: {}
    };

    const finalCleanup = async () => {
        for (const browser of session.browsers) {
            try { await browser.close(); } catch (e) { /* silent kill */ }
        }
    };

    const runCoreScan = async () => {
        console.log(`[Scan ${scanId}] Starting blocking scan for ${url} (120s Cap)...`);

        // 1. Autonomous Crawl
        const crawlStart = Date.now();
        session.agents.crawler.status = 'running';
        const crawlData = await crawl(url, 50);
        session.crawlResults = crawlData.pages;
        session.siteMap = crawlData.siteMap;
        session.globalSignals = crawlData.globalSignals;
        session.agents.crawler.time = Date.now() - crawlStart;
        session.agents.crawler.count = session.crawlResults.length;
        session.agents.crawler.status = 'completed';

        console.log(`[Scan ${scanId}] Crawl complete. Found ${session.crawlResults.length} pages. Starting Deep Inspection...`);

        // 2. Deep Inspection (A11y + Hygiene + Runtime)
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        session.browsers.push(browser);

        session.agents.runtime.status = 'running';
        session.agents.accessibility.status = 'running';
        session.agents.hygiene.status = 'running';
        session.agents.mobile.status = 'running';

        const runtimeStart = Date.now();
        let totalA11y = 0;
        let totalHygiene = 0;
        let totalRuntime = 0;
        let totalMobileTime = 0;

        try {
            for (let i = 0; i < session.crawlResults.length; i++) {
                // Check if we are approaching timeout or if browsers were already closed
                if (Date.now() - scanStartTime > MAX_SCAN_DURATION - 5000) break;
                if (session.browsers.length === 0) break;

                const pageResult = session.crawlResults[i];
                const page = await browser.newPage();

                try {
                    console.log(`[Scan ${scanId}] Deep Inspection: ${pageResult.url}`);
                    await page.goto(pageResult.url, { waitUntil: 'domcontentloaded', timeout: 15000 });

                    const [a11yIssues, hygieneIssues, mobileReport, perfMetrics] = await Promise.all([
                        runAccessibilityAudit(page),
                        runHygieneCheck(page),
                        runMobileAudit(pageResult.url, browser), // Mobile engine tests fresh contexts
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
                    pageResult.mobileReport = mobileReport;

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

            session.agents.mobile.time = deepEnd - runtimeStart;
            session.agents.mobile.count = 3; // 3 devices
            session.agents.mobile.status = 'completed';
        }

        return { success: true };
    };

    const runTimeoutGuard = () => new Promise(resolve => setTimeout(() => resolve({ timedOut: true }), MAX_SCAN_DURATION));

    try {
        const raceResult = await Promise.race([runCoreScan(), runTimeoutGuard()]);
        const isTimedOut = raceResult?.timedOut || false;

        if (isTimedOut) {
            console.warn(`[Scan ${scanId}] Hard timeout reached (120s). Finalizing partial results.`);
            await finalCleanup();
            Object.values(session.agents).forEach(a => { if (a.status === 'running') a.status = 'partial'; });
        }

        session.agents.scorer.status = 'running';
        const scorerStart = Date.now();

        // Final Analysis Aggregation (Step 7)
        const overallScore = calculateOverallScore(session.crawlResults);
        const issuesSummary = summarizeIssues(session.crawlResults, session.globalSignals);

        // Calculate Global Risks
        const globalRisks = [];
        const totalSeriousIssues = (issuesSummary.stats?.critical || 0) + (issuesSummary.stats?.high || 0);

        if (totalSeriousIssues > 10) {
            globalRisks.push({
                type: 'Systemic Fragility',
                description: `High density of critical/high failures (${totalSeriousIssues}) detected across multiple autonomous routes.`
            });
        }
        if (session.crawlResults.some(r => r.failureCategory === 'Bot Protection Detected')) {
            globalRisks.push({
                type: 'Anti-Automation Guard',
                description: 'Target domain implements aggressive bot protection that may block QA agents.'
            });
        }

        // Calculate Coverage Score
        const successfulScans = session.crawlResults.filter(r => !r.failureCategory).length;
        const totalIdentified = session.crawlResults.length;
        const coverageScore = totalIdentified > 0 ? Math.round((successfulScans / totalIdentified) * 100) : 0;

        session.agents.scorer.time = Date.now() - scorerStart;
        session.agents.scorer.status = 'completed';

        return {
            id: scanId,
            pages: session.crawlResults,
            overallScore,
            issuesSummary,
            agentOverview: Object.values(session.agents),
            globalRisks,
            coverageScore,
            discoveryGraph: {
                nodes: session.crawlResults.map(r => ({
                    ...r,
                    id: r.url, // Use URL as ID for consistency
                    statusCode: r.statusCode || 200,
                    errors: (r.issues || []).filter(i => i.severity === 'Critical').length
                })),
                edges: session.crawlResults
                    .filter(r => r.parent)
                    .map(r => ({ from: r.parent, to: r.url }))
            },
            meta: {
                timedOut: isTimedOut,
                scanDuration: Math.round((Date.now() - scanStartTime) / 1000),
                agentOverview: Object.values(session.agents)
            }
        };

    } catch (error) {
        await finalCleanup();
        throw error;
    }
}

module.exports = router;
