/**
 * Scoring & Risk Engine
 * Implements enterprise rules and critical failure overrides.
 */

function calculateProductionReadiness(intelligence) {
    let overallScore = Math.round(
        Object.values(intelligence).reduce((acc, dim) => acc + (dim.score || 0), 0) / 7
    );

    const overrides = [];

    // 1. Critical Failure: Privacy/Security (No HTTPS)
    const security = intelligence.security || { score: 100, signals: [] };
    const httpsSignal = (security.signals || []).find(s => s && s.msg && s.msg.includes('HTTPS'));
    if (httpsSignal) {
        if (overallScore > 40) {
            overallScore = 40;
            overrides.push('Overall score capped at 40 due to lack of HTTPS.');
        }
    }

    // 2. Critical Failure: Vulnerability (No CSP + High Risk)
    const noCSP = (security.signals || []).find(s => s && s.msg && s.msg.includes('Missing Content Security Policy'));
    const code = intelligence.codeQuality || { score: 100, signals: [] };
    if (noCSP && code.score < 70) {
        if (security.score > 50) {
            security.score = 50;
            overrides.push('Security score capped at 50 due to missing CSP and high code complexity.');
        }
    }

    // 3. Reliability Override: Concurrency Failures
    const reliability = intelligence.reliability || { score: 100, signals: [] };
    const stressFail = (reliability.signals || []).find(s => s && s.msg && s.msg.includes('stress test failure'));
    if (stressFail && overallScore > 60) {
        overallScore = 60;
        overrides.push('Readiness lowered to Growth stage due to reliability stress failures.');
    }

    // Determine Risk Level
    let riskLevel = 'LOW';
    if (overallScore < 50) riskLevel = 'CRITICAL';
    else if (overallScore < 75) riskLevel = 'HIGH';
    else if (overallScore < 90) riskLevel = 'MEDIUM';

    // Production Readiness Classification
    let readiness = 'NEEDS IMPROVEMENT';
    if (riskLevel === 'CRITICAL') readiness = 'CRITICAL FAILURE';
    else if (riskLevel === 'HIGH') readiness = 'HIGH RISK';
    else if (overallScore >= 90) readiness = 'READY';

    // Calculate Regression Probability (%)
    const regressionProb = Math.min(99, Math.round((100 - overallScore) * 1.2 + (riskLevel === 'CRITICAL' ? 30 : 0)));

    return {
        overallScore,
        riskLevel,
        readiness,
        overrides,
        regressionProb,
        scalabilityForecast: overallScore > 85 ? 'HIGH' : overallScore > 60 ? 'MEDIUM' : 'LOW',
        engineeringBalance: Math.round(overallScore * 0.95) // Aesthetic differentiator
    };
}

module.exports = { calculateProductionReadiness };
