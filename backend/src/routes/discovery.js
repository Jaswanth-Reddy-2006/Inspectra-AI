const express = require('express');
const router = express.Router();
const { chromium } = require('playwright');

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
        return urlStr.toLowerCase();
    }
}

function classifyPageType(url, title, html) {
    const u = url.toLowerCase();
    const t = (title || '').toLowerCase();
    const h = (html || '').toLowerCase();

    if (/\/(login|signin|sign-in|auth|oauth|sso)/.test(u) || /login|sign in/.test(t)) return 'auth';
    if (/\/(register|signup|sign-up|create-account)/.test(u)) return 'form';
    if (/\/(dashboard|home|overview|summary|main)/.test(u)) return 'dashboard';
    if (/\/(admin|manage|management|control)/.test(u)) return 'dashboard';
    if (/\/(users?|members?|people|team|profile|account)/.test(u)) return 'list';
    if (/\/(orders?|products?|items?|catalog|inventory|list)/.test(u)) return 'list';
    if (/\/(checkout|cart|payment|wizard|step|onboard)/.test(u)) return 'wizard';
    if (/\/(report|analytics|stats|metrics|insight|chart|graph)/.test(u)) return 'report';
    if (/\/api\//.test(u) || /application\/json/.test(h)) return 'api';
    if ((h.match(/<form/g) || []).length > 1) return 'form';
    return 'unknown';
}

// ─── Global State for Last Scan ───────────────────────────────────────────────
let lastCrawlResult = null;

/**
 * GET /api/discovery/latest
 * Returns the latest discovery results
 */
router.get('/latest', (req, res) => {
    if (!lastCrawlResult) return res.status(404).json({ success: false, error: 'No crawls have been completed yet' });
    res.json({ success: true, data: lastCrawlResult });
});

// ─── SSE Discovery Route ──────────────────────────────────────────────────────

/**
 * POST /api/discovery/start
 * Body: { url, maxPages, maxDepth, includeSubdomains, deviceProfile, requiresAuth }
 * Returns: Server-Sent Events stream
 */
router.post('/start', async (req, res) => {
    const {
        url,
        maxPages = 20,
        maxDepth = 3,
        includeSubdomains = false,
        deviceProfile = 'desktop',
        requiresAuth = false
    } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'URL is required' });
    }

    // ── SSE setup ──────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const send = (type, data) => {
        try {
            res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
            if (res.flush) res.flush();
        } catch (_) { /* client disconnected */ }
    };

    // ── Device profiles ────────────────────────────────────────────────
    const DEVICE_PROFILES = {
        desktop: { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        mobile: { viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
        tablet: { viewport: { width: 768, height: 1024 }, userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15' },
    };

    const profile = DEVICE_PROFILES[deviceProfile] || DEVICE_PROFILES.desktop;

    send('log', { level: 'info', text: `🚀 Initializing discovery crawler` });
    send('log', { level: 'info', text: `🖥️  Device: ${deviceProfile} | Depth: ${maxDepth} | Max pages: ${maxPages}` });
    send('log', { level: 'info', text: `🌐 Target: ${url}` });
    send('progress', { value: 2, stage: 'Launching headless browser' });

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: profile.viewport,
            userAgent: profile.userAgent,
            ignoreHTTPSErrors: true,
        });

        let baseOrigin;
        let baseHostname;
        try {
            const parsed = new URL(url);
            baseOrigin = parsed.origin;
            baseHostname = parsed.hostname;
        } catch {
            send('error', { message: 'Invalid URL provided' });
            send('done', { success: false });
            await browser.close();
            return res.end();
        }

        const visited = new Set();
        const queue = [{ url: normalizeUrl(url), depth: 0, discoveredFrom: null }];
        const pages = [];   // discovered page records
        const edges = [];   // { from, to } for graph
        let pageId = 0;

        send('log', { level: 'info', text: `🔍 Starting BFS from ${url}` });
        send('progress', { value: 5, stage: 'Starting BFS crawl' });

        while (queue.length > 0 && visited.size < maxPages) {
            const { url: currentUrl, depth, discoveredFrom } = queue.shift();
            const normUrl = normalizeUrl(currentUrl);

            if (visited.has(normUrl)) continue;

            // Check subdomain policy
            try {
                const currentHost = new URL(normUrl).hostname;
                if (!includeSubdomains && currentHost !== baseHostname) continue;
                if (includeSubdomains && !currentHost.endsWith(baseHostname.replace(/^www\./, ''))) continue;
            } catch { continue; }

            visited.add(normUrl);
            pageId++;

            send('log', { level: 'visiting', text: `➡️  Visiting [depth ${depth}]: ${normUrl}` });

            const page = await context.newPage();
            const capturedApis = [];
            const pageErrors = [];

            // Intercept requests to discover API calls
            page.on('request', req => {
                const u = req.url();
                if (/\/api\/|\/graphql|\.json/.test(u) && !u.includes('analytics') && !u.includes('tracking')) {
                    capturedApis.push({ method: req.method(), url: u });
                    send('log', { level: 'api', text: `📡 API: ${req.method()} ${u.replace(baseOrigin, '')}` });
                }
            });

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    pageErrors.push({ type: 'console_error', text: msg.text() });
                }
            });

            page.on('pageerror', err => {
                pageErrors.push({ type: 'js_exception', text: err.message });
                send('log', { level: 'error', text: `❌ JS Error: ${err.message.slice(0, 80)}` });
            });

            const t0 = Date.now();
            let statusCode = 0;
            let pageTitle = '';
            let pageType = 'unknown';
            let domSnapshot = '';

            try {
                // Wait for networkidle to handle SPAs better
                const response = await page.goto(normUrl, { waitUntil: 'networkidle', timeout: 25000 });
                const loadTime = Date.now() - t0;
                statusCode = response?.status() || 0;

                // Capture metadata function
                const getMeta = async () => page.evaluate(() => ({
                    title: document.title,
                    links: Array.from(document.querySelectorAll('a[href]')).map(a => a.href).slice(0, 80),
                    buttonLinks: Array.from(document.querySelectorAll('[data-href],[onclick],[role=link]'))
                        .map(el => el.getAttribute('data-href') || '').filter(Boolean),
                    domSummary: document.documentElement.outerHTML.slice(0, 4000),
                    formCount: document.querySelectorAll('form').length,
                    inputCount: document.querySelectorAll('input,textarea,select').length,
                    linkCount: document.querySelectorAll('a').length,
                    imageCount: document.querySelectorAll('img').length,
                }));

                let meta = await getMeta();

                // If no links found, wait a bit for possible lazy-loading/hydration and try again
                if (meta.linkCount === 0) {
                    await page.waitForTimeout(2000);
                    meta = await getMeta();
                }

                pageTitle = meta.title;
                pageType = classifyPageType(normUrl, meta.title, meta.domSummary);
                domSnapshot = meta.domSummary;

                // Push new nodes & edges to graph
                const pageRecord = {
                    id: `p${pageId}`,
                    url: normUrl,
                    depth,
                    statusCode,
                    loadTime,
                    pageType,
                    title: pageTitle,
                    discoveredFrom,
                    apis: capturedApis.length,
                    forms: meta.formCount,
                    inputs: meta.inputCount,
                    links: meta.linkCount,
                    errors: pageErrors.length,
                };
                pages.push(pageRecord);

                if (discoveredFrom) {
                    edges.push({ from: discoveredFrom, to: `p${pageId}` });
                }

                send('page', { page: pageRecord });
                send('log', { level: 'found', text: `✅ Found: ${normUrl} [${statusCode}] ${loadTime}ms — ${pageType}` });
                send('progress', {
                    value: Math.min(10 + Math.round((visited.size / maxPages) * 85), 92),
                    stage: `Crawling (${visited.size}/${maxPages})`
                });

                // Enqueue new links
                if (depth < maxDepth) {
                    const allLinks = [...meta.links, ...meta.buttonLinks];
                    for (const rawLink of allLinks) {
                        try {
                            const norm = normalizeUrl(rawLink);
                            const linkHost = new URL(norm).hostname;
                            const same = includeSubdomains
                                ? linkHost.endsWith(baseHostname.replace(/^www\./, ''))
                                : linkHost === baseHostname;
                            if (same && !visited.has(norm) && !queue.find(q => q.url === norm)) {
                                queue.push({ url: norm, depth: depth + 1, discoveredFrom: `p${pageId}` });
                                send('log', { level: 'queued', text: `🔗 Queued: ${norm}` });
                            }
                        } catch { /* skip malformed */ }
                    }

                    // Also check SPA pushState routes
                    const spaRoutes = await page.evaluate(() => {
                        const routes = [];
                        document.querySelectorAll('[href]').forEach(el => {
                            const h = el.getAttribute('href');
                            if (h && h.startsWith('/') && !h.includes('.')) routes.push(h);
                        });
                        return routes.slice(0, 20);
                    }).catch(() => []);

                    for (const route of spaRoutes) {
                        try {
                            const full = new URL(route, baseOrigin).toString();
                            const norm = normalizeUrl(full);
                            if (!visited.has(norm) && !queue.find(q => q.url === norm)) {
                                queue.push({ url: norm, depth: depth + 1, discoveredFrom: `p${pageId}` });
                            }
                        } catch { /* skip */ }
                    }
                }
            } catch (err) {
                const loadTime = Date.now() - t0;
                const rec = {
                    id: `p${pageId}`, url: normUrl, depth, statusCode: 0,
                    loadTime, pageType: 'unknown', title: '', discoveredFrom,
                    apis: 0, forms: 0, inputs: 0, links: 0, errors: 1,
                    error: err.message.slice(0, 120),
                };
                pages.push(rec);
                if (discoveredFrom) edges.push({ from: discoveredFrom, to: `p${pageId}` });
                send('page', { page: rec });
                send('log', { level: 'error', text: `💥 Failed: ${normUrl} — ${err.message.slice(0, 80)}` });
            } finally {
                await page.close();
            }
        } // end while

        lastCrawlResult = { url, pages, edges, timestamp: new Date() };
        send('log', { level: 'success', text: `🎉 Discovery complete — ${pages.length} pages found, ${edges.length} connections mapped` });
        send('progress', { value: 100, stage: 'Complete' });
        send('done', { success: true, pages, edges, totalPages: pages.length });

    } catch (err) {
        console.error('[Discovery] Fatal error:', err);
        send('log', { level: 'error', text: `Fatal: ${err.message}` });
        send('done', { success: false, error: err.message });
    } finally {
        if (browser) {
            try { await browser.close(); } catch (_) { }
        }
        res.end();
    }
});

module.exports = router;
