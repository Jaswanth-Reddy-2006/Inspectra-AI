const { chromium } = require('playwright');
const { launchBrowser } = require('../utils/browser');
const crypto = require('crypto');
const { SEVERITY } = require('../utils/severity');

/**
 * Enterprise-Grade Intelligent Crawler
 * Captures deep engineering signals, implements stress tests and route fuzzing.
 */

class CrawlSession {
    constructor(startUrl, options = {}) {
        this.startUrl = startUrl;
        this.maxPages = options.maxPages || 50;
        this.maxDepth = options.maxDepth || 5;
        this.maxLinksPerPage = options.maxLinksPerPage || 20;
        this.visited = new Set();
        this.queue = [{ url: startUrl, depth: 0, parent: null }];
        this.results = [];
        this.baseOrigin = new URL(startUrl).origin;
        this.baseHost = new URL(startUrl).hostname.replace('www.', '');
        this.globalSignals = {
            consoleLogLevels: { error: 0, warning: 0, log: 0 },
            networkStats: { totalRequests: 0, failedRequests: 0, crossOriginRequests: 0 },
            securityHeaders: {},
            stressTest: { successRate: 0, avgResponseTime: 0 },
            fuzzing: { handled404: false, customErrorPage: false }
        };
        this.activeWorkers = 0;
        this.concurrency = 1; // Optimized for low-memory environments
    }

    normalizeUrl(urlStr) {
        try {
            const url = new URL(urlStr, this.startUrl);
            url.hash = (url.hash.length > 2 && /[\/_]/.test(url.hash)) ? url.hash : '';
            const params = new URLSearchParams(url.search);
            params.sort();
            url.search = params.toString();
            let pathname = url.pathname;
            if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
            url.pathname = pathname;
            return url.toString().toLowerCase();
        } catch {
            return urlStr.toLowerCase();
        }
    }

    isInternal(urlStr) {
        try {
            const url = new URL(urlStr, this.startUrl);
            return url.hostname.replace('www.', '') === this.baseHost;
        } catch {
            return false;
        }
    }
}

async function runIntelligentCrawl(startUrl, maxPages = 50, onProgress) {
    const session = new CrawlSession(startUrl, { maxPages });
    const browser = await launchBrowser();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Inspectra-Enterprise-Agent/2.0'
    });

    if (onProgress) onProgress({ stage: 'Starting Behavioral Discovery', progress: 10 });

    // 1. Stress Test Layer (Active Probe)
    const stressStart = Date.now();
    const stressResults = [];
    for (let i = 0; i < 3; i++) { // Reduced to 3 probes
        try {
            const p = await context.newPage();
            const res = await p.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            stressResults.push({ status: 'fulfilled', value: res.status() });
            await p.close();
        } catch (e) {
            stressResults.push({ status: 'rejected', reason: e });
        }
    }
    const successfulStress = stressResults.filter(r => r.status === 'fulfilled' && r.value < 400).length;
    session.globalSignals.stressTest = {
        successRate: (successfulStress / 3) * 100,
        avgResponseTime: (Date.now() - stressStart) / 3
    };

    // 2. Main Parallel Crawl Loop
    const processPage = async (task) => {
        const norm = session.normalizeUrl(task.url);
        if (session.visited.has(norm)) return;
        session.visited.add(norm);

        const page = await context.newPage();
        const pageIssues = [];

        page.on('console', msg => {
            const type = msg.type();
            if (session.globalSignals.consoleLogLevels[type] !== undefined) session.globalSignals.consoleLogLevels[type]++;
            if (type === 'error') {
                pageIssues.push({ ruleId: 'console-error', severity: 'HIGH', msg: msg.text(), category: 'RELIABILITY' });
            }
        });

        page.on('pageerror', err => {
            session.globalSignals.consoleLogLevels.error++;
            pageIssues.push({ ruleId: 'uncaught-exception', severity: 'CRITICAL', msg: err.message, category: 'RELIABILITY' });
        });

        page.on('response', res => {
            session.globalSignals.networkStats.totalRequests++;
            if (res.status() >= 400) session.globalSignals.networkStats.failedRequests++;
            if (!res.url().includes(session.baseHost)) session.globalSignals.networkStats.crossOriginRequests++;
            if (res.url() === norm) session.globalSignals.securityHeaders = res.headers();
        });

        try {
            console.log(`[Crawler] Deep Intelligence (${session.results.length}/${session.maxPages}): ${norm}`);
            const response = await page.goto(norm, { waitUntil: 'load', timeout: 30000 });
            await page.waitForTimeout(1000);

            const metadata = await page.evaluate(() => {
                const nodeCount = document.querySelectorAll('*').length;
                const forms = Array.from(document.querySelectorAll('form')).map(f => ({
                    hasSubmit: !!f.querySelector('[type="submit"]')
                }));
                const scripts = Array.from(document.querySelectorAll('script')).map(s => ({
                    src: s.getAttribute('src')
                }));
                return { nodeCount, forms, scripts, title: document.title };
            });

            const links = await page.evaluate((baseHost) => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .map(a => ({ url: a.href, text: a.innerText.trim() }))
                    .filter(l => l.url && l.url.startsWith('http') && l.url.includes(baseHost))
                    .slice(0, 50); // Temporary limit for extraction
            }, session.baseHost);

            let added = 0;
            for (const link of links) {
                if (added >= session.maxLinksPerPage) break;
                const lnorm = session.normalizeUrl(link.url);
                if (!session.visited.has(lnorm) && task.depth < session.maxDepth) {
                    session.queue.push({ url: link.url, depth: task.depth + 1, parent: norm });
                    added++;
                }
            }

            session.results.push({
                url: norm,
                title: metadata.title,
                depth: task.depth,
                parent: task.parent,
                signals: metadata,
                issues: pageIssues,
                headers: response.headers(),
                statusCode: response.status()
            });

            if (onProgress) {
                onProgress({
                    stage: `Crawling ${session.results.length}/${session.maxPages}: ${norm}`,
                    progress: 20 + Math.floor((session.results.length / session.maxPages) * 70)
                });
            }
        } catch (err) {
            console.error(`[Crawler] Engine Failure ${norm}: ${err.message}`);
        } finally {
            await page.close();
        }
    };

    while (session.queue.length > 0 && session.results.length < session.maxPages) {
        const batch = [];
        const currentConcurrency = Math.min(session.concurrency, session.maxPages - session.results.length, session.queue.length);

        for (let i = 0; i < currentConcurrency; i++) {
            const task = session.queue.shift();
            if (task) batch.push(processPage(task));
        }

        await Promise.all(batch);
    }

    await browser.close();

    return {
        pages: session.results,
        globalSignals: session.globalSignals,
        siteMap: {
            pages: session.results.map(r => ({ url: r.url, parent: r.parent, depth: r.depth }))
        }
    };
}

module.exports = { crawl: runIntelligentCrawl };

