/**
 * Severity Matrix Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Scores defects using the formula:
 *
 *   score = (impact × business_value × reproducibility) / fix_effort
 *
 * Returns: Critical / High / Medium / Low with normalised 0-100 score.
 *
 * Ingests data from functional_results.json + network_results.json + dom_results.json
 * and builds a unified defect registry.
 */

const fs = require('fs');
const path = require('path');

const DATA = {
    functional: path.join(__dirname, '../../data/functional_results.json'),
    network: path.join(__dirname, '../../data/network_results.json'),
    dom: path.join(__dirname, '../../data/dom_results.json'),
};

function readJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }

// ── Score formula ─────────────────────────────────────────────────────────────

function computeScore({ impact, businessValue, reproducibility, fixEffort }) {
    const raw = (impact * businessValue * reproducibility) / Math.max(fixEffort, 1);
    return Math.min(100, Math.round(raw * 4));   // normalise to 0-100
}

function classifyScore(score) {
    if (score >= 75) return 'critical';
    if (score >= 45) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
}

// ── Source-specific impact tables ─────────────────────────────────────────────

const FLOW_BUSINESS_VALUE = { login: 5, addToCart: 5, submitForm: 4, search: 3 };
const FLOW_PAGE_IMPORTANCE = { login: 5, addToCart: 5, submitForm: 4, search: 3 };

const STATUS_IMPACT = { 0: 5, 503: 5, 500: 5, 502: 5, 404: 3, 403: 4, 401: 4, 429: 3 };
const CLUSTER_BV = { Auth: 5, API: 4, GraphQL: 4, WebSocket: 3, CDN: 2, Static: 1, Media: 1, Analytics: 1, Other: 2 };

// ── Defect builders ───────────────────────────────────────────────────────────

function defectsFromFunctional(funcData) {
    const defects = [];
    if (!funcData || !Array.isArray(funcData)) return defects;

    funcData.slice(0, 5).forEach(run => {
        (run.results || []).forEach(flow => {
            flow.steps?.forEach((step, idx) => {
                if (step.verdict !== 'fail') return;

                const impact = 5;
                const businessValue = FLOW_BUSINESS_VALUE[flow.flowId] || 3;
                const reproducibility = 5;
                const fixEffort = 2;
                const score = computeScore({ impact, businessValue, reproducibility, fixEffort });

                defects.push({
                    id: `func_${flow.flowId}_${idx}`,
                    source: 'Functional',
                    title: step.reason?.title || `Step failed: ${step.label}`,
                    description: step.reason?.why || step.detail || 'Step did not complete as expected',
                    page: flow.url,
                    component: flow.name,
                    category: step.reason?.category || 'Functional',
                    // Matrix dimensions
                    impact,
                    businessValue,
                    reproducibility,
                    fixEffort,
                    pageImportance: FLOW_PAGE_IMPORTANCE[flow.flowId] || 3,
                    userFrequency: businessValue,
                    // Output
                    score,
                    severity: classifyScore(score),
                    suggestions: step.reason?.suggestions || [],
                    detectedAt: flow.executedAt,
                });
            });
        });
    });

    return defects;
}

function defectsFromNetwork(netData) {
    const defects = [];
    if (!netData || typeof netData !== 'object') return defects;

    Object.values(netData).forEach(capture => {
        (capture.requests || []).forEach(req => {
            if (!req.issues || req.issues.length === 0) return;

            req.issues.forEach(iss => {
                const status = req.status || 0;
                const impact = STATUS_IMPACT[status] || (iss.severity === 'error' ? 4 : 2);
                const businessValue = CLUSTER_BV[req.cluster] || 2;
                const reproducibility = 4;
                const fixEffort = 3;
                const score = computeScore({ impact, businessValue, reproducibility, fixEffort });

                defects.push({
                    id: `net_${req.url?.slice(-30)}_${iss.msg?.slice(0, 15)}`,
                    source: 'Network',
                    title: iss.msg,
                    description: `${req.method} ${req.url?.slice(0, 80)} returned ${status || 'no response'}. Duration: ${req.duration}ms`,
                    page: capture.url,
                    component: req.cluster || 'API',
                    category: 'Network/API',
                    impact,
                    businessValue,
                    reproducibility,
                    fixEffort,
                    pageImportance: 3,
                    userFrequency: businessValue,
                    score,
                    severity: classifyScore(score),
                    suggestions: [
                        `Check endpoint: ${req.url?.slice(0, 60)}`,
                        'Review server logs for error details',
                        'Add retry logic with exponential backoff',
                    ],
                    detectedAt: capture.capturedAt,
                });
            });
        });
    });

    return defects;
}

function defectsFromDOM(domData) {
    const defects = [];
    if (!domData || typeof domData !== 'object') return defects;

    Object.values(domData).forEach(result => {
        (result.elements || []).forEach(el => {
            if (el.stabilityScore >= 50) return;

            const impact = el.stabilityScore < 20 ? 4 : 2;
            const businessValue = 3;
            const reproducibility = 5;
            const fixEffort = 1;
            const score = computeScore({ impact, businessValue, reproducibility, fixEffort });

            defects.push({
                id: `dom_${el.cssPath?.slice(-30)}`,
                source: 'DOM',
                title: `Unstable selector: <${el.tag}> (score ${el.stabilityScore})`,
                description: `Element uses ${el.isDynamic ? 'dynamic IDs/classes' : 'fragile selectors'}. Recommended: ${el.recommendedSelector}`,
                page: result.url,
                component: el.tag,
                category: 'DOM Stability',
                impact,
                businessValue,
                reproducibility,
                fixEffort,
                pageImportance: 2,
                userFrequency: 2,
                score,
                severity: classifyScore(score),
                suggestions: [
                    `Use recommended selector: ${el.recommendedSelector}`,
                    'Add data-testid attributes to interactive elements',
                ],
                detectedAt: result.analyzedAt,
            });
        });
    });

    return defects;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function buildSeverityMatrix() {
    const funcData = readJSON(DATA.functional);
    const netData = readJSON(DATA.network);
    const domData = readJSON(DATA.dom);

    const defects = [
        ...defectsFromFunctional(funcData),
        ...defectsFromNetwork(netData),
        ...defectsFromDOM(domData),
    ].sort((a, b) => b.score - a.score);

    // Deduplicate by id
    const seen = new Set();
    const unique = defects.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });

    const bySeverity = {
        critical: unique.filter(d => d.severity === 'critical').length,
        high: unique.filter(d => d.severity === 'high').length,
        medium: unique.filter(d => d.severity === 'medium').length,
        low: unique.filter(d => d.severity === 'low').length,
    };

    const bySource = {
        Functional: unique.filter(d => d.source === 'Functional').length,
        Network: unique.filter(d => d.source === 'Network').length,
        DOM: unique.filter(d => d.source === 'DOM').length,
    };

    const avgScore = unique.length
        ? Math.round(unique.reduce((s, d) => s + d.score, 0) / unique.length)
        : 0;

    return {
        defects: unique,
        total: unique.length,
        bySeverity,
        bySource,
        avgScore,
        topDefect: unique[0] || null,
        builtAt: new Date().toISOString(),
    };
}

module.exports = { buildSeverityMatrix, computeScore, classifyScore };
