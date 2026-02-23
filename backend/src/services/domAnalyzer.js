/**
 * DOM Analyzer Service — Inspectra AI
 * ─────────────────────────────────────
 * Extracts meaningful DOM elements from a live page, computes
 * selector stability scores, detects dynamic/fragile patterns,
 * and recommends the best automation selector per element.
 *
 * Stability Formula:
 *   score = testid_w + id_w + aria_w + role_w + name_w + type_w + text_w
 *           - nth_child_penalty - dynamic_id_penalty - dynamic_class_penalty
 *           - no_unique_attr_penalty
 *   capped 0–100
 *
 * Selector Priority: data-testid > aria-label > id > role > text > css > xpath
 */

const { chromium } = require('playwright');

// ── Helpers ───────────────────────────────────────────────────────────────────

const DYNAMIC_ID_RE = /(\d{4,}|[0-9a-f]{8,}|uuid|guid|uid|tmp|rand|auto[-_])/i;
const DYNAMIC_CLASS_RE = /css-[a-z0-9]+|sc-[a-z0-9]+|[a-z]{1,4}-[0-9a-f]{5,}|__[a-z]+_[a-z0-9]{5,}/i;
const NTH_RE = /nth-child|nth-of-type/;

function isDynamicId(id) {
    return id && DYNAMIC_ID_RE.test(id);
}
function hasDynamicClasses(classList) {
    return classList.some(c => DYNAMIC_CLASS_RE.test(c));
}

/**
 * Compute selector stability score (0–100) for one element.
 */
