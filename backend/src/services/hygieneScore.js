/**
 * Hygiene Score Card Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregates all stored analysis results and computes a single 0-100
 * Product Quality Score using the weighted formula:
 *
 *   Functional   40%
 *   Performance  20%
 *   Accessibility 15%
 *   Visual       15%
 *   Network      10%
 *
 * Each dimension outputs a 0-100 sub-score; missing data → 50 (neutral).
 */

const fs = require('fs');
const path = require('path');

const DATA = {
    functional: path.join(__dirname, '../../data/functional_results.json'),
    network: path.join(__dirname, '../../data/network_results.json'),
    dom: path.join(__dirname, '../../data/dom_results.json'),
    perf: path.join(__dirname, '../../data/perf_results.json'),
    visual: path.join(__dirname, '../../data/visual_results.json'),
};

const WEIGHTS = {
    functional: 0.40,
    performance: 0.20,
    accessibility: 0.15,
    visual: 0.15,
    network: 0.10,
};

function readJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }

// ── Dimension scorers ─────────────────────────────────────────────────────────

function scoreFunctional(data) {
    if (!data || !Array.isArray(data) || data.length === 0)
        return { score: null, detail: 'No functional test runs found', breakdown: [] };

    const latest = data[0];
    const results = latest.results || [];
    if (results.length === 0) return { score: 50, detail: 'Empty run', breakdown: [] };

    const breakdown = results.map(r => ({
        name: r.name,
        verdict: r.verdict,
        confidence: r.confidence,
        passSteps: r.passCount,
        totalSteps: r.totalSteps,
        score: r.verdict === 'pass' ? r.confidence : r.verdict === 'warn' ? 50 : Math.max(0, 100 - (r.failCount / r.totalSteps) * 100),
    }));

    const avg = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
    return { score: avg, detail: `${results.filter(r => r.verdict === 'pass').length}/${results.length} flows passing`, breakdown };
}

function scorePerformance(data) {
    if (!data || typeof data !== 'object') return { score: null, detail: 'No performance data', breakdown: [] };
    const entries = Object.values(data);
    if (entries.length === 0) return { score: null, detail: 'No performance data', breakdown: [] };

    const breakdown = entries.map(e => ({
        url: e.url,
        score: e.scores?.performance || 0,
        lcp: e.vitals?.lcp?.score,
        cls: e.vitals?.cls?.score,
    }));
    const avg = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
    return { score: avg, detail: `${entries.length} page(s) analysed`, breakdown };
}

function scoreAccessibility(data) {
    if (!data || typeof data !== 'object') return { score: null, detail: 'No accessibility data', breakdown: [] };
    const entries = Object.values(data);
    if (entries.length === 0) return { score: null, detail: 'No accessibility data', breakdown: [] };

    const breakdown = entries.map(e => ({
        url: e.url,
        score: e.scores?.accessibility || 0,
        violations: e.axeSummary?.violations || 0,
    }));
    const avg = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
    return { score: avg, detail: `Avg ${Math.round(breakdown.reduce((s, b) => s + b.violations, 0) / breakdown.length)} violations`, breakdown };
}

function scoreVisual(data) {
    if (!data || !Array.isArray(data) || data.length === 0)
        return { score: null, detail: 'No visual comparisons found', breakdown: [] };

    const breakdown = data.slice(0, 5).map(r => ({
        baseline: r.baselineUrl,
        current: r.currentUrl,
        ssim: r.ssimScore || 0,
        diffPct: r.diffPct || 0,
        verdict: r.overallVerdict,
        score: r.ssimScore || 0,
    }));
    const avg = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
    return { score: avg, detail: `${breakdown.length} visual comparison(s)`, breakdown };
}

