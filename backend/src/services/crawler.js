const { chromium } = require('playwright');
const { SEVERITY } = require('../utils/severity');

async function crawl(startUrl, maxPages = 10) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const visited = new Set();
    const queue = [startUrl];
    const results = [];

    const baseUrl = new URL(startUrl).origin;

    while (queue.length > 0 && visited.size < maxPages) {
        const url = queue.shift();
        if (visited.has(url)) continue;
        visited.add(url);

        const page = await context.newPage();

        // Analyzer hooks
        const issues = [];
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
                description: `Failed to load: ${request.url()} (${request.failure().errorText})`,
                severity: SEVERITY.MEDIUM
            });
        });

        try {
            const startTime = Date.now();
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            const loadTime = Date.now() - startTime;

            // Extract links
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.href)
                    .filter(href => href.startsWith(window.location.origin));
            });

            for (const link of links) {
                const normalizedLink = link.split('#')[0];
                if (!visited.has(normalizedLink) && !queue.includes(normalizedLink)) {
                    queue.push(normalizedLink);
                }
            }

            results.push({
                url,
                loadTime,
                issues
            });

        } catch (error) {
            console.error(`Failed to crawl ${url}:`, error.message);
            results.push({
                url,
                error: error.message,
                issues: [{
                    type: 'Page Load Error',
                    description: error.message,
                    severity: SEVERITY.CRITICAL
                }]
            });
        } finally {
            await page.close();
        }
    }

    await browser.close();
    return results;
}

module.exports = { crawl };
