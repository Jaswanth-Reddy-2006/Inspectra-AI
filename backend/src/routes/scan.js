const express = require('express');
const router = express.Router();
const { crawl } = require('../services/crawler');
const { runAccessibilityAudit } = require('../services/accessibility');
const { runHygieneCheck } = require('../services/hygiene');
const { runMobileAudit } = require('../services/mobileAudit');
const { calculateOverallScore, summarizeIssues } = require('../services/scorer');
const { launchBrowser } = require('../utils/browser');

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
        console.log(`[ROUTE] POST /api/scan for URL: ${url}`);
        const result = await performScan(scanId, url);
        res.json({ success: true, ...result });
    } catch (error) {
        console.error(`[Scan ${scanId}] Fatal Route Error:`, error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to scan application.',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Background orchestration engine
 */
async function performScan(scanId, url) {
    const startTime = Date.now();
    const MAX_SCAN_DURATION = 120000; // 2 minutes hard cap

    const agents = [
        { id: 'CRAWLER', name: 'Intelligent Crawler', status: 'Pending', progress: 0, completed: 0 },
        { id: 'AUDIT', name: 'Structural Audit Agent', status: 'Pending', progress: 0, completed: 0 },
        { id: 'SECURITY', name: 'Security Logic Agent', status: 'Pending', progress: 0, completed: 0 },
        { id: 'INTELLIGENCE', name: 'Intelligence Hub', status: 'Pending', progress: 0, completed: 0 }
    ];

    try {
        // 1. Autonomous Crawl
        console.log(`[Scan ${scanId}] Phase 1: Crawling ${url}`);
        agents[0].status = 'Running';
        const crawlData = await crawl(url, 15);
        const crawlResults = crawlData.pages || [];
        const globalSignals = crawlData.globalSignals || {};

        agents[0].status = 'Completed';
        agents[0].progress = 100;
        agents[0].completed = crawlResults.length;

        if (crawlResults.length === 0) {
            console.warn(`[Scan ${scanId}] No pages found during crawl.`);
            return formatEmptyResult(scanId, url, startTime);
        }

        // 2. Deep Inspection (Sequential for Memory Stability)
        console.log(`[Scan ${scanId}] Phase 2: Deep Inspection across 3 core nodes.`);
        agents[1].status = 'Running';
        agents[2].status = 'Running';

        const inspectionLimit = Math.min(crawlResults.length, 3);
        let pagesAudited = 0;
        let totalIssuesDetected = 0;

        const browser = await launchBrowser();

        try {
            for (let i = 0; i < inspectionLimit; i++) {
                // Check if we are approaching timeout
                if (Date.now() - startTime > MAX_SCAN_DURATION - 20000) {
                    console.warn(`[Scan ${scanId}] Timeout approaching, stopping deep inspection.`);
                    break;
                }

                const pageResult = crawlResults[i];
                const page = await browser.newPage();

                try {
                    console.log(`[Scan ${scanId}] Inspecting node ${i + 1}/${inspectionLimit}: ${pageResult.url}`);

                    await page.goto(pageResult.url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 20000
                    }).catch(e => console.warn(`[Scan ${scanId}] Load error for ${pageResult.url}: ${e.message}`));

                    // Sequential Audits (Memory-Safe)
                    const a11yIssues = await runAccessibilityAudit(page).catch(() => []);
                    const hygieneIssues = await runHygieneCheck(page).catch(() => []);
                    const mobileReport = await runMobileAudit(pageResult.url, browser).catch(() => null);

                    const perfMetrics = await page.evaluate(() => {
                        const nav = performance.getEntriesByType('navigation')[0];
                        return {
                            loadTime: nav ? Math.round(nav.duration) : 0,
                            fcp: nav ? Math.round(nav.responseEnd) : 0,
                            domCount: document.querySelectorAll('*').length
                        };
                    }).catch(() => ({ loadTime: 0, fcp: 0, domCount: 0 }));

                    // Enrich page data
                    pageResult.issues = [
                        ...(pageResult.issues || []),
                        ...a11yIssues,
                        ...hygieneIssues
                    ];
                    pageResult.perf = perfMetrics;
                    pageResult.loadTime = perfMetrics.loadTime;
                    pageResult.mobileReport = mobileReport;
                    pageResult.status = 'Completed';

                    totalIssuesDetected += (pageResult.issues.length || 0);
                    pagesAudited++;

                } catch (err) {
                    console.error(`[Scan ${scanId}] Node error:`, err.message);
                    pageResult.status = 'Error';
                } finally {
                    await page.close().catch(() => { });
                }
            }
        } finally {
            await browser.close().catch(() => { });
        }

        agents[1].status = 'Completed';
        agents[1].progress = 100;
        agents[1].completed = pagesAudited;

        agents[2].status = 'Completed';
        agents[2].progress = 100;
        agents[2].completed = totalIssuesDetected;

        // 3. Synthesis & Analysis
        console.log(`[Scan ${scanId}] Phase 3: Final Analysis Synthesis`);
        agents[3].status = 'Running';
        const issuesSummary = summarizeIssues(crawlResults, globalSignals);
        agents[3].status = 'Completed';
        agents[3].progress = 100;
        agents[0].completed = issuesSummary.stats?.totalDefects || totalIssuesDetected;

        return {
            scanId,
            targetUrl: url,
            startTime,
            endTime: Date.now(),
            duration: (Date.now() - startTime) / 1000,
            totalPages: crawlResults.length,
            pagesInspected: pagesAudited,
            score: issuesSummary.scoreImpact?.finalScore || 100,
            issuesSummary,
            discoveryGraph: {
                nodes: issuesSummary.knowledgeGraph?.nodes || [],
                links: issuesSummary.knowledgeGraph?.links || []
            },
            globalRisks: issuesSummary.rootCauseAnalysis || [],
            agents
        };

    } catch (error) {
        console.error(`[Scan ${scanId}] Orchestration Failure:`, error);
        throw error;
    }
}

function formatEmptyResult(scanId, url, startTime) {
    return {
        scanId,
        targetUrl: url,
        startTime,
        duration: (Date.now() - startTime) / 1000,
        totalPages: 0,
        pagesInspected: 0,
        score: 100,
        issuesSummary: { stats: { totalDefects: 0 }, scoreImpact: { finalScore: 100 } },
        discoveryGraph: { nodes: [], links: [] },
        globalRisks: [],
        agents: [
            { id: 'CRAWLER', name: 'Intelligent Crawler', status: 'Warning', progress: 100, completed: 0 },
            { id: 'AUDIT', name: 'Structural Audit Agent', status: 'Skipped', progress: 0, completed: 0 }
        ]
    };
}

module.exports = router;
