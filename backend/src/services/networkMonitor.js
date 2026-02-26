/**
 * Network Monitor Service — Inspectra AI
 * ───────────────────────────────────────
 * Uses Playwright CDP (Chrome DevTools Protocol) to intercept all
 * network requests on a page, captures timing/status/size/headers,
 * detects issues (timeout, 5xx, empty body, CORS), and groups
 * endpoints by functionality cluster.
 */

const { chromium } = require('playwright');

// ── Issue Detection ───────────────────────────────────────────────────────────

const SLOW_THRESHOLD_MS = 3000;

function detectIssues(req) {
    const issues = [];
    if (req.duration >= SLOW_THRESHOLD_MS)
        issues.push({ type: 'slow', msg: `Response took ${(req.duration / 1000).toFixed(1)}s`, severity: 'warn' });
    if (req.status >= 500)
        issues.push({ type: 'server_error', msg: `Server error ${req.status}`, severity: 'error' });
    else if (req.status >= 400 && req.status !== 401 && req.status !== 403)
        issues.push({ type: 'client_error', msg: `Client error ${req.status}`, severity: 'warn' });
    if (req.status === 401)
        issues.push({ type: 'auth', msg: 'Unauthorized — 401', severity: 'warn' });
    if (req.status === 403)
        issues.push({ type: 'blocked', msg: 'Forbidden — 403', severity: 'error' });
    if (req.size === 0 && req.status >= 200 && req.status < 300 && req.method !== 'DELETE')
        issues.push({ type: 'empty', msg: 'Empty response body', severity: 'warn' });
    if (req.failed)
        issues.push({ type: 'failed', msg: req.failureText || 'Request failed', severity: 'error' });
    const origin = req.responseHeaders?.['access-control-allow-origin'];
    if (!origin && req.url.includes('/api') && req.start === 'cross-origin')
        issues.push({ type: 'cors', msg: 'Missing CORS header', severity: 'warn' });
    return issues;
}

// ── Cluster Classification ────────────────────────────────────────────────────

