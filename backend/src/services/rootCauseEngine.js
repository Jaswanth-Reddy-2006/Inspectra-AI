/**
 * ROOT CAUSE INTELLIGENCE ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects recurring architectural defects across the application.
 * Calculates confidence (0.0 - 1.0) and projected score recovery.
 */

function calculateConfidence(cluster) {
    let score = 0.4; // Base confidence for ruleId match

    // Structural Similarity Bonus
    if (cluster.isStructuralMatch) score += 0.3;

    // Selector Recurrence Bonus
    if (cluster.selectors.size === 1) score += 0.2;

    // Parent Chain Similarity (Simulated for Demo)
    if (cluster.sharedParent) score += 0.1;

    return Math.min(1.0, score);
}

function analyzeRootCauses(pages) {
    const clusters = {}; // ruleId -> data

    pages.forEach(page => {
        (page.issues || []).forEach(issue => {
            if (!issue.ruleId) return;

            if (!clusters[issue.ruleId]) {
                clusters[issue.ruleId] = {
                    ruleId: issue.ruleId,
                    frequency: 0,
                    affectedPages: new Set(),
                    selectors: new Set(),
                    totalPenalty: 0,
                    isStructuralMatch: (issue.element?.className?.length > 0),
                    sharedParent: (issue.element?.selector?.includes(' > '))
                };
            }

            const cluster = clusters[issue.ruleId];
            cluster.frequency++;
            cluster.affectedPages.add(page.url);
            if (issue.element?.selector) cluster.selectors.add(issue.element.selector);

            // Heuristic penalty tracking
            cluster.totalPenalty += 10; // Avg penalty estimate
        });
    });

    const results = Object.values(clusters)
        .filter(c => c.affectedPages.size >= 1)
        .map(c => ({
            id: c.ruleId,
            ruleId: c.ruleId,
            frequency: c.frequency,
            affectedPages: Array.from(c.affectedPages),
            confidenceScore: calculateConfidence(c),
            projectedScoreRecovery: Math.round(c.totalPenalty / pages.length),
            suspectedSharedComponent: c.selectors.size === 1 ? 'Global Layout Component' : 'Shared UI Pattern'
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3); // Limit to top 3

    return results;
}

module.exports = { analyzeRootCauses };
