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
    if (pages.length === 0) return 100;

    const totalScore = pages.reduce((acc, page) => acc + page.score, 0);
    return Math.round(totalScore / pages.length);
}

function summarizeIssues(pages) {
    const summary = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };

    pages.forEach(page => {
        page.issues.forEach(issue => {
            const severity = issue.severity.toLowerCase();
            if (summary.hasOwnProperty(severity)) {
                summary[severity]++;
            }
        });
    });

    return summary;
}

module.exports = {
    calculatePageScore,
    calculateOverallScore,
    summarizeIssues
};
