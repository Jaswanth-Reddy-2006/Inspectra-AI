const { PENALTIES } = require('../utils/severity');

function calculatePageScore(issues) {
    let penaltyTotal = 0;

    issues.forEach(issue => {
        penaltyTotal += PENALTIES[issue.severity] || 0;
    });

    const score = 100 - penaltyTotal;
    return Math.max(0, score);
}

function calculateOverallScore(pages) {
    if (!pages || pages.length === 0) return 100;

    const validPages = pages.filter(p => typeof p.score === 'number' && !isNaN(p.score));
    if (validPages.length === 0) return 0;

    const totalScore = validPages.reduce((acc, page) => acc + page.score, 0);
    return Math.round(totalScore / validPages.length);
}

function summarizeIssues(pages) {
    const summary = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        topRiskAreas: [],
        riskClusters: {}
    };

    if (!pages) return summary;

    const ruleCounts = {};

    pages.forEach(page => {
        if (!page.issues) return;
        page.issues.forEach(issue => {
            // Count Severities
            if (issue.severity) {
                const sev = issue.severity.toLowerCase();
                if (summary.hasOwnProperty(sev)) {
                    summary[sev]++;
                }
            }

            // Count Rules for Top Risk Areas
            if (issue.ruleId) {
                ruleCounts[issue.ruleId] = (ruleCounts[issue.ruleId] || 0) + 1;
            }
        });
    });

    // Extract Top 3 Risk Areas
    summary.topRiskAreas = Object.entries(ruleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([ruleId, count]) => ({ ruleId, count }));

    return summary;
}

module.exports = {
    calculatePageScore,
    calculateOverallScore,
    summarizeIssues
};
