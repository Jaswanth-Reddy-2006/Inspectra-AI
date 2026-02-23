/**
 * Predictive Risk Analysis Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * For each URL seen across all stored analysis data, computes a
 * "failure probability" (0-100) using a weighted risk model:
 *
 *   Risk Inputs (all normalised 0-10):
 *     • past_defects         (from functional results)
 *     • fragile_selectors    (from DOM results)
 *     • slow_apis            (from network results)
 *     • complex_flows        (from functional step counts + fail rates)
 *     • accessibility_debt   (from perf/a11y results)
 *
 *   Risk formula:
 *     probability = (defects*0.35 + selectors*0.20 + apis*0.20 + flows*0.15 + a11y*0.10) / 10 × 100
 *
 * Returns per-page risk scores, ranked by probability, with factor breakdown.
 */

const fs = require('fs');
const path = require('path');

const DATA = {
    functional: path.join(__dirname, '../../data/functional_results.json'),
    network: path.join(__dirname, '../../data/network_results.json'),
    dom: path.join(__dirname, '../../data/dom_results.json'),
    perf: path.join(__dirname, '../../data/perf_results.json'),
};

function readJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }
function clamp(v, lo = 0, hi = 10) { return Math.max(lo, Math.min(hi, v)); }

// ── Risk weights ──────────────────────────────────────────────────────────────

const W = {
    past_defects: 0.35,
    fragile_selectors: 0.20,
    slow_apis: 0.20,
    complex_flows: 0.15,
    accessibility_debt: 0.10,
};

// ── Page risk registry ────────────────────────────────────────────────────────

function collectPageRisks() {
    const funcData = readJSON(DATA.functional);
    const netData = readJSON(DATA.network);
    const domData = readJSON(DATA.dom);
    const perfData = readJSON(DATA.perf);

    // Registry: url → { past_defects, fragile_selectors, slow_apis, complex_flows, a11y_debt, sources }
    const registry = {};

    function ensurePage(url) {
        if (!registry[url]) {
            registry[url] = {
                url,
                past_defects: 0,
                fragile_selectors: 0,
                slow_apis: 0,
                complex_flows: 0,
                accessibility_debt: 0,
                _defectCount: 0,
                _fragileCount: 0,
                _slowApiCount: 0,
                _totalApis: 0,
                _flowFails: 0,
                _totalFlows: 0,
                _a11yViolations: 0,
                sources: new Set(),
            };
        }
        return registry[url];
    }

    // ── Functional data ───────────────────────────────────────────────────────
    if (Array.isArray(funcData)) {
        funcData.slice(0, 5).forEach(run => {
            (run.results || []).forEach(flow => {
                const p = ensurePage(flow.url);
                p._totalFlows++;
                p._flowFails += flow.failCount || 0;
                p._defectCount += flow.failCount || 0;
                p.sources.add('functional');
            });
        });
    }

    // ── DOM data ──────────────────────────────────────────────────────────────
    if (domData && typeof domData === 'object') {
        Object.values(domData).forEach(result => {
            if (!result?.url) return;
            const p = ensurePage(result.url);
            const fragile = (result.elements || []).filter(el => el.stabilityScore < 40).length;
            p._fragileCount += fragile;
            p.sources.add('dom');
        });
    }

    // ── Network data ──────────────────────────────────────────────────────────
    if (netData && typeof netData === 'object') {
        Object.values(netData).forEach(capture => {
            if (!capture?.url) return;
            const p = ensurePage(capture.url);
            const reqs = capture.requests || [];
            p._totalApis += reqs.length;
            p._slowApiCount += reqs.filter(r => r.duration > 3000 || r.status >= 500).length;
            p.sources.add('network');
        });
    }

    // ── Perf / Accessibility ──────────────────────────────────────────────────
    if (perfData && typeof perfData === 'object') {
        Object.values(perfData).forEach(entry => {
            if (!entry?.url) return;
            const p = ensurePage(entry.url);
            p._a11yViolations += entry.axeSummary?.violations || 0;
            p.sources.add('perf');
        });
    }

    return registry;
}

// ── Normalise factors to 0-10 ─────────────────────────────────────────────────

