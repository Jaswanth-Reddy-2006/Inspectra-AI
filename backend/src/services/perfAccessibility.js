/**
 * Performance & Accessibility Analyzer — Inspectra AI
 * ──────────────────────────────────────────────────────
 * Measures:
 *   - LCP, CLS, TTI (approximated), FID/TBT via CDP + PerformanceObserver injection
 *   - Accessibility via axe-core (violations by impact)
 *   - Best Practices: meta tags, console errors, HTTPS, caching, image optimisation
 *
 * Weighted Score (0-100):
 *   Performance  = 40% weight
 *   Accessibility= 40% weight
 *   Best Practice= 20% weight
 */

const { chromium } = require('playwright');
const axe = require('axe-core');
const fs = require('fs');
const path = require('path');

// ── Score thresholds ─────────────────────────────────────────────────────────

const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },   // ms
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },  // ms (proxy: TBT)
    TTI: { good: 3800, poor: 7300 },  // ms
};

function metricScore(val, { good, poor }) {
    if (val <= good) return 100;
    if (val >= poor) return 0;
    return Math.round(100 - ((val - good) / (poor - good)) * 100);
}

// ── Accessibility scoring ─────────────────────────────────────────────────────

const AXE_WEIGHTS = { critical: 30, serious: 15, moderate: 7, minor: 3 };

function axeScore(violations) {
    let penalty = 0;
    for (const v of violations) {
        penalty += (AXE_WEIGHTS[v.impact] || 5) * v.nodes.length;
    }
    return Math.max(0, Math.round(100 - Math.min(penalty, 100)));
}

// ── Best Practices scoring ────────────────────────────────────────────────────

function bestPracticesScore({ hasMetaDesc, hasViewport, isHTTPS, consoleErrors, imgWithoutAlt,
    imagesTotal, hasCharset, hasFavicon, hasLangAttr }) {
    let score = 100;
    if (!hasMetaDesc) score -= 10;
    if (!hasViewport) score -= 15;
    if (!isHTTPS) score -= 20;
    if (!hasCharset) score -= 5;
    if (!hasFavicon) score -= 5;
    if (!hasLangAttr) score -= 5;
    score -= Math.min(30, consoleErrors * 5);
    const altPenalty = imagesTotal > 0 ? Math.round((imgWithoutAlt / imagesTotal) * 20) : 0;
    score -= altPenalty;
    return Math.max(0, score);
}

// ── Slowest elements helper ───────────────────────────────────────────────────

function parseSlowResources(resourceTimings, threshold = 500) {
    return resourceTimings
        .filter(r => r.duration > threshold)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map(r => ({
            url: r.name,
            type: detectResourceType(r.name),
            duration: Math.round(r.duration),
            size: r.transferSize || 0,
        }));
}

function detectResourceType(url) {
    if (/\.(js)(\?|$)/i.test(url)) return 'Script';
    if (/\.(css)(\?|$)/i.test(url)) return 'Style';
    if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url)) return 'Image';
    if (/\.(woff2?|ttf|eot)(\?|$)/i.test(url)) return 'Font';
    if (/\/api\/|graphql/i.test(url)) return 'API';
    return 'Other';
}

// ── Main Analyzer ─────────────────────────────────────────────────────────────

