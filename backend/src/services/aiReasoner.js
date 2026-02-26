/**
 * AI Reasoning Layer (Deterministic)
 * Synthesizes architectural signals into high-fidelity assessments.
 */

function generateAIReasoning(intelligence, readinessReport) {
    const { overallScore, riskLevel, readiness, regressionProb } = readinessReport;

    // 1. Executive Summary Synthesis
    let summary = '';
    if (readiness === 'READY') {
        summary = `The application demonstrates enterprise-grade maturity with an overall score of ${overallScore}. Key architectural safeguards are in place, including robust security headers and performance stability.`;
    } else if (readiness === 'CRITICAL FAILURE') {
        summary = `Critical architectural failures detected. The platform is currently unfit for production deployment due to a score of ${overallScore} and severe security/reliability regressions.`;
    } else {
        summary = `The system is in a Growth phase but requires structural refinement. While the core logic is functional, there are significant gaps in ${Object.entries(intelligence).sort((a, b) => a[1].score - b[1].score)[0][0]} profiling.`;
    }

    // 2. Root Cause Classification
    const rootCauses = [];
    if (intelligence.security.score < 80) rootCauses.push({ type: 'Security Misconfiguration', detail: 'Missing or weak CORS/CSP/HSTS headers.' });
    if (intelligence.codeQuality.score < 80) rootCauses.push({ type: 'Architecture Weakness', detail: 'High DOM complexity suggesting potential SPA hydration issues.' });
    if (intelligence.reliability.score < 80) rootCauses.push({ type: 'Configuration Flaw', detail: 'Inconsistent 404 handling and concurrency failures.' });

    // 3. Top 5 Remediation Priorities
    const allSignals = Object.values(intelligence).flatMap(d => d.signals);
    const priorities = allSignals
        .filter(s => s.severity === 'CRITICAL' || s.severity === 'HIGH')
        .slice(0, 5)
        .map((s, i) => ({
            id: i + 1,
            title: s.msg,
            impact: s.impact,
            priority: s.severity === 'CRITICAL' ? 'URGENT' : 'HIGH'
        }));

    // 4. Engineering Strategy
    let strategy = '';
    if (overallScore < 60) {
        strategy = 'Immediate halt of feature development. Focus on infrastructure stabilization and security hardening.';
    } else if (overallScore < 85) {
        strategy = 'Balance tech debt reduction with upcoming features. Implement automated security gating in CI/CD.';
    } else {
        strategy = 'Maintain current excellence. Optimize for marginal performance gains and deep observability.';
    }

    return {
        executiveSummary: summary,
        rootCauseClassification: rootCauses,
        remediationPriorities: priorities,
        longTermStrategy: strategy,
        businessImpact: riskLevel === 'CRITICAL' ? 'High probability of data breach or massive user churn due to service instability.' : 'Moderate impact on user conversion and brand trust.',
        regressionRisk: `${regressionProb}%`,
        benchmark: overallScore > 90 ? 'Enterprise Grade' : overallScore > 70 ? 'Growth Stage' : 'Startup Level'
    };
}

module.exports = { generateAIReasoning };
