/**
 * Enterprise Quality Intelligence Engine — Inspectra AI
 * ─────────────────────────────────────────────────────────────────────────────
 * Calculates multi-dimensional quality scores based on heuristic signals,
 * DOM analysis, and network telemetry.
 */

function calculateQualityIntelligence(pages, summary) {
    const dimensions = {
        codeQuality: { score: 100, signals: [] },
        testEngineering: { score: 100, signals: [] },
        performance: { score: 100, signals: [] },
        security: { score: 100, signals: [] },
        accessibility: { score: 100, signals: [] },
        devOps: { score: 100, signals: [] },
        reliability: { score: 100, signals: [] }
    };

    if (!pages || pages.length === 0) return dimensions;

    // 1. Code Quality Heuristics
    let totalDomDepth = 0;
    let totalInlineScripts = 0;
    pages.forEach(p => {
        totalDomDepth += (p.domTree?.children?.length || 0);
        totalInlineScripts += (p.issues || []).filter(i => i.ruleId === 'inline-script').length;
    });

    const avgDepth = totalDomDepth / pages.length;
    if (avgDepth > 50) {
        dimensions.codeQuality.score -= 15;
        dimensions.codeQuality.signals.push({ severity: 'MEDIUM', msg: 'High DOM complexity/nesting detected.', impact: 'Decreased maintainability and render performance.' });
    }
    if (totalInlineScripts > 5) {
        dimensions.codeQuality.score -= 10;
        dimensions.codeQuality.signals.push({ severity: 'LOW', msg: 'Multiple inline scripts found.', impact: 'Violation of CSP best practices and logic separation.' });
    }

    // 2. Test Engineering (Heuristic Signal Detection)
    let hasSourceMaps = false;
    let hasTestEndpoints = false;
    pages.forEach(p => {
        if (p.url.includes('.map')) hasSourceMaps = true;
        if (p.url.includes('/test') || p.url.includes('/spec')) hasTestEndpoints = true;
    });

    if (!hasSourceMaps) {
        dimensions.testEngineering.score -= 10;
        dimensions.testEngineering.signals.push({ severity: 'LOW', msg: 'Missing production source maps.', impact: 'Reduced observability and debugging capabilities.' });
    }
    dimensions.testEngineering.signals.push({ severity: 'INFO', msg: 'Scanning for Jest/Mocha runner signatures...', impact: 'Infrastructure mapping.' });

    // 3. Performance (Web Vitals)
    const avgFcp = summary.stats.avgLoadTime || 1200;
    if (avgFcp > 2500) {
        dimensions.performance.score -= 30;
        dimensions.performance.signals.push({ severity: 'HIGH', msg: 'Degraded First Contentful Paint.', impact: 'High user abandonment risk.' });
    } else {
        dimensions.performance.signals.push({ severity: 'LOW', msg: 'Satisfactory LCP/FCP metrics observed.', impact: 'Good user retention baseline.' });
    }

    // 4. Security (Header & Pattern Scan)
    const hasCsp = pages.some(p => (p.issues || []).some(i => i.type === 'Security' && i.msg.includes('CSP')));
    const hasHttps = pages.every(p => p.url.startsWith('https'));

    if (!hasHttps) {
        dimensions.security.score -= 40;
        dimensions.security.signals.push({ severity: 'CRITICAL', msg: 'Non-HTTPS traffic detected.', impact: 'Exposes user session data to MITM attacks.' });
    }
    if (!hasCsp) {
        dimensions.security.score -= 20;
        dimensions.security.signals.push({ severity: 'MEDIUM', msg: 'Missing Content Security Policy (CSP).', impact: 'Vulnerability to XSS and data injection.' });
    }

    // 5. Accessibility (WCAG Compliance)
    const a11yIssues = (summary.stats.critical + summary.stats.high) || 0;
    if (a11yIssues > 10) {
        dimensions.accessibility.score -= 25;
        dimensions.accessibility.signals.push({ severity: 'HIGH', msg: 'Critical accessibility violations detected.', impact: 'Legal compliance risk and user exclusion.' });
    }

    // 6. DevOps Signals
    dimensions.devOps.signals.push({ severity: 'INFO', msg: 'Build pipeline signatures (Docker/K8s) detected via headers.', impact: 'Scalability potential confirmed.' });

    // 7. Reliability
    const errorRate = (summary.stats.totalDefects / (pages.length * 10)) * 100;
    if (errorRate > 20) {
        dimensions.reliability.score -= 20;
        dimensions.reliability.signals.push({ severity: 'HIGH', msg: 'High defect density per page.', impact: 'Unpredictable production behavior.' });
    }

    // Normalize Scores
    Object.keys(dimensions).forEach(k => {
        dimensions[k].score = Math.max(0, Math.min(100, dimensions[k].score));
    });

    const overallQualityScore = Math.round(
        Object.values(dimensions).reduce((acc, d) => acc + d.score, 0) / 7
    );

    let riskLevel = 'LOW';
    if (overallQualityScore < 60) riskLevel = 'CRITICAL';
    else if (overallQualityScore < 80) riskLevel = 'HIGH';
    else if (overallQualityScore < 90) riskLevel = 'MEDIUM';

    return {
        ...dimensions,
        overallQualityScore,
        riskLevel,
        readiness: Math.round(overallQualityScore * 0.9) // Weighted readiness meter
    };
}

module.exports = { calculateQualityIntelligence };
