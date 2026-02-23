const { chromium } = require('playwright');
const { SEVERITY } = require('../utils/severity');

/**
 * Classifies navigation and crawl failures into user-friendly categories.
 */
function classifyError(error, response) {
    if (response?.status() === 401) return "Authentication Required";
    if (response?.status() === 403) return "Bot Protection Detected";
    if (response?.status() === 429) return "Rate Limited";
    if (error && error.message.includes('ERR_CERT')) return "SSL Error";
    if (error && error.message.includes('timeout')) return "Navigation Timeout";
    if (error && error.message.includes('ERR_CONNECTION')) return "Connection Failed";
    return "Unknown Failure";
}

/**
 * Utility: Normalize URLs for consistent tracking and deterministic results.
 */
function normalizeUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        url.hash = ''; // Remove hash fragments
        // Sort query params
        const params = new URLSearchParams(url.search);
        params.sort();
        url.search = params.toString();

        // Normalize trailing slash (except for empty path)
        let pathname = url.pathname;
        if (pathname.length > 1 && pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        url.pathname = pathname;

        return url.toString().toLowerCase(); // Deterministic lowercase
    } catch {
        return urlStr.toLowerCase();
    }
}

async function crawl(startUrl, maxPages = 15, onProgress) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 InspectraDiscovery/1.0'
    });

    const visited = new Set();
    const queue = [{ url: startUrl, depth: 0 }];
    const results = [];
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3;
    const MAX_DEPTH = 3;
    const PAGE_TIMEOUT = 10000; // 10s max per page for 90s total limit

    let baseOrigin;
    try {
        baseOrigin = new URL(startUrl).origin;
    } catch {
        await browser.close();
        return results;
    }

    if (onProgress) {
        onProgress({ stage: 'Initializing Autonomous Explorer', progress: 5 });
    }

    while (queue.length > 0 && visited.size < maxPages) {
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) break;

        const { url, depth } = queue.shift();
        const norm = normalizeUrl(url);

        if (visited.has(norm)) continue;
        visited.add(norm);

        const page = await context.newPage();
        const issues = [];
        let failureCategory = null;

        const { SEVERITY, SEVERITY_METADATA } = require('../utils/severity');

        // Capture runtime errors and network events
        page.on('console', msg => {
            if (msg.type() === 'error') {
                issues.push({
                    type: 'RUNTIME_CONSOLE_ERROR',
                    severity: SEVERITY.HIGH,
                    description: `Console Error: ${msg.text()}`,
                    location: norm,
                    fixSuggestion: 'Investigate client-side logs for specific failure details.'
                });
            }
        });

        page.on('pageerror', err => {
            issues.push({
                type: 'JS_EXCEPTION',
                severity: SEVERITY.CRITICAL,
                description: err.message,
                stack: err.stack,
                location: norm,
                fixSuggestion: 'Resolve uncaught frontend exceptions impacting stability.'
            });
        });

        page.on('requestfailed', request => {
            issues.push({
                type: 'NETWORK_FAILURE',
                severity: SEVERITY.MEDIUM,
                description: `Request Failed: ${request.url()} (${request.failure().errorText})`,
                location: norm,
                fixSuggestion: 'Check for broken assets or CORS issues.'
            });
        });

        page.on('response', response => {
            const status = response.status();
            if (status >= 400) {
                issues.push({
                    type: 'NETWORK_ERROR',
                    severity: status >= 500 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
                    description: `Network ${status} on ${response.url()}`,
                    location: norm,
                    fixSuggestion: 'Verify endpoint availability and server-side logs.'
                });
            }
        });

        let perf = { fcp: null, lcp: null, loadTime: 0 };
        try {
            const startTime = Date.now();
            const response = await page.goto(norm, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT });
            loadTime = Date.now() - startTime;

            // Capture Performance Metrics (LCP, FCP)
            const performanceData = await page.evaluate(() => {
                const getMetric = (name) => {
                    const entry = performance.getEntriesByName(name)[0] || performance.getEntriesByType('paint').find(e => e.name === name);
                    return entry ? Math.round(entry.startTime) : null;
                };

                // Fallback for LCP which might not be triggered yet
                return {
                    fcp: getMetric('first-contentful-paint'),
                    lcp: getMetric('largest-contentful-paint') || null
                };
            });
            perf = { ...performanceData, loadTime };

            if (response && !response.ok()) {
                failureCategory = classifyError(null, response);
                consecutiveFailures++;
            } else {
                consecutiveFailures = 0;
            }

            if (onProgress) {
                onProgress({
                    stage: `Discovering: ${norm}`,
                    progress: Math.min(10 + Math.floor((visited.size / maxPages) * 40), 60)
                });
            }

            // Enhanced Link Discovery
            if (depth < MAX_DEPTH) {
                let discoveredLinks = await page.evaluate((origin) => {
                    const links = new Set();
                    // 1. Standard anchors
                    document.querySelectorAll('a[href]').forEach(a => {
                        try {
                            const u = new URL(a.href, window.location.href);
                            if (u.origin === origin) links.add(u.href);
                        } catch { }
                    });

                    // 2. Buttons with href-like data or simple scripts
                    document.querySelectorAll('button[onclick], button[data-href], [role="link"]').forEach(el => {
                        const href = el.getAttribute('data-href') || el.getAttribute('href');
                        if (href) {
                            try {
                                const u = new URL(href, window.location.href);
                                if (u.origin === origin) links.add(u.href);
                            } catch { }
                        }
                    });

                    return Array.from(links);
                }, baseOrigin);

                // Deterministic ordering and deduplication
                discoveredLinks
                    .map(l => normalizeUrl(l))
                    .sort()
                    .forEach(l => {
                        if (!visited.has(l) && !queue.find(q => q.url === l)) {
                            queue.push({ url: l, depth: depth + 1 });
                        }
                    });
            }

            results.push({
                url: norm,
                perf,
                issues,
                failureCategory,
                order: visited.size // Stable ordering
            });

        } catch (error) {
            consecutiveFailures++;
            results.push({
                url: norm,
                loadTime: 0,
                failureCategory: classifyError(error, null),
                issues: [{ type: 'Navigation Failure', description: error.message, severity: SEVERITY.HIGH }]
            });
        } finally {
            await page.close();
        }
    }

    await browser.close();
    return results;
}

module.exports = { crawl };