function scoreNetwork(data) {
    if (!data || typeof data !== 'object') return { score: null, detail: 'No network data', breakdown: [] };
    const entries = Object.values(data);
    if (entries.length === 0) return { score: null, detail: 'No network data', breakdown: [] };

    const breakdown = entries.map(e => {
        const total = e.total || 1;
        const errored = e.errored || 0;
        const slow = e.slow || 0;
        const penalty = Math.min(100, (errored / total) * 60 + (slow / total) * 40) * 100;
        return { url: e.url, total, errored, slow, score: Math.max(0, Math.round(100 - penalty)) };
    });
    const avg = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length);
    return { score: avg, detail: `${entries.length} capture(s)`, breakdown };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function computeHygieneScore(targetUrl) {
    let funcData = readJSON(DATA.functional) || [];
    let perfData = readJSON(DATA.perf) || {};
    let netData = readJSON(DATA.network) || {};
    let visualData = readJSON(DATA.visual) || [];

    // Filter by targetUrl if provided
    if (targetUrl) {
        // Normalize URL (strip trailing slash for better comparison match)
        const norm = (u) => u.replace(/\/$/, '');
        const targetNorm = norm(targetUrl);

        // Functional: Find the most recent run for this URL
        const funcRuns = funcData
            .filter(r => norm(r.url) === targetNorm)
            .sort((a, b) => new Date(b.runAt) - new Date(a.runAt));
        funcData = funcRuns.length > 0 ? [funcRuns[0]] : [];

        // Performance & Accessibility: Direct lookup
        const perfMatch = Object.entries(perfData).find(([u]) => norm(u) === targetNorm);
        perfData = perfMatch ? { [perfMatch[0]]: perfMatch[1] } : {};

        // Network: Direct lookup
        const netMatch = Object.entries(netData).find(([u]) => norm(u) === targetNorm);
        netData = netMatch ? { [netMatch[0]]: netMatch[1] } : {};

        // Visual: Filter comparisons for this URL
        visualData = visualData.filter(r => norm(r.url) === targetNorm);
    }

    const dimensions = {
        functional: scoreFunctional(funcData),
        performance: scorePerformance(perfData),
        accessibility: scoreAccessibility(perfData),
        visual: scoreVisual(visualData),
        network: scoreNetwork(netData),
    };

    // Weighted composite — missing dimensions use 50 (neutral, not penalised)
    let weightedSum = 0;
    let weightUsed = 0;
    const dimensionScores = {};

    for (const [key, result] of Object.entries(dimensions)) {
        const w = WEIGHTS[key];
        const score = result.score !== null ? result.score : 50;
        dimensionScores[key] = score;
        weightedSum += score * w;
        weightUsed += w;
    }

    const overallScore = weightUsed > 0 ? Math.round(weightedSum / weightUsed) : 0;

    const grade =
        overallScore >= 90 ? 'ELITE' :
            overallScore >= 80 ? 'STABLE' :
                overallScore >= 70 ? 'FAIR' :
                    overallScore >= 60 ? 'DEGRADED' :
                        overallScore >= 50 ? 'UNSTABLE' : 'CRITICAL';

    const label =
        overallScore >= 90 ? 'Excellent' :
            overallScore >= 75 ? 'Good' :
                overallScore >= 60 ? 'Fair' :
                    overallScore >= 45 ? 'Needs Work' : 'Critical';

    // Weakest dimension
    const sorted = Object.entries(dimensionScores).sort((a, b) => a[1] - b[1]);
    const weakest = sorted[0] || ['N/A', 0];

    // Trend (simple: which dimensions are below 70)
    const warnings = Object.entries(dimensionScores)
        .filter(([_, s]) => s < 70)
        .map(([k]) => k);

    return {
        overallScore,
        grade,
        label,
        weights: WEIGHTS,
        dimensionScores,
        dimensions,     // full detail per dimension
        weakest: { name: weakest[0], score: weakest[1] },
        warnings,
        hasSufficientData: Object.values(dimensions).some(d => d.score !== null),
        computedAt: new Date().toISOString(),
        targetUrl: targetUrl || 'Global Aggregate'
    };
}

module.exports = { computeHygieneScore, WEIGHTS };
