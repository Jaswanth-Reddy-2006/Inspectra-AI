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

async function crawl(startUrl, maxPages = 8, onProgress) {
    const browser = await chromium.launch({ headless: true });

    if (onProgress) {
        onProgress({
            stage: 'Scanning DOM structure & page hierarchy',
            progress: 10
        });
    }
    const context = await browser.newContext({});
    const visited = new Set();
    const queue = [startUrl];
    const results = [];
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 3;

    let baseOrigin;
    try {
        baseOrigin = new URL(startUrl).origin;
    } catch {
        console.error('Invalid start URL:', startUrl);
        await browser.close();
        return results;
    }

    while (queue.length > 0 && visited.size < maxPages) {
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.warn(`[Crawler] Stopping crawl early due to ${consecutiveFailures} consecutive failures.`);
            break;
        }

        const url = queue.shift();
        const normalizedUrl = url.split('#')[0];
        if (visited.has(normalizedUrl)) continue;
        visited.add(normalizedUrl);

        const page = await context.newPage();
        const issues = [];
        let failureCategory = null;

        // ... event handlers (console, pageerror, requestfailed) ...
        page.on('console', msg => {
            if (msg.type() === 'error') {
                issues.push({
                    type: 'Console Error',
                    description: msg.text(),
                    severity: SEVERITY.HIGH
                });
            }
        });

        page.on('pageerror', err => {
            issues.push({
                type: 'JS Exception',
                description: err.message,
                severity: SEVERITY.CRITICAL
            });
        });

        page.on('requestfailed', request => {
            issues.push({
                type: 'Network Failure',
                description: `Failed to load: ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
                severity: SEVERITY.MEDIUM
            });
        });

        let loadTime = 0;

        try {
            const startTime = Date.now();
            let response = null;

            try {
                response = await page.goto(normalizedUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 10000 // 10s per page for crawl
                });

                if (response && !response.ok()) {
                    failureCategory = classifyError(null, response);
                    consecutiveFailures++;
                } else {
                    consecutiveFailures = 0; // Reset on success
                }
            } catch (navError) {
                console.warn(`Navigation failed for ${normalizedUrl}: ${navError.message}`);
                failureCategory = classifyError(navError, response);
                consecutiveFailures++;
                issues.push({
                    type: 'Navigation Failure',
                    description: `Page navigation failed: ${navError.message}`,
                    severity: SEVERITY.HIGH
                });
            }

            loadTime = Date.now() - startTime;

            // Reduced hydration wait to 500ms
            await page.waitForTimeout(500);

            if (onProgress) {
                onProgress({
                    stage: `Mapping elements & analyzing: ${normalizedUrl}`,
                    progress: Math.min(20 + Math.floor((visited.size / maxPages) * 30), 50)
                });
            }

            let links = [];
            try {
                links = await page.evaluate((origin) => {
                    return Array.from(document.querySelectorAll('a[href]'))
                        .map(a => {
                            try { return new URL(a.href, window.location.href).href; } catch { return null; }
                        })
                        .filter(href => href && href.startsWith(origin));
                }, baseOrigin);
            } catch (evalError) {
                console.warn(`Link extraction failed for ${normalizedUrl}: ${evalError.message}`);
            }

            for (const link of links) {
                const cleanLink = link.split('#')[0];
                if (cleanLink && !visited.has(cleanLink) && !queue.includes(cleanLink)) {
                    queue.push(cleanLink);
                }
            }

            results.push({
                url: normalizedUrl,
                loadTime,
                issues,
                failureCategory
            });

        } catch (error) {
            console.error(`Unexpected error crawling ${normalizedUrl}:`, error.message);
            consecutiveFailures++;
            results.push({
                url: normalizedUrl,
                loadTime,
                failureCategory: failureCategory || classifyError(error, null),
                issues: [
                    ...issues,
                    {
                        type: 'Crawler Error',
                        description: `Unexpected crawl failure: ${error.message}`,
                        severity: SEVERITY.CRITICAL
                    }
                ]
            });
        } finally {
            try { await page.close(); } catch { }
        }
    }

    await browser.close();
    return results;
}

module.exports = { crawl };
