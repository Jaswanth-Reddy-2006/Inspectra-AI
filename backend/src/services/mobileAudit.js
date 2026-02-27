const { chromium } = require('playwright');
const { launchBrowser } = require('../utils/browser');
const { calculateOverallScore } = require('./scorer');

/**
 * Mobile Audit Engine using Playwright (since the project uses Playwright in scan.js, not Puppeteer).
 * This engine connects to a live page and runs engineering-grade mobile analytics.
 */

const VIEWPORTS = {
    ios: { width: 390, height: 844, name: 'iOS Safari' },
    android: { width: 412, height: 915, name: 'Android Chrome' },
    tablet: { width: 768, height: 1024, name: 'Tablet Breakpoint' }
};

async function runMobileAudit(url, parentBrowser = null) {
    let browser = parentBrowser;
    let keepBrowserAlive = true;

    if (!browser) {
        keepBrowserAlive = false;
        browser = await launchBrowser();
    }

    const report = {
        environments: {},
        overallScore: 0,
        riskLevel: 'Low'
    };

    let totalScoreAccumulator = 0;

    for (const [device, config] of Object.entries(VIEWPORTS)) {
        const context = await browser.newContext({
            viewport: { width: config.width, height: config.height },
            userAgent: device === 'ios'
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                : 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
            isMobile: true,
            hasTouch: true
        });

        const page = await context.newPage();
        const envReport = {
            name: config.name,
            size: `${config.width}x${config.height}`,
            status: 'Optimal',
            score: 100,
            issues: []
        };

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // 1. Viewport Meta Validation
            const hasViewportMeta = await page.evaluate(() => {
                const meta = document.querySelector('meta[name="viewport"]');
                return meta && meta.content.includes('width=device-width');
            });

            if (!hasViewportMeta) {
                envReport.issues.push({
                    type: 'Viewport Config',
                    message: `Missing or misconfigured <meta name="viewport"> tag.`,
                    severity: 'Critical'
                });
                envReport.score -= 20; // 20% weight penalty
            }

            // 2. Responsive Layout Analysis (Horizontal Overflow)
            const layoutData = await page.evaluate(() => {
                const scrollWidth = document.documentElement.scrollWidth;
                const innerWidth = window.innerWidth;
                const bodyWidth = document.body.scrollWidth;

                const hasOverflow = scrollWidth > innerWidth || bodyWidth > innerWidth;
                const overflowingNodes = [];

                if (hasOverflow) {
                    // Primitive check for culprits
                    document.querySelectorAll('*').forEach(el => {
                        if (el.scrollWidth > innerWidth) {
                            overflowingNodes.push({
                                tag: el.tagName.toLowerCase(),
                                classes: el.className,
                                scrollWidth: el.scrollWidth
                            });
                        }
                    });
                }

                return {
                    hasOverflow,
                    scrollWidth,
                    innerWidth,
                    culprits: overflowingNodes.slice(0, 3) // Top 3 offenders
                };
            });

            if (layoutData.hasOverflow) {
                envReport.issues.push({
                    type: 'Layout Overflow',
                    message: `Horizontal overflow detected (Scroll Width: ${layoutData.scrollWidth}px vs Viewport: ${layoutData.innerWidth}px).`,
                    details: layoutData.culprits,
                    severity: 'High'
                });
                envReport.score -= 25; // 25% weight penalty
            }

            // 3. Touch Target Analysis (WCAG 44x44 minimum)
            const touchTargets = await page.evaluate(() => {
                const interactables = Array.from(document.querySelectorAll('button, a, input, select, [role="button"]'));
                let violations = 0;
                const smallTargets = [];

                interactables.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    // Ignore invisible elements
                    if (rect.width === 0 || rect.height === 0) return;

                    if (rect.width < 44 || rect.height < 44) {
                        violations++;
                        if (smallTargets.length < 5) {
                            smallTargets.push({
                                tag: el.tagName.toLowerCase(),
                                text: el.textContent?.trim().substring(0, 20) || 'no-text',
                                size: `${Math.round(rect.width)}x${Math.round(rect.height)}`
                            });
                        }
                    }
                });

                return {
                    total: interactables.length,
                    violations,
                    sample: smallTargets
                };
            });

            if (touchTargets.violations > 0) {
                const failureRate = touchTargets.violations / (touchTargets.total || 1);
                envReport.issues.push({
                    type: 'Touch Target Density',
                    message: `${touchTargets.violations} interactive elements fail WCAG 44x44px minimum sizing.`,
                    details: touchTargets.sample,
                    severity: failureRate > 0.2 ? 'High' : 'Medium'
                });

                const penalty = Math.min(30, Math.round(failureRate * 30 * 2)); // Up to 30% penalty
                envReport.score -= penalty;
            }

            // 4. Performance Proxy (Assuming network latency isn't perfectly throttled here, we rely on baseline load metrics)
            const pPerf = await page.evaluate(() => {
                const nav = performance.getEntriesByType('navigation')[0];
                return nav ? nav.domContentLoadedEventEnd : 0;
            });

            if (pPerf > 3000) {
                envReport.issues.push({
                    type: 'Mobile Performance',
                    message: `Mobile thread blocked. Main content took ${Math.round(pPerf)}ms to interactive.`,
                    severity: 'Medium'
                });
                envReport.score -= 15; // 15% out of 25 perf weight
            }

            // Determine Environment Status
            if (envReport.score >= 90) envReport.status = 'Optimal';
            else if (envReport.score >= 70) envReport.status = 'Warning';
            else envReport.status = 'Critical';

        } catch (error) {
            envReport.status = 'Critical';
            envReport.score = 0;
            envReport.issues.push({
                type: 'Execution Failure',
                message: `Failed to analyze viewport: ${error.message}`,
                severity: 'Critical'
            });
        } finally {
            await page.close();
            await context.close();
        }

        report.environments[device] = envReport;
        totalScoreAccumulator += envReport.score;
    }

    if (!keepBrowserAlive) {
        await browser.close();
    }

    // Calculate Overall Mobile Score
    report.overallScore = Math.max(0, Math.round(totalScoreAccumulator / 3));

    // Determine Overall Risk
    if (report.overallScore >= 90) report.riskLevel = 'Low Risk';
    else if (report.overallScore >= 70) report.riskLevel = 'Moderate Risk';
    else report.riskLevel = 'High Risk';

    return report;
}

module.exports = { runMobileAudit };