async function analyzePerformanceAndAccessibility(url, onProgress) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: false });
    const page = await context.newPage();

    // Capture console errors
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');

    if (onProgress) onProgress({ phase: 'navigating', pct: 10 });

    try {
        const navStart = Date.now();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);

        if (onProgress) onProgress({ phase: 'measuring', pct: 35 });

        // ── Web Vitals injection via PerformanceObserver ─────────────────────
        const vitals = await page.evaluate(() => {
            return new Promise((resolve) => {
                const result = { lcp: null, cls: 0, fid: null, tti: null };

                try {
                    // LCP
                    const lcpObs = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        if (entries.length) result.lcp = entries[entries.length - 1].startTime;
                    });
                    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

                    // CLS
                    let clsValue = 0;
                    const clsObs = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) clsValue += entry.value;
                        }
                        result.cls = clsValue;
                    });
                    clsObs.observe({ type: 'layout-shift', buffered: true });

                    // FID proxy (first input delay approximated by long tasks)
                    let tbt = 0;
                    try {
                        const ltObs = new PerformanceObserver((list) => {
                            for (const entry of list.getEntries()) {
                                tbt += Math.max(0, entry.duration - 50);
                            }
                            result.fid = tbt;
                        });
                        ltObs.observe({ type: 'longtask', buffered: true });
                    } catch { }
                } catch { }

                // TTI approximation from domInteractive
                const navEntry = performance.getEntriesByType('navigation')[0];
                if (navEntry) result.tti = navEntry.domInteractive;

                setTimeout(() => {
                    // Final CLS from observer
                    const shifts = performance.getEntriesByType('layout-shift');
                    result.cls = shifts.reduce((s, e) => s + (e.hadRecentInput ? 0 : e.value), 0);
                    if (!result.lcp) {
                        const lcp = performance.getEntriesByType('largest-contentful-paint');
                        result.lcp = lcp.length ? lcp[lcp.length - 1].startTime : navEntry?.loadEventEnd || 0;
                    }
                    resolve(result);
                }, 800);
            });
        });

        // ── Resource timings ──────────────────────────────────────────────────
        const resourceTimings = await page.evaluate(() =>
            performance.getEntriesByType('resource').map(r => ({
                name: r.name,
                duration: r.duration,
                transferSize: r.transferSize || 0,
            }))
        );

        if (onProgress) onProgress({ phase: 'accessibility', pct: 55 });

        // ── Axe accessibility scan ────────────────────────────────────────────
        await page.addScriptTag({ content: axe.source });
        const axeResult = await page.evaluate(async () => {
            return await window.axe.run(document, {
                runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
            });
        });

        if (onProgress) onProgress({ phase: 'best_practices', pct: 75 });

        // ── Best Practices signals ────────────────────────────────────────────
        const bpSignals = await page.evaluate(() => {
            const imgs = document.querySelectorAll('img');
            const noAlt = [...imgs].filter(img => !img.getAttribute('alt')).length;
            return {
                hasMetaDesc: !!document.querySelector('meta[name=description]'),
                hasViewport: !!document.querySelector('meta[name=viewport]'),
                hasCharset: !!document.querySelector('meta[charset]'),
                hasFavicon: !!document.querySelector('link[rel~=icon]'),
                hasLangAttr: !!document.documentElement.getAttribute('lang'),
                imagesTotal: imgs.length,
                imgWithoutAlt: noAlt,
            };
        });

        if (onProgress) onProgress({ phase: 'scoring', pct: 88 });

        // ── Layout shift details ──────────────────────────────────────────────
        const clsDetails = await page.evaluate(() => {
            return performance.getEntriesByType('layout-shift')
                .filter(e => !e.hadRecentInput && e.value > 0.01)
                .slice(0, 10)
                .map(e => ({
                    value: parseFloat(e.value.toFixed(4)),
                    time: parseFloat(e.startTime.toFixed(0)),
                    sources: e.sources?.slice(0, 2).map(s => s.node?.tagName?.toLowerCase() || 'unknown') || [],
                }));
        });

        // ── Missing label details from axe ────────────────────────────────────
        const missingLabels = axeResult.violations
            .filter(v => ['label', 'label-content-name-mismatch', 'input-button-name'].includes(v.id))
            .flatMap(v => v.nodes.slice(0, 5).map(n => ({
                rule: v.id,
                impact: v.impact,
                element: n.html?.slice(0, 80) || '',
                message: v.description,
            })));

        // ── Contrast failures from axe ─────────────────────────────────────
        const contrastFails = axeResult.violations
            .filter(v => v.id.includes('color-contrast'))
            .flatMap(v => v.nodes.slice(0, 5).map(n => ({
                element: n.html?.slice(0, 80) || '',
                message: n.failureSummary?.replace('Fix any of the following:', '').trim() || v.description,
                impact: v.impact,
            })));

        // ── Aria violations ────────────────────────────────────────────────
        const ariaViolations = axeResult.violations
            .filter(v => v.id.includes('aria'))
            .slice(0, 8)
            .map(v => ({
                rule: v.id,
                impact: v.impact,
                count: v.nodes.length,
                message: v.description,
            }));

        // ── Tab order analysis ─────────────────────────────────────────────
        const tabViolations = axeResult.violations
            .filter(v => ['tabindex', 'focus-trap', 'scrollable-region-focusable'].includes(v.id))
            .map(v => ({ rule: v.id, impact: v.impact, count: v.nodes.length, message: v.description }));

        // ── Screenshot ─────────────────────────────────────────────────────
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 55, clip: { x: 0, y: 0, width: 1280, height: 720 } });

        // ── Compute scores ─────────────────────────────────────────────────
        const lcp = vitals.lcp || 0;
        const cls = parseFloat((vitals.cls || 0).toFixed(4));
        const fid = vitals.fid || 0;
        const tti = vitals.tti || 0;

        const lcpScore = metricScore(lcp, THRESHOLDS.LCP);
        const clsScore = metricScore(cls, THRESHOLDS.CLS);
        const fidScore = metricScore(fid, THRESHOLDS.FID);
        const ttiScore = metricScore(tti, THRESHOLDS.TTI);
        const perfScore = Math.round(0.35 * lcpScore + 0.30 * clsScore + 0.20 * ttiScore + 0.15 * fidScore);

        const bpSignalsAll = { ...bpSignals, isHTTPS: url.startsWith('https://'), consoleErrors: consoleErrors.length };
        const bpScore = bestPracticesScore(bpSignalsAll);
        const a11yScore = axeScore(axeResult.violations);

        const overallScore = Math.round(0.40 * perfScore + 0.40 * a11yScore + 0.20 * bpScore);

        const slowResources = parseSlowResources(resourceTimings);

        if (onProgress) onProgress({ phase: 'done', pct: 100 });

        return {
            url,
            title: await page.title(),
            screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`,

            // Scores
            scores: { overall: overallScore, performance: perfScore, accessibility: a11yScore, bestPractices: bpScore },

            // Web Vitals
            vitals: {
                lcp: { value: Math.round(lcp), score: lcpScore, label: lcp < THRESHOLDS.LCP.good ? 'Good' : lcp < THRESHOLDS.LCP.poor ? 'Needs work' : 'Poor' },
                cls: { value: cls, score: clsScore, label: cls < THRESHOLDS.CLS.good ? 'Good' : cls < THRESHOLDS.CLS.poor ? 'Needs work' : 'Poor' },
                fid: { value: Math.round(fid), score: fidScore, label: fid < THRESHOLDS.FID.good ? 'Good' : fid < THRESHOLDS.FID.poor ? 'Needs work' : 'Poor' },
                tti: { value: Math.round(tti), score: ttiScore, label: tti < THRESHOLDS.TTI.good ? 'Good' : tti < THRESHOLDS.TTI.poor ? 'Needs work' : 'Poor' },
            },

            // Issues
            slowResources,
            clsDetails,
            missingLabels,
            contrastFails,
            ariaViolations,
            tabViolations,
            consoleErrors: consoleErrors.slice(0, 10),

            // Axe summary
            axeSummary: {
                violations: axeResult.violations.length,
                passes: axeResult.passes.length,
                incomplete: axeResult.incomplete.length,
                byImpact: {
                    critical: axeResult.violations.filter(v => v.impact === 'critical').length,
                    serious: axeResult.violations.filter(v => v.impact === 'serious').length,
                    moderate: axeResult.violations.filter(v => v.impact === 'moderate').length,
                    minor: axeResult.violations.filter(v => v.impact === 'minor').length,
                },
                allViolations: axeResult.violations.slice(0, 30).map(v => ({
                    id: v.id,
                    impact: v.impact,
                    count: v.nodes.length,
                    description: v.description,
                    helpUrl: v.helpUrl,
                })),
            },

            // Best Practices signals
            bestPracticesSignals: bpSignalsAll,
            analyzedAt: new Date().toISOString(),
        };
    } finally {
        await browser.close();
    }
}

module.exports = { analyzePerformanceAndAccessibility };
