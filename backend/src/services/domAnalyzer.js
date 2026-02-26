/**
 * DOM Intelligence Engine — Inspectra AI
 * ─────────────────────────────────────────────────────────────────────────────
 * Intelligent page-understanding engine that infers behavior, risks, 
 * automation stability, and user interaction paths.
 */

const { chromium } = require('playwright');

/**
 * Main Intelligence Service
 */
async function analyzeDom(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        ignoreHTTPSErrors: true
    });
    const page = await context.newPage();

    try {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // Extra wait for dynamic apps
        await page.waitForTimeout(3000);

        const title = await page.title();
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 60, fullPage: true });

        const dims = await page.evaluate(() => ({
            w: document.documentElement.scrollWidth,
            h: document.documentElement.scrollHeight
        }));

        // 💎 THE ENGINE: Multi-Phase Analysis Execution
        const engineResult = await page.evaluate(() => {
            // --- Helper: Selector Generator and Stability Scorer ---
            function analyzeSelector(el) {
                let selector = '';
                let score = 100;
                let reason = 'Stable unique identifier';

                if (el.id && !/(\d{4,}|[0-9a-f]{8,})/.test(el.id)) {
                    selector = `#${el.id}`;
                    score = 100;
                } else if (el.getAttribute('aria-label')) {
                    selector = `[aria-label="${el.getAttribute('aria-label')}"]`;
                    score = 90;
                    reason = 'Semantic ARIA label';
                } else if (el.getAttribute('data-testid')) {
                    selector = `[data-testid="${el.getAttribute('data-testid')}"]`;
                    score = 100;
                    reason = 'Dedicated test ID';
                } else if (el.tagName === 'A' && el.innerText.trim().length > 2 && el.innerText.trim().length < 50) {
                    selector = `text="${el.innerText.trim()}"`;
                    score = 80;
                    reason = 'Text dependent selector';
                } else {
                    // Fallback to fragile selectors
                    const tag = el.tagName.toLowerCase();
                    const classes = Array.from(el.classList).filter(c => !/^(css-|jss|style-|sc-)/.test(c));
                    if (classes.length > 0) {
                        selector = `${tag}.${classes[0]}`;
                        score = 40;
                        reason = 'Fragile class-based selector';
                    } else {
                        selector = tag;
                        score = 20;
                        reason = 'Highest risk: generic tag selector';
                    }
                }

                // Penalize for common breaking patterns
                if (el.classList.value.match(/(\d{4,}|[0-9a-f]{8,})/)) {
                    score = Math.min(score, 30);
                    reason = 'Detected hashed/dynamic class names';
                }

                return { selector, stabilityScore: score, reason };
            }

            // --- 1. Structured DOM Extraction ---
            const allElements = document.querySelectorAll('body *');
            const nodes = [];
            const interactiveEls = [];

            // Limit analysis to visible elements for performance/clarity
            const sampledElements = Array.from(allElements).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
            });

            sampledElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const isClickable =
                    ['BUTTON', 'A', 'INPUT', 'SELECT'].includes(el.tagName) ||
                    el.getAttribute('role') === 'button' ||
                    el.getAttribute('onclick') ||
                    style.cursor === 'pointer';

                const nodeData = {
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    classes: Array.from(el.classList),
                    role: el.getAttribute('role'),
                    aria: {
                        label: el.getAttribute('aria-label'),
                        expanded: el.getAttribute('aria-expanded'),
                        hidden: el.getAttribute('aria-hidden')
                    },
                    text: (el.innerText || '').trim().slice(0, 100),
                    rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
                    isClickable,
                    type: el.tagName === 'INPUT' ? el.type : null,
                    isInNav: !!el.closest('nav'),
                    isInForm: !!el.closest('form')
                };

                if (isClickable) {
                    const selInfo = analyzeSelector(el);
                    interactiveEls.push({ ...nodeData, ...selInfo });
                }

                // Simplified tree-like structure (selective)
                if (['HEADER', 'NAV', 'MAIN', 'FOOTER', 'SECTION', 'FORM', 'UL', 'TABLE'].includes(el.tagName)) {
                    nodes.push(nodeData);
                }
            });

            // --- 2. Interaction Map ---
            const actions = [];
            interactiveEls.forEach(el => {
                let type = 'click';
                let importance = 50;
                const text = el.text.toLowerCase();

                if (text.includes('cart') || text.includes('buy') || text.includes('add')) {
                    type = 'add_to_cart';
                    importance = 100;
                } else if (el.tag === 'a' && el.isInNav) {
                    type = 'navigation';
                    importance = 70;
                } else if (el.type === 'search' || text.includes('search')) {
                    type = 'search';
                    importance = 80;
                } else if (el.isInForm && (el.tag === 'button' || el.type === 'submit')) {
                    type = 'submit_form';
                    importance = 90;
                }

                actions.push({ type, element: el, importanceScore: importance });
            });

            // --- 3. Page Understanding (Heuristics) ---
            const bodyText = document.body.innerText.toLowerCase();
            const inputs = document.querySelectorAll('input');
            let pageType = 'General Content';
            let goal = 'Information consumption';
            const criticalPath = [];

            const productCount = document.querySelectorAll('[class*="product"], [id*="product"]').length;
            const priceCount = (bodyText.match(/[$₹€£]\d+/g) || []).length;
            const cartButtons = actions.filter(a => a.type === 'add_to_cart').length;

            if (cartButtons > 0 || (productCount > 3 && priceCount > 2)) {
                pageType = 'E-commerce';
                goal = 'Product selection & purchase';
                criticalPath.push('Select product', 'Add to cart', 'Proceed to checkout');
            } else if (document.querySelector('nav') && document.querySelectorAll('[class*="card"], [class*="panel"]').length > 3) {
                pageType = 'Dashboard';
                goal = 'Data monitoring & management';
                criticalPath.push('Verify widgets', 'Navigate sections', 'Perform administrative actions');
            } else if (inputs.length > 2 && document.querySelector('form')) {
                pageType = 'Form / Entry';
                goal = 'Data submission';
                criticalPath.push('Fill required fields', 'Solve validation', 'Submit form');
            }

            // --- 4. Risk Analysis (with spatial data) ---
            const risks = [];

            // Layout shifts / Overlays
            const interactive = interactiveEls.slice(0, 10);
            interactive.forEach(el => {
                const centerEl = document.elementFromPoint(el.rect.x + el.rect.w / 2, el.rect.y + el.rect.h / 2);
                if (centerEl && !el.tag.includes(centerEl.tagName.toLowerCase())) {
                    risks.push({
                        type: 'Overlay Risk',
                        reason: `Potential invisible overlay covering ${el.tag}. May block automation clicks.`,
                        rect: el.rect,
                        severity: 'high'
                    });
                }
            });

            // Missing Labels (Spatial Capture)
            const unlabeled = Array.from(inputs).filter(i => !i.ariaLabel && !i.placeholder && !document.querySelector(`label[for="${i.id}"]`));
            unlabeled.forEach(i => {
                const r = i.getBoundingClientRect();
                risks.push({
                    type: 'Accessibility Gap',
                    reason: 'Input field lacks a semantic label or placeholder. Automation agents may fail to identify intent.',
                    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
                    severity: 'medium'
                });
            });

            // Empty Interactive Elements
            interactiveEls.forEach(el => {
                if ((el.tag === 'button' || el.tag === 'a') && !el.text && !el.aria.label) {
                    risks.push({
                        type: 'Empty Interaction',
                        reason: `Interactive ${el.tag} has no visible text or ARIA label. Impossible to target by intent.`,
                        rect: el.rect,
                        severity: 'high'
                    });
                }
            });

            // Page-Level Risks
            if (document.body.scrollHeight > window.innerHeight * 5) {
                risks.push({
                    type: 'Automation Hurdle',
                    reason: 'Infinite scroll detected — automation must implement virtual scrolling.',
                    severity: 'low'
                });
            }

            // --- 5. Metrics Calculation ---
            const avgStability = interactiveEls.length > 0 ? interactiveEls.reduce((acc, el) => acc + el.stabilityScore, 0) / interactiveEls.length : 80;
            const a11yScore = 100 - (unlabeled.length * 10);
            const reachability = 90; // Simplified

            const finalScore = (avgStability * 0.4) + (reachability * 0.3) + (a11yScore * 0.3);

            return {
                pageUnderstanding: {
                    pageType,
                    primaryGoal: goal,
                    criticalUserPath: criticalPath,
                    confidenceScore: 85
                },
                interactionMap: {
                    actions: actions.slice(0, 50),
                    groupedActions: {
                        'Add to Cart': actions.filter(a => a.type === 'add_to_cart').length,
                        'Navigation': actions.filter(a => a.type === 'navigation').length,
                        'Search': actions.filter(a => a.type === 'search').length,
                        'Forms': actions.filter(a => a.type === 'submit_form').length
                    }
                },
                selectorAnalysis: interactiveEls.slice(0, 30),
                risks: risks,
                metrics: {
                    stability: Math.round(avgStability),
                    reachability: Math.round(reachability),
                    accessibility: Math.round(a11yScore),
                    finalScore: Math.round(finalScore)
                },
                domTree: {
                    tag: 'body',
                    children: nodes.slice(0, 100)
                }
            };
        });

        return {
            success: true,
            ...engineResult,
            screenshot: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
            dimensions: dims,
            url,
            title
        };

    } catch (err) {
        console.error('[DOM Intelligence Engine Error]', err);
        return { success: false, error: err.message };
    } finally {
        await browser.close();
    }
}

module.exports = { analyzeDom };
