const { PENALTIES } = require('../utils/severity');

/**
 * Calculate individual page score based on issues using the new transparent formula.
 */
function calculatePageScore(issues, perf = {}) {
    const breakdown = {
        criticalPenalty: 0,
        highPenalty: 0,
        mediumPenalty: 0,
        lowPenalty: 0,
        performancePenalty: 0,
        hygienePenalty: 0
    };

    let totalPenalty = 0;

    issues.forEach(issue => {
        const severity = (issue.severity || 'Low').toUpperCase();
        const penalty = PENALTIES[issue.severity] || 0;

        if (issue.type === 'Structural Hygiene') {
            breakdown.hygienePenalty += 2;
            totalPenalty += 2;
        } else if (severity === 'CRITICAL') {
            breakdown.criticalPenalty += penalty;
            totalPenalty += penalty;
        } else if (severity === 'HIGH') {
            breakdown.highPenalty += penalty;
            totalPenalty += penalty;
        } else if (severity === 'MEDIUM') {
            breakdown.mediumPenalty += penalty;
            totalPenalty += penalty;
        } else {
            breakdown.lowPenalty += penalty;
            totalPenalty += penalty;
        }
    });

    // Performance penalties (FCP, LCP)
    if (perf.fcp > 2000) {
        breakdown.performancePenalty += 10;
        totalPenalty += 10;
    }
    if (perf.lcp > 2500) {
        breakdown.performancePenalty += 15;
        totalPenalty += 15;
    }

    return {
        score: Math.max(0, 100 - totalPenalty),
        breakdown
    };
}

/**
 * Calculate overall application score
 */
function calculateOverallScore(pages) {
    if (!pages || pages.length === 0) return 100;

    const validScores = pages.map(p => typeof p.score === 'object' ? p.score.score : p.score).filter(s => typeof s === 'number');
    if (validScores.length === 0) return 0;

    const totalScore = validScores.reduce((acc, s) => acc + s, 0);
    return Math.round(totalScore / validScores.length);
}

/**
 * Calculate Hygiene Score (0-100)
 */
function calculateHygieneScore(pages) {
    if (!pages || pages.length === 0) return 100;

    let totalHygieneIssues = 0;
    pages.forEach(page => {
        totalHygieneIssues += (page.issues || []).filter(i => i.type === 'Structural Hygiene').length;
    });

    const penalty = (totalHygieneIssues / (pages.length || 1)) * 15;
    return Math.max(0, Math.round(100 - penalty));
}

/**
 * Generate comprehensive Executive Intelligence Report
 */