const CLUSTERS = [
    { name: 'Auth', color: '#8b5cf6', bg: '#ede9fe', patterns: [/\/auth|\/login|\/logout|\/register|\/token|\/oauth|\/session/i] },
    { name: 'API', color: '#0ea5e9', bg: '#e0f2fe', patterns: [/\/api\//i] },
    { name: 'Static', color: '#94a3b8', bg: '#f1f5f9', patterns: [/\.(js|css|woff2?|ttf|eot)(\?|$)/i] },
    { name: 'Media', color: '#f59e0b', bg: '#fef3c7', patterns: [/\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/i] },
    { name: 'Analytics', color: '#ec4899', bg: '#fce7f3', patterns: [/google-analytics|gtm\.|segment\.|mixpanel|amplitude|hotjar|clarity|heap/i] },
    { name: 'CDN', color: '#10b981', bg: '#d1fae5', patterns: [/cdn\.|cloudfront\.|fastly\.|akamai\.|bunny\.net/i] },
    { name: 'WebSocket', color: '#f97316', bg: '#fff7ed', patterns: [/wss?:\/\//i] },
    { name: 'GraphQL', color: '#6366f1', bg: '#eef2ff', patterns: [/graphql|gql/i] },
    { name: 'Other', color: '#64748b', bg: '#f8fafc', patterns: [] },
];

function classifyCluster(url) {
    for (const cluster of CLUSTERS) {
        if (cluster.patterns.some(p => p.test(url))) return cluster.name;
    }
    return 'Other';
}

// ── Method + Status helpers ───────────────────────────────────────────────────

function statusLabel(s) {
    if (!s) return 'Pending';
    if (s < 300) return 'OK';
    if (s < 400) return 'Redirect';
    if (s < 500) return 'Client Err';
    return 'Server Err';
}

// ── Main Intercept Function ───────────────────────────────────────────────────

async function monitorNetwork(url, onProgress) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    const requests = new Map();   // requestId → data
    const completed = [];

    // Enable CDP
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');

    // ── CDP Events ─────────────────────────────────────────────────────────
    cdp.on('Network.requestWillBeSent', ev => {
        requests.set(ev.requestId, {
            id: ev.requestId,
            url: ev.request.url,
            method: ev.request.method,
            requestHeaders: ev.request.headers,
            startTime: ev.timestamp * 1000,
            initiator: ev.initiator?.type || 'other',
            resourceType: ev.type || 'Other',
            status: null,
            size: 0,
            duration: 0,
            failed: false,
            failureText: '',
            responseHeaders: {},
            mimeType: '',
            cluster: classifyCluster(ev.request.url),
            issues: [],
        });
    });

    cdp.on('Network.responseReceived', ev => {
        const r = requests.get(ev.requestId);
        if (!r) return;
        r.status = ev.response.status;
        r.mimeType = ev.response.mimeType || '';
        r.responseHeaders = ev.response.headers || {};
        r.endTime = ev.timestamp * 1000;
        r.duration = r.endTime - (r.startTime || r.endTime);
    });

    cdp.on('Network.dataReceived', ev => {
        const r = requests.get(ev.requestId);
        if (r) r.size = (r.size || 0) + (ev.dataLength || 0);
    });

    cdp.on('Network.loadingFinished', ev => {
        const r = requests.get(ev.requestId);
        if (!r) return;
        r.endTime = ev.timestamp * 1000;
        r.duration = Math.round(r.endTime - (r.startTime || r.endTime));
        r.size = ev.encodedDataLength || r.size || 0;
        r.issues = detectIssues(r);
        completed.push(r);
        requests.delete(ev.requestId);
    });

    cdp.on('Network.loadingFailed', ev => {
        const r = requests.get(ev.requestId);
        if (!r) return;
        r.failed = true;
        r.failureText = ev.errorText || 'Unknown error';
        r.duration = Math.round((ev.timestamp * 1000) - (r.startTime || 0));
        r.status = 0;
        r.issues = detectIssues(r);
        completed.push(r);
        requests.delete(ev.requestId);
    });

    try {
        if (onProgress) onProgress({ phase: 'navigating', pct: 10 });
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        if (onProgress) onProgress({ phase: 'capturing', pct: 70 });
        await page.waitForTimeout(2000); // capture late-fire requests

        const title = await page.title();
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 50, clip: { x: 0, y: 0, width: 1280, height: 720 } });

        if (onProgress) onProgress({ phase: 'analysing', pct: 90 });

        // Flatten remaining in-flight
        for (const r of requests.values()) {
            r.failed = true;
            r.failureText = 'No response received';
            r.duration = 0;
            r.status = 0;
            r.issues = detectIssues(r);
            completed.push(r);
        }

        // ── Enrich & clean ─────────────────────────────────────────────────
        const enriched = completed.map(r => {
            let shortUrl = r.url;
            try { shortUrl = new URL(r.url).pathname + (new URL(r.url).search || ''); } catch { }
            return {
                ...r,
                shortUrl,
                statusLabel: statusLabel(r.status),
                sizeKb: r.size ? (r.size / 1024).toFixed(1) : '0',
                cluster: classifyCluster(r.url),
                hasIssues: r.issues.length > 0,
            };
        });

        // ── Summary stats ──────────────────────────────────────────────────
        const total = enriched.length;
        const errored = enriched.filter(r => r.status >= 400 || r.failed).length;
        const slow = enriched.filter(r => r.duration >= SLOW_THRESHOLD_MS).length;
        const blocked = enriched.filter(r => r.status === 403 || r.status === 401).length;
        const totalKb = enriched.reduce((s, r) => s + (r.size / 1024), 0).toFixed(1);
        const avgDuration = enriched.length
            ? Math.round(enriched.reduce((s, r) => s + r.duration, 0) / enriched.length)
            : 0;

        const clusterCounts = {};
        for (const r of enriched) clusterCounts[r.cluster] = (clusterCounts[r.cluster] || 0) + 1;
        const clusterArr = Object.entries(clusterCounts)
            .map(([name, count]) => ({ name, count, ...CLUSTERS.find(c => c.name === name) }))
            .sort((a, b) => b.count - a.count);

        return {
            url, title, total, errored, slow, blocked,
            totalKb, avgDuration,
            screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
            requests: enriched,
            clusters: clusterArr,
            capturedAt: new Date().toISOString(),
        };
    } finally {
        await browser.close();
    }
}

module.exports = { monitorNetwork, CLUSTERS };