function computeStability(el) {
    let score = 0;
    const flags = [];

    // ── Positive weights ───────────────────────────────────────────────────
    if (el.testid) {
        score += 40;
        flags.push({ attr: 'data-testid', weight: +40, label: 'Excellent — test-stable identifier' });
    }
    if (el.id && !isDynamicId(el.id)) {
        score += 30;
        flags.push({ attr: 'id', weight: +30, label: 'Good — stable unique ID' });
    }
    if (el.ariaLabel) {
        score += 20;
        flags.push({ attr: 'aria-label', weight: +20, label: 'Good — accessibility label' });
    }
    if (el.role && el.role !== 'generic' && el.role !== 'none') {
        score += 15;
        flags.push({ attr: 'role', weight: +15, label: 'Good — explicit ARIA role' });
    }
    if (el.name) {
        score += 10;
        flags.push({ attr: 'name', weight: +10, label: 'OK — name attribute' });
    }
    if (el.type && el.type !== 'text' && el.type !== 'hidden') {
        score += 5;
        flags.push({ attr: 'type', weight: +5, label: 'Weak bonus — typed element' });
    }
    if (el.text && el.text.length > 1 && el.text.length <= 40) {
        score += 8;
        flags.push({ attr: 'text', weight: +8, label: 'OK — short stable text' });
    }
    if (el.placeholder) {
        score += 5;
        flags.push({ attr: 'placeholder', weight: +5, label: 'Weak — placeholder text' });
    }

    // ── Negative penalties ─────────────────────────────────────────────────
    if (el.id && isDynamicId(el.id)) {
        score -= 20;
        flags.push({ attr: 'id (dynamic)', weight: -20, label: '⚠ Dynamic ID — changes on reload' });
    }
    if (hasDynamicClasses(el.classList || [])) {
        const penalty = Math.min(30, (el.classList || []).filter(c => DYNAMIC_CLASS_RE.test(c)).length * 10);
        score -= penalty;
        flags.push({ attr: 'class (hashed)', weight: -penalty, label: '⚠ CSS-module / styled-component hash classes' });
    }
    if (el.nthChildDepth && el.nthChildDepth > 0) {
        const penalty = Math.min(20, el.nthChildDepth * 8);
        score -= penalty;
        flags.push({ attr: 'nth-child', weight: -penalty, label: '⚠ Index-based positioning — fragile' });
    }
    if (!el.testid && !el.id && !el.ariaLabel && !el.role && !el.name) {
        score -= 15;
        flags.push({ attr: 'no unique attr', weight: -15, label: '✗ No stable identifier found' });
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    // Change probability: inverse of stability + dynamic signals
    const dynamicSignals = (isDynamicId(el.id) ? 1 : 0) +
        (hasDynamicClasses(el.classList || []) ? 1 : 0) +
        (!el.testid && !el.id && !el.ariaLabel ? 1 : 0);
    const changeProbability = Math.min(95, Math.round(100 - score + dynamicSignals * 10));

    return { score, flags, changeProbability };
}

/**
 * Build the recommended selector using priority chain.
 */
function buildRecommendedSelector(el) {
    const candidates = [];

    if (el.testid)
        candidates.push({ priority: 1, label: 'data-testid', selector: `[data-testid="${el.testid}"]`, strength: 'Excellent' });
    if (el.ariaLabel)
        candidates.push({ priority: 2, label: 'aria-label', selector: `[aria-label="${el.ariaLabel}"]`, strength: 'Good' });
    if (el.id && !isDynamicId(el.id))
        candidates.push({ priority: 3, label: 'id', selector: `#${el.id}`, strength: 'Good' });
    if (el.role && el.role !== 'generic') {
        const textPart = el.text ? `, { name: "${el.text.slice(0, 30)}" }` : '';
        candidates.push({ priority: 4, label: 'role', selector: `getByRole('${el.role}'${textPart})`, strength: 'Moderate' });
    }
    if (el.text && el.text.length > 1 && el.text.length <= 40)
        candidates.push({ priority: 5, label: 'text', selector: `getByText("${el.text.slice(0, 40)}")`, strength: 'Moderate' });
    if (el.name)
        candidates.push({ priority: 6, label: 'name attr', selector: `[name="${el.name}"]`, strength: 'Moderate' });
    if (el.cssPath)
        candidates.push({ priority: 7, label: 'CSS path', selector: el.cssPath, strength: 'Fragile' });
    if (el.xpath)
        candidates.push({ priority: 8, label: 'XPath', selector: el.xpath, strength: 'Fragile' });

    candidates.sort((a, b) => a.priority - b.priority);
    return candidates;
}

// ── Main Extraction ───────────────────────────────────────────────────────────

async function analyzeDom(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1200);

        const title = await page.title();
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 50, clip: { x: 0, y: 0, width: 1280, height: 720 } });

        // ── Extract elements ─────────────────────────────────────────────────
        const elements = await page.evaluate(() => {
            const SKIP_TAGS = new Set(['script', 'style', 'link', 'meta', 'head', 'noscript', 'br', 'hr', 'svg', 'path']);
            const INTERACTIVE = new Set(['button', 'a', 'input', 'select', 'textarea', 'form',
                'label', 'details', 'summary', '[role]', '[data-testid]', '[aria-label]']);

            // Get XPath for element
            function getXPath(el) {
                if (el.id && !/\d{4,}|[0-9a-f]{8}/.test(el.id)) return `//*[@id="${el.id}"]`;
                const parts = [];
                let cur = el;
                while (cur && cur.nodeType === 1 && cur !== document.body) {
                    let tag = cur.tagName.toLowerCase();
                    const sib = Array.from(cur.parentElement?.children || []).filter(c => c.tagName === cur.tagName);
                    if (sib.length > 1) {
                        const idx = sib.indexOf(cur) + 1;
                        tag += `[${idx}]`;
                    }
                    parts.unshift(tag);
                    cur = cur.parentElement;
                }
                return '//' + parts.join('/');
            }

            // CSS path
            function getCssPath(el) {
                const parts = [];
                let cur = el;
                let depth = 0;
                while (cur && cur.nodeType === 1 && cur !== document.body && depth < 5) {
                    let seg = cur.tagName.toLowerCase();
                    if (cur.id && !/\d{4,}/.test(cur.id)) { seg += `#${cur.id}`; parts.unshift(seg); break; }
                    const siblings = Array.from(cur.parentElement?.children || []).filter(c => c.tagName === cur.tagName);
                    if (siblings.length > 1) { seg += `:nth-child(${siblings.indexOf(cur) + 1})`; }
                    parts.unshift(seg);
                    cur = cur.parentElement;
                    depth++;
                }
                return parts.join(' > ');
            }

            // Count nth-child depth
            function nthDepth(el) {
                let d = 0, cur = el;
                while (cur && cur !== document.body) {
                    const sib = Array.from(cur.parentElement?.children || []).filter(c => c.tagName === cur.tagName);
                    if (sib.length > 1) d++;
                    cur = cur.parentElement;
                }
                return d;
            }

            const results = [];
            const SIGNIFICANT = [
                'button', 'a', 'input', 'select', 'textarea', 'form',
                'nav', 'header', 'main', 'footer', 'aside', 'section', 'article',
                'h1', 'h2', 'h3', 'table', 'summary', 'details', 'dialog',
            ];

            let idx = 0;
            for (const tag of SIGNIFICANT) {
                const els = document.querySelectorAll(tag);
                for (const el of els) {
                    if (idx >= 120) break;
                    const text = (el.innerText || el.textContent || '').trim().slice(0, 60);
                    const classList = Array.from(el.classList);
                    const rect = el.getBoundingClientRect();

                    results.push({
                        idx: idx++,
                        tag: el.tagName.toLowerCase(),
                        id: el.id || '',
                        classList,
                        name: el.getAttribute('name') || '',
                        type: el.getAttribute('type') || '',
                        role: el.getAttribute('role') || el.tagName === 'BUTTON' ? 'button' : '',
                        ariaLabel: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || '',
                        testid: el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('data-cy') || '',
                        placeholder: el.getAttribute('placeholder') || '',
                        href: el.getAttribute('href') || '',
                        text: text.replace(/\s+/g, ' ').trim(),
                        xpath: getXPath(el),
                        cssPath: getCssPath(el),
                        nthChildDepth: nthDepth(el),
                        visible: rect.width > 0 && rect.height > 0,
                        x: Math.round(rect.x), y: Math.round(rect.y),
                        w: Math.round(rect.width), h: Math.round(rect.height),
                    });
                }
                if (idx >= 120) break;
            }

            // Also capture testid elements not covered above
            for (const el of document.querySelectorAll('[data-testid],[data-test],[aria-label]')) {
                if (idx >= 140) break;
                if (SIGNIFICANT.includes(el.tagName.toLowerCase())) continue;
                const text = (el.innerText || '').trim().slice(0, 60);
                const classList = Array.from(el.classList);
                const rect = el.getBoundingClientRect();
                results.push({
                    idx: idx++,
                    tag: el.tagName.toLowerCase(),
                    id: el.id || '',
                    classList,
                    name: el.getAttribute('name') || '',
                    type: el.getAttribute('type') || '',
                    role: el.getAttribute('role') || '',
                    ariaLabel: el.getAttribute('aria-label') || '',
                    testid: el.getAttribute('data-testid') || el.getAttribute('data-test') || '',
                    placeholder: el.getAttribute('placeholder') || '',
                    href: el.getAttribute('href') || '',
                    text: text.replace(/\s+/g, ' ').trim(),
                    xpath: '',
                    cssPath: '',
                    nthChildDepth: 0,
                    visible: rect.width > 0 && rect.height > 0,
                    x: 0, y: 0, w: 0, h: 0,
                });
            }

            return results;
        });

        // ── Enrich with stability scores ───────────────────────────────────
        const enriched = elements.map(el => {
            const { score, flags, changeProbability } = computeStability(el);
            const selectors = buildRecommendedSelector(el);
            return {
                ...el,
                stabilityScore: score,
                changeProbability,
                flags,
                selectors,
                recommendedSelector: selectors[0] || null,
                hasDynamicId: isDynamicId(el.id),
                hasDynamicClasses: hasDynamicClasses(el.classList || []),
            };
        });

        // ── Build simplified tree for UI ───────────────────────────────────
        const tree = await page.evaluate(() => {
            function buildNode(el, depth) {
                if (depth > 6) return null;
                const SKIP = new Set(['script', 'style', 'noscript', 'meta', 'link', 'path', 'g', 'defs']);
                if (SKIP.has(el.tagName?.toLowerCase())) return null;

                const children = [];
                const goodChildren = [];
                const SEMANTIC = new Set(['header', 'nav', 'main', 'footer', 'aside', 'section', 'article', 'form', 'table', 'ul', 'ol', 'dialog', 'details']);
                const LEAF_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'button', 'a', 'input', 'select', 'textarea', 'label', 'img', 'p', 'li', 'th', 'td', 'summary']);

                for (const child of Array.from(el.children || []).slice(0, 12)) {
                    const tag = child.tagName?.toLowerCase();
                    if (!tag) continue;
                    if (SKIP.has(tag)) continue;
                    if (depth >= 2 && !SEMANTIC.has(tag) && !LEAF_TAGS.has(tag)) {
                        // summarise anonymous divs
                        if (el.children.length > 6) continue;
                    }
                    const node = buildNode(child, depth + 1);
                    if (node) goodChildren.push(node);
                }

                const attrs = [];
                if (el.id) attrs.push(`id="${el.id}"`);
                else if (el.getAttribute?.('data-testid')) attrs.push(`data-testid="${el.getAttribute('data-testid')}"`);
                else if (el.getAttribute?.('aria-label')) attrs.push(`aria-label="${el.getAttribute('aria-label')}"`);
                else if (el.className && typeof el.className === 'string') {
                    const cls = el.className.trim().split(' ').slice(0, 2).join(' ');
                    if (cls) attrs.push(`class="${cls}"`);
                }

                return {
                    tag: el.tagName?.toLowerCase(),
                    attrs: attrs.join(' '),
                    id: el.id || '',
                    testid: el.getAttribute?.('data-testid') || '',
                    ariaLabel: el.getAttribute?.('aria-label') || '',
                    childCount: el.children?.length || 0,
                    children: goodChildren,
                };
            }

            const body = document.body;
            if (!body) return { tag: 'body', attrs: '', children: [] };
            return buildNode(body, 0);
        });

        // ── Stats ──────────────────────────────────────────────────────────
        const avgStability = Math.round(enriched.reduce((s, e) => s + e.stabilityScore, 0) / (enriched.length || 1));
        const highRisk = enriched.filter(e => e.stabilityScore < 40).length;
        const withTestid = enriched.filter(e => e.testid).length;
        const withDynamic = enriched.filter(e => e.hasDynamicId || e.hasDynamicClasses).length;

        const tagDist = {};
        for (const e of enriched) tagDist[e.tag] = (tagDist[e.tag] || 0) + 1;
        const tagDistArr = Object.entries(tagDist).map(([t, c]) => ({ tag: t, count: c })).sort((a, b) => b.count - a.count).slice(0, 10);

        return {
            url, title,
            screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
            elements: enriched,
            tree,
            stats: { total: enriched.length, avgStability, highRisk, withTestid, withDynamic },
            tagDist: tagDistArr,
            analyzedAt: new Date().toISOString(),
        };
    } finally {
        await browser.close();
    }
}

module.exports = { analyzeDom };
