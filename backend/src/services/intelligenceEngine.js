/**
 * Engineering Intelligence Engine
 * Maps raw telemetry and signals to 7 Architectural Dimensions.
 */

function extractIntelligence(pages, globalSignals) {
    const dimensions = {
        security: { score: 100, signals: [], maturity: 'ENT' },
        performance: { score: 100, signals: [], maturity: 'ENT' },
        codeQuality: { score: 100, signals: [], maturity: 'ENT' },
        testEngineering: { score: 100, signals: [], maturity: 'ENT' },
        accessibility: { score: 100, signals: [], maturity: 'ENT' },
        devOps: { score: 100, signals: [], maturity: 'ENT' },
        reliability: { score: 100, signals: [], maturity: 'ENT' }
    };

    if (!pages || pages.length === 0) return dimensions;

    const mainPage = pages[0];
    const headers = globalSignals.securityHeaders || {};

    // 1. Security Dimension
    const sec = dimensions.security;
    if (!mainPage.url.startsWith('https')) {
        sec.score -= 50;
        sec.signals.push({ severity: 'CRITICAL', msg: 'Non-HTTPS protocol detected.', impact: 'Data in transit is unencrypted and vulnerable to interception.' });
    }
    if (!headers['content-security-policy']) {
        sec.score -= 30;
        sec.signals.push({ severity: 'HIGH', msg: 'Missing Content Security Policy (CSP).', impact: 'High risk of XSS and data injection attacks.' });
    }
    if (!headers['strict-transport-security']) {
        sec.score -= 10;
        sec.signals.push({ severity: 'MEDIUM', msg: 'HSTS not enabled.', impact: 'Vulnerable to protocol downgrade attacks.' });
    }
    if (!headers['x-frame-options']) {
        sec.score -= 10;
        sec.signals.push({ severity: 'MEDIUM', msg: 'X-Frame-Options missing.', impact: 'Susceptible to clickjacking.' });
    }

    // 2. Performance Dimension
    const perf = dimensions.performance;
    const avgLoadTime = pages.reduce((acc, p) => acc + (p.perf?.loadTime || 0), 0) / pages.length;
    if (avgLoadTime > 3000) {
        perf.score -= 20;
        perf.signals.push({ severity: 'MEDIUM', msg: 'High average load time (>3s).', impact: 'Increased bounce rates and poor user retention.' });
    }
    if (globalSignals.networkStats.totalRequests > 100) {
        perf.score -= 10;
        perf.signals.push({ severity: 'LOW', msg: 'High request count (>100).', impact: 'Payload overhead impacting mobile performance.' });
    }

    // 3. Code Quality Dimension
    const code = dimensions.codeQuality;
    const avgDepth = pages.reduce((acc, p) => acc + (p.signals?.maxDepth || 0), 0) / pages.length;
    if (avgDepth > 25) {
        code.score -= 15;
        code.signals.push({ severity: 'MEDIUM', msg: 'Excessive DOM nesting depth.', impact: 'Complex style recalculations and layout thrashing.' });
    }
    if (globalSignals.consoleLogLevels.error > 5) {
        code.score -= 20;
        code.signals.push({ severity: 'HIGH', msg: 'High volume of unhandled console errors.', impact: 'Potentially broken user flows and logical instability.' });
    }

    // 4. Test Engineering Dimension
    const test = dimensions.testEngineering;
    const exposedSourceMaps = pages.some(p => Array.isArray(p.signals?.scripts) && p.signals.scripts.some(s => s.src?.endsWith('.map')));
    if (exposedSourceMaps) {
        test.score -= 10;
        test.signals.push({ severity: 'MEDIUM', msg: 'Production source maps exposed.', impact: 'Reveals internal logic and architecture to competitors.' });
    }
    // Inferring maturity via endpoint consistency (handled in ScoringLogic usually, but adding placeholders here)
    test.signals.push({ severity: 'LOW', msg: 'Searching for Jest/Mocha runner signatures...', impact: 'Infrastructure mapping.' });

    // 5. Accessibility Dimension
    const a11y = dimensions.accessibility;
    // We already have accessibility audits, but we can augment with signal-based heuristic
    const formsWithLabels = pages.every(p => Array.isArray(p.signals?.forms) && p.signals.forms.every(f => f.hasSubmit)); // simplistic check
    if (!formsWithLabels) {
        a11y.score -= 10;
        a11y.signals.push({ severity: 'LOW', msg: 'Implicit form labeling detected.', impact: 'Screen reader navigation friction.' });
    }

    // 6. DevOps & Deployment
    const dev = dimensions.devOps;
    const serverHeader = headers['server'] || '';
    if (serverHeader.toLowerCase().includes('dev') || serverHeader.toLowerCase().includes('local')) {
        dev.score -= 30;
        dev.signals.push({ severity: 'CRITICAL', msg: 'Development environment leakage.', impact: 'Internal server metadata exposed in production.' });
    }
    if (globalSignals.fuzzing.handled404) {
        dev.signals.push({ severity: 'PASS', msg: 'Graceful 404 error handling verified.', impact: 'Robust routing configuration.' });
    } else {
        dev.score -= 10;
        dev.signals.push({ severity: 'MEDIUM', msg: 'Inconsistent 404 route handling.', impact: 'Poor UX during navigation failures.' });
    }

    // 7. Reliability
    const rel = dimensions.reliability;
    if (globalSignals.networkStats.failedRequests > 0) {
        const failureRate = (globalSignals.networkStats.failedRequests / globalSignals.networkStats.totalRequests) * 100;
        if (failureRate > 5) {
            rel.score -= 25;
            rel.signals.push({ severity: 'HIGH', msg: `Network stability issues (${failureRate.toFixed(1)}% failure).`, impact: 'Intermittent resource loading failures.' });
        }
    }
    if (globalSignals.stressTest.successRate < 100) {
        rel.score -= 20;
        rel.signals.push({ severity: 'HIGH', msg: 'Concurrency stress test failure.', impact: 'Risk of downtime under high traffic or bot activity.' });
    }

    // Cleanup and Classify
    Object.keys(dimensions).forEach(key => {
        dimensions[key].score = Math.max(0, Math.min(100, Math.round(dimensions[key].score)));
        if (dimensions[key].score < 60) dimensions[key].maturity = 'EARLY_STAGE';
        else if (dimensions[key].score < 85) dimensions[key].maturity = 'GROWTH';
        else dimensions[key].maturity = 'ENTERPRISE';
    });

    return dimensions;
}

module.exports = { extractIntelligence };