function normalise(registry) {
    return Object.values(registry).map(p => {
        const defects = clamp(p._defectCount * 2);                   // 0-10 (5+ fails → max)
        const fragile = clamp(p._fragileCount * 0.5);                 // 0-10 (20+ fragile → max)
        const slowApis = p._totalApis > 0
            ? clamp((p._slowApiCount / p._totalApis) * 10)
            : 0;
        const complexFlow = p._totalFlows > 0
            ? clamp((p._flowFails / p._totalFlows) * 10)
            : 3;                                                           // unknown → moderate
        const a11y = clamp(p._a11yViolations * 0.2);               // 0-10 (50 violations → max)

        const raw =
            defects * W.past_defects +
            fragile * W.fragile_selectors +
            slowApis * W.slow_apis +
            complexFlow * W.complex_flows +
            a11y * W.accessibility_debt;

        const probability = Math.min(100, Math.round(raw * 10));

        const riskLevel =
            probability >= 75 ? 'critical' :
                probability >= 50 ? 'high' :
                    probability >= 25 ? 'medium' : 'low';

        const riskColor =
            probability >= 75 ? '#ef4444' :
                probability >= 50 ? '#f97316' :
                    probability >= 25 ? '#f59e0b' : '#10b981';

        // Top contributing factor
        const factors = [
            { name: 'Past Defects', score: defects, weight: W.past_defects, contribution: defects * W.past_defects },
            { name: 'Fragile Selectors', score: fragile, weight: W.fragile_selectors, contribution: fragile * W.fragile_selectors },
            { name: 'Slow / Failed APIs', score: slowApis, weight: W.slow_apis, contribution: slowApis * W.slow_apis },
            { name: 'Complex Flows', score: complexFlow, weight: W.complex_flows, contribution: complexFlow * W.complex_flows },
            { name: 'Accessibility Debt', score: a11y, weight: W.accessibility_debt, contribution: a11y * W.accessibility_debt },
        ].sort((a, b) => b.contribution - a.contribution);

        const topFactor = factors[0].name;
        const pageLabel = (() => { try { return new URL(p.url).pathname || '/'; } catch { return p.url; } })();

        return {
            url: p.url,
            label: pageLabel,
            probability,
            riskLevel,
            riskColor,
            topFactor,
            factors: factors.map(f => ({
                name: f.name,
                score: parseFloat(f.score.toFixed(1)),
                weight: f.weight,
                contribution: parseFloat(f.contribution.toFixed(2)),
            })),
            sources: [...p.sources],
            // Raw counts for tooltip
            counts: {
                defects: p._defectCount,
                fragile: p._fragileCount,
                slowApis: p._slowApiCount,
                totalApis: p._totalApis,
                a11y: p._a11yViolations,
                flows: p._totalFlows,
                flowFails: p._flowFails,
            },
        };
    });
}

// ── Recommendation engine ─────────────────────────────────────────────────────

function generateRecommendations(pages) {
    const recs = [];

    const critical = pages.filter(p => p.riskLevel === 'critical');
    if (critical.length > 0) {
        recs.push({
            priority: 'P0',
            title: `${critical.length} Critical Pages Need Immediate Attention`,
            detail: `Pages: ${critical.map(p => p.label).join(', ')}`,
            action: 'Run full functional + accessibility audit on these pages first.',
        });
    }

    const topFragile = pages.filter(p => p.counts.fragile > 5);
    if (topFragile.length > 0) {
        recs.push({
            priority: 'P1',
            title: 'High Selector Fragility Detected',
            detail: `${topFragile.reduce((s, p) => s + p.counts.fragile, 0)} unstable selectors across ${topFragile.length} pages`,
            action: 'Add data-testid attributes to interactive elements. Migrate away from dynamic IDs.',
        });
    }

    const topSlow = pages.filter(p => p.counts.slowApis > 3);
    if (topSlow.length > 0) {
        recs.push({
            priority: 'P1',
            title: 'Slow API Endpoints Increasing Test Flakiness',
            detail: `${topSlow.reduce((s, p) => s + p.counts.slowApis, 0)} slow/failed API calls detected`,
            action: 'Add retry logic, check for missing caching, investigate server-side timeouts.',
        });
    }

    return recs;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function computeRiskAnalysis() {
    const registry = collectPageRisks();
    const pages = normalise(registry).sort((a, b) => b.probability - a.probability);

    if (pages.length === 0) {
        return {
            pages: [],
            recommendations: [],
            stats: { total: 0, critical: 0, high: 0, medium: 0, low: 0, avgRisk: 0 },
            computedAt: new Date().toISOString(),
        };
    }

    const recommendations = generateRecommendations(pages);

    return {
        pages,
        recommendations,
        stats: {
            total: pages.length,
            critical: pages.filter(p => p.riskLevel === 'critical').length,
            high: pages.filter(p => p.riskLevel === 'high').length,
            medium: pages.filter(p => p.riskLevel === 'medium').length,
            low: pages.filter(p => p.riskLevel === 'low').length,
            avgRisk: Math.round(pages.reduce((s, p) => s + p.probability, 0) / pages.length),
        },
        weights: W,
        computedAt: new Date().toISOString(),
    };
}

module.exports = { computeRiskAnalysis };
