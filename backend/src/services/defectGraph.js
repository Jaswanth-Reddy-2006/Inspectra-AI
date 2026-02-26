/**
 * Defect Knowledge Graph Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Builds an in-memory graph:
 *
 *   (Page) -[HAS]-> (Element) -[TRIGGERS]-> (API)
 *                                             |
 *                                         [CAUSES]
 *                                             |
 *                                          (Failure) -[IMPACTS]-> (UserGoal)
 *
 * The graph stores nodes + typed edges. Root-cause detection walks the graph
 * backwards from UserGoal failures to find the originating Page/Element.
 *
 * Data is aggregated from functional_results.json, network_results.json,
 * dom_results.json so no extra Playwright run is needed here.
 */

const fs = require('fs');
const path = require('path');

const DATA = {
    functional: path.join(__dirname, '../../data/functional_results.json'),
    network: path.join(__dirname, '../../data/network_results.json'),
    dom: path.join(__dirname, '../../data/dom_results.json'),
};

function readJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } }

// ── Node / Edge helpers ───────────────────────────────────────────────────────

function makeId(type, label) {
    return `${type}:${label.replace(/[^a-zA-Z0-9_/-]/g, '_').slice(0, 60)}`;
}

class KGraph {
    constructor() {
        this.nodes = new Map();   // id → node
        this.edges = [];          // { from, to, rel, weight, meta }
    }

    addNode(id, type, label, meta = {}) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, { id, type, label, meta, severity: meta.severity || 'low' });
        }
        return id;
    }

    addEdge(from, to, rel, weight = 1, meta = {}) {
        // Deduplicate
        const exists = this.edges.some(e => e.from === from && e.to === to && e.rel === rel);
        if (!exists) this.edges.push({ from, to, rel, weight, meta });
    }

    toJSON() {
        return {
            nodes: [...this.nodes.values()],
            edges: this.edges,
        };
    }
}

// ── Severity calculator ───────────────────────────────────────────────────────
// Uses the formula from SeverityMatrix:  score = (impact * businessValue * reproducibility) / fixEffort

function severityFromFlow(verdict, flowId) {
    const impactMap = { fail: 5, warn: 3, pass: 1 };
    const bvMap = { login: 5, addToCart: 5, submitForm: 4, search: 3 };
    const repro = verdict === 'fail' ? 5 : verdict === 'warn' ? 3 : 1;
    const fixEffort = 2;
    const score = ((impactMap[verdict] || 1) * (bvMap[flowId] || 3) * repro) / fixEffort;

    if (score >= 10) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
}

function severityFromNetworkStatus(status) {
    if (!status || status === 0) return 'critical';  // network fail
    if (status >= 500) return 'critical';
    if (status >= 400) return 'high';
    if (status >= 300) return 'medium';
    return 'low';
}

// ── User goals mapping ────────────────────────────────────────────────────────

const FLOW_GOALS = {
    login: 'User Authentication',
    addToCart: 'Purchase Conversion',
    submitForm: 'Lead Capture',
    search: 'Content Discovery',
};

function normalizeUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        u.hash = '';
        const params = new URLSearchParams(u.search);
        params.sort();
        u.search = params.toString();
        let path = u.pathname;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        u.pathname = path;
        return u.toString().toLowerCase();
    } catch {
        return urlStr ? urlStr.toLowerCase() : '';
    }
}

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(targetUrl = null) {
    const g = new KGraph();
    const normTarget = targetUrl ? normalizeUrl(targetUrl) : null;

    // ── 1. Ingest Functional Judge results ────────────────────────────────────
    const funcData = readJSON(DATA.functional);
    if (funcData && Array.isArray(funcData)) {
        funcData.slice(0, 10).forEach(run => {                // last 10 runs
            if (!run?.results) return;
            run.results.forEach(flowResult => {
                const { flowId, verdict, url, steps = [], overallReason } = flowResult;

                if (normTarget && normalizeUrl(url) !== normTarget) return;

                // Page node
                const pageId = makeId('page', url);
                g.addNode(pageId, 'page', url, { url });

                // Flow / element node
                const elemId = makeId('element', flowId);
                g.addNode(elemId, 'element', FLOW_GOALS[flowId] || flowId, {
                    flowId, verdict,
                    severity: severityFromFlow(verdict, flowId),
                });

                g.addEdge(pageId, elemId, 'HAS', 1, { verdict });

                // Step-level action nodes
                steps.forEach((step, idx) => {
                    if (step.verdict !== 'fail') return;

                    const actionId = makeId('action', `${flowId}_step${idx}`);
                    g.addNode(actionId, 'action', step.label, {
                        action: step.action,
                        detail: step.detail,
                        severity: 'high',
                    });
                    g.addEdge(elemId, actionId, 'TRIGGERS', 1, { step: idx });

                    // Failure node
                    const failId = makeId('failure', `${flowId}_step${idx}_fail`);
                    const reason = step.reason || {};
                    g.addNode(failId, 'failure', reason.title || 'Step Failure', {
                        code: reason.code,
                        category: reason.category,
                        why: reason.why,
                        severity: severityFromFlow(verdict, flowId),
                        suggestions: reason.suggestions || [],
                    });
                    g.addEdge(actionId, failId, 'CAUSES', 2, { code: reason.code });

                    // User goal node
                    const goalId = makeId('goal', FLOW_GOALS[flowId] || flowId);
                    g.addNode(goalId, 'goal', FLOW_GOALS[flowId] || flowId, {
                        severity: severityFromFlow(verdict, flowId),
                    });
                    g.addEdge(failId, goalId, 'IMPACTS', 3, { flowId });
                });
            });
        });
    }

    // ── 2. Ingest Network Monitor results ─────────────────────────────────────
    const netData = readJSON(DATA.network);
    if (netData && typeof netData === 'object') {
        Object.values(netData).forEach(capture => {
            if (!capture?.url || !capture?.requests) return;
            if (normTarget && normalizeUrl(capture.url) !== normTarget) return;

            const pageId = makeId('page', capture.url);
            g.addNode(pageId, 'page', capture.url, { url: capture.url });

            capture.requests
                .filter(r => r.issues?.length > 0)
                .slice(0, 30)
                .forEach(req => {
                    const apiId = makeId('api', req.url);
                    g.addNode(apiId, 'api', req.shortUrl || req.url, {
                        method: req.method,
                        status: req.status,
                        cluster: req.cluster,
                        duration: req.duration,
                        severity: severityFromNetworkStatus(req.status),
                    });
                    g.addEdge(pageId, apiId, 'CALLS', 1);

                    req.issues.forEach(iss => {
                        const failId = makeId('failure', `net_${req.url}_${iss.msg?.slice(0, 20)}`);
                        g.addNode(failId, 'failure', iss.msg, {
                            severity: iss.severity === 'error' ? 'high' : 'medium',
                            category: 'Network',
                        });
                        g.addEdge(apiId, failId, 'CAUSES', 2);
                    });
                });
        });
    }

    // ── 3. Ingest DOM Analysis results ────────────────────────────────────────
    const domData = readJSON(DATA.dom);
    if (domData && typeof domData === 'object') {
        Object.values(domData).forEach(result => {
            if (!result?.url || !result?.elements) return;
            if (normTarget && normalizeUrl(result.url) !== normTarget) return;

            const pageId = makeId('page', result.url);
            g.addNode(pageId, 'page', result.url, { url: result.url });

            result.elements
                .filter(el => el.stabilityScore < 50)
                .slice(0, 20)
                .forEach(el => {
                    const elemId = makeId('element', `dom_${result.url}_${el.tag}_${el.cssPath?.slice(-20)}`);
                    g.addNode(elemId, 'element', `${el.tag} (score: ${el.stabilityScore})`, {
                        stabilityScore: el.stabilityScore,
                        isDynamic: el.isDynamic,
                        severity: el.stabilityScore < 20 ? 'high' : 'medium',
                        selector: el.recommendedSelector,
                    });
                    g.addEdge(pageId, elemId, 'HAS', 1);

                    if (el.isDynamic) {
                        const failId = makeId('failure', `dom_dynamic_${elemId}`);
                        g.addNode(failId, 'failure', `Unstable selector: ${el.tag}`, {
                            severity: 'medium',
                            category: 'DOM Stability',
                            why: `Element has a stability score of ${el.stabilityScore}/100 — dynamic ID or class names may break selectors.`,
                        });
                        g.addEdge(elemId, failId, 'CAUSES', 1);
                    }
                });
        });
    }

    // ── 4. Root-cause detection ───────────────────────────────────────────────
    // Walk: UserGoal nodes backwards → find root pages

    const rootCauses = [];
    const impactEdges = g.edges.filter(e => e.rel === 'IMPACTS');

    impactEdges.forEach(ie => {
        // Walk back to find the originating page
        const causesEdge = g.edges.find(e => e.to === ie.from && e.rel === 'CAUSES');
        const triggerEdge = causesEdge ? g.edges.find(e => e.to === causesEdge.from && e.rel === 'TRIGGERS') : null;
        const hasEdge = triggerEdge ? g.edges.find(e => e.to === triggerEdge.from && e.rel === 'HAS') : null;

        const failure = g.nodes.get(ie.from);
        const goal = g.nodes.get(ie.to);
        const action = causesEdge ? g.nodes.get(causesEdge.from) : null;
        const element = triggerEdge ? g.nodes.get(triggerEdge.from) : null;
        const page = hasEdge ? g.nodes.get(hasEdge.from) : null;

        if (failure && goal) {
            rootCauses.push({
                goal: goal.label,
                failure: failure.label,
                reason: failure.meta?.why,
                action: action?.label,
                element: element?.label,
                page: page?.label,
                severity: failure.meta?.severity || 'medium',
                suggestions: failure.meta?.suggestions || [],
            });
        }
    });

    return {
        ...g.toJSON(),
        rootCauses,
        stats: {
            pages: [...g.nodes.values()].filter(n => n.type === 'page').length,
            elements: [...g.nodes.values()].filter(n => n.type === 'element').length,
            apis: [...g.nodes.values()].filter(n => n.type === 'api').length,
            actions: [...g.nodes.values()].filter(n => n.type === 'action').length,
            failures: [...g.nodes.values()].filter(n => n.type === 'failure').length,
            goals: [...g.nodes.values()].filter(n => n.type === 'goal').length,
            edges: g.edges.length,
        },
        builtAt: new Date().toISOString(),
    };
}

module.exports = { buildGraph };