function summarizeIssues(pages) {
    const summary = {
        stats: {
            totalPages: pages.length,
            totalDefects: 0,
            critical: 0, high: 0, medium: 0, low: 0,
            avgLoadTime: 0
        },
        executiveIntelligence: {
            topRiskComponent: null,
            primaryRiskDomain: '',
            runtimeStability: 'Stable',
            performanceHealth: '',
            strategicRecommendation: ''
        },
        rootCauseAnalysis: [],
        scoreImpact: {
            base: 100,
            criticalPenalty: 0,
            highPenalty: 0,
            mediumPenalty: 0,
            performancePenalty: 0,
            hygienePenalty: 0,
            finalScore: 0
        },
        fixSimulation: {
            fixCritical: 0,
            fixCriticalAndHigh: 0,
            fixAll: 95
        },
        runtimeLogs: [],
        hygieneReport: [],
        knowledgeGraph: { nodes: [], links: [] }
    };

    if (!pages || pages.length === 0) return summary;

    const ruleCluster = {}; // ruleId -> { count, pages: Set, selectors: Set }
    const nodesMap = new Map();
    const links = [];

    let totalPenaltyWeight = 0;
    const categoryWeights = {};

    pages.forEach(page => {
        const res = calculatePageScore(page.issues || [], page.perf || {});
        page.score = res.score;
        page.scoreBreakdown = res.breakdown;

        // Aggregate Global Penalties for Score Impact Card
        summary.scoreImpact.criticalPenalty += res.breakdown.criticalPenalty;
        summary.scoreImpact.highPenalty += res.breakdown.highPenalty;
        summary.scoreImpact.mediumPenalty += res.breakdown.mediumPenalty;
        summary.scoreImpact.performancePenalty += res.breakdown.performancePenalty;
        summary.scoreImpact.hygienePenalty += res.breakdown.hygienePenalty;

        if (!nodesMap.has(page.url)) {
            nodesMap.set(page.url, {
                id: page.url,
                type: 'page',
                score: page.score,
                criticalCount: (page.issues || []).filter(i => i.severity === 'Critical').length
            });
        }

        (page.issues || []).forEach(issue => {
            summary.stats.totalDefects++;
            const sev = (issue.severity || 'Low').toLowerCase();
            if (summary.stats.hasOwnProperty(sev)) summary.stats[sev]++;

            // Build Runtime Logs
            if (issue.type && issue.type.includes('NETWORK') || issue.type === 'JS_EXCEPTION') {
                summary.runtimeLogs.push(issue);
                summary.executiveIntelligence.runtimeStability = 'Unstable (Exceptions Detected)';
            }

            // Build Hygiene Report
            if (issue.type === 'Structural Hygiene') {
                summary.hygieneReport.push(issue);
            }

            // Category Indexing
            const category = issue.type || 'General';
            categoryWeights[category] = (categoryWeights[category] || 0) + (PENALTIES[issue.severity] || 2);

            // Root Cause Grouping
            if (issue.ruleId) {
                if (!ruleCluster[issue.ruleId]) {
                    ruleCluster[issue.ruleId] = { count: 0, pages: new Set(), selectors: new Set(), ruleId: issue.ruleId };
                }
                ruleCluster[issue.ruleId].count++;
                ruleCluster[issue.ruleId].pages.add(page.url);
                if (issue.element?.selector) ruleCluster[issue.ruleId].selectors.add(issue.element.selector);
            }

            // Knowledge Graph Edge
            if (!nodesMap.has(category)) nodesMap.set(category, { id: category, type: 'category' });
            if (!links.some(l => l.source === page.url && l.target === category)) {
                links.push({ source: page.url, target: category, value: 1 });
            }
        });
    });

    // ── Root Cause Detection ───────────────────────────────────────────────
    Object.values(ruleCluster).forEach(cluster => {
        if (cluster.pages.size >= 2) {
            summary.rootCauseAnalysis.push({
                ruleId: cluster.ruleId,
                affectedPages: Array.from(cluster.pages),
                frequency: cluster.count,
                suspectedSharedComponent: cluster.selectors.size === 1 ? 'Global Layout Component' : 'Shared UI Pattern'
            });
        }
    });

    // ── Executive Intelligence Report ──────────────────────────────────────
    const topRootCause = summary.rootCauseAnalysis.sort((a, b) => b.frequency - a.frequency)[0];
    if (topRootCause) {
        summary.executiveIntelligence.topRiskComponent = `${topRootCause.ruleId} pattern responsible for ${topRootCause.frequency} violations across site.`;
    }

    const topDomain = Object.entries(categoryWeights).sort((a, b) => b[1] - a[1])[0];
    if (topDomain) {
        summary.executiveIntelligence.primaryRiskDomain = `${topDomain[0]} (${Math.round((topDomain[1] / Object.values(categoryWeights).reduce((a, b) => a + b, 0)) * 100)}% of total debt).`;
    }

    const avgFCP = pages.reduce((acc, p) => acc + (p.perf?.fcp || 0), 0) / pages.length;
    summary.executiveIntelligence.performanceHealth = `Avg FCP: ${Math.round(avgFCP)}ms.`;
    summary.executiveIntelligence.strategicRecommendation = `Prioritize remediation of ${topDomain?.[0] || 'critical accessibility'} issues to restore score.`;

    // ── Score Impact & Simulation ──────────────────────────────────────────
    const totalPossiblePoints = 100;
    const currentGlobalPenalty = summary.scoreImpact.criticalPenalty + summary.scoreImpact.highPenalty + summary.scoreImpact.mediumPenalty + summary.scoreImpact.performancePenalty + summary.scoreImpact.hygienePenalty;
    summary.scoreImpact.finalScore = Math.max(0, 100 - Math.round(currentGlobalPenalty / (pages.length || 1)));

    summary.fixSimulation.fixCritical = Math.min(95, summary.scoreImpact.finalScore + Math.round(summary.scoreImpact.criticalPenalty / pages.length));
    summary.fixSimulation.fixCriticalAndHigh = Math.min(95, summary.fixSimulation.fixCritical + Math.round(summary.scoreImpact.highPenalty / pages.length));

    summary.knowledgeGraph.nodes = Array.from(nodesMap.values());
    summary.knowledgeGraph.links = links;

    return summary;
}

module.exports = {
    calculatePageScore,
    calculateOverallScore,
    calculateHygieneScore,
    summarizeIssues
};
