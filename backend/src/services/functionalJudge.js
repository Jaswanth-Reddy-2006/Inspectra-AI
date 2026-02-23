/**
 * Functional Judge — Autonomous Test Execution Engine
 * ─────────────────────────────────────────────────────
 * For each flow (Login / AddToCart / SubmitForm / Search) it:
 *   1. Generates a realistic action plan for the target URL
 *   2. Executes every step with Playwright
 *   3. Judges pass/warn/fail with confidence
 *   4. Produces a rich "why" explanation via the failure reasoning engine
 */

const { chromium } = require('playwright');

// ── Realistic test data ───────────────────────────────────────────────────────

const FAKE_DATA = {
    email: 'tester@inspectra.ai',
    password: 'Test@secure123',
    name: 'Alex Morgan',
    phone: '+1-555-0142',
    message: 'Hi, I am testing the contact form as part of an automated QA run. Please ignore this submission.',
    search: 'product quality assurance',
    address: '742 Evergreen Terrace, Springfield',
    card: '4111 1111 1111 1111',
    cvv: '123',
    expiry: '12/28',
};

// ── Flow definitions ──────────────────────────────────────────────────────────

const FLOW_DEFINITIONS = {
    login: {
        id: 'login',
        name: 'User Login',
        goal: 'Authenticate with valid credentials and verify successful session creation',
        icon: '🔐',
        color: '#6366f1',
        steps: [
            { action: 'navigate', label: 'Navigate to page', selector: null, value: null, verify: null },
            { action: 'detect', label: 'Detect login form', selector: 'form, [data-testid*=login]', value: null, verify: 'presence' },
            { action: 'fill', label: 'Fill email field', selector: 'input[type=email], input[name*=email], input[id*=email], input[placeholder*=email i]', value: FAKE_DATA.email, verify: 'value' },
            { action: 'fill', label: 'Fill password field', selector: 'input[type=password]', value: FAKE_DATA.password, verify: 'value' },
            { action: 'click', label: 'Click sign-in button', selector: 'button[type=submit], input[type=submit], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")', value: null, verify: null },
            { action: 'waitNav', label: 'Wait for navigation/session', selector: null, value: null, verify: null },
            { action: 'verify', label: 'Verify session established', selector: '[data-testid*=avatar], [data-testid*=user], nav .user, .user-menu, .avatar, .profile-pic, [href*=logout], a:has-text("Logout"), a:has-text("Sign out")', value: null, verify: 'presence' },
        ],
    },

    addToCart: {
        id: 'addToCart',
        name: 'Add to Cart',
        goal: 'Find a purchasable product and add it to the shopping cart',
        icon: '🛒',
        color: '#f59e0b',
        steps: [
            { action: 'navigate', label: 'Navigate to page', selector: null, value: null, verify: null },
            { action: 'detect', label: 'Detect product grid / list', selector: '.product, [class*=product], [class*=card], article, [data-product], [itemtype*=Product]', value: null, verify: 'presence' },
            { action: 'click', label: 'Open first product', selector: '.product a, [class*=product] a, [class*=card] a, article a', value: null, verify: null },
            { action: 'waitNav', label: 'Product detail page loaded', selector: null, value: null, verify: null },
            { action: 'detect', label: 'Detect add-to-cart button', selector: 'button:has-text("Add to cart"), button:has-text("Add to Cart"), button:has-text("Buy now"), [data-testid*=cart], [id*=addtocart], .add-to-cart', value: null, verify: 'presence' },
            { action: 'click', label: 'Click add-to-cart', selector: 'button:has-text("Add to cart"), button:has-text("Add to Cart"), button:has-text("Buy now"), [data-testid*=cart], .add-to-cart', value: null, verify: null },
            { action: 'verify', label: 'Verify cart updated', selector: '[data-testid*=cart-count], .cart-count, [aria-label*=cart], .cart-badge, [class*=cart-item], .minicart, [href*=cart]', value: null, verify: 'presence' },
        ],
    },

    submitForm: {
        id: 'submitForm',
        name: 'Submit Contact Form',
        goal: 'Fill and submit a contact/enquiry form and verify success confirmation',
        icon: '📋',
        color: '#10b981',
        steps: [
            { action: 'navigate', label: 'Navigate to page', selector: null, value: null, verify: null },
            { action: 'detect', label: 'Locate contact / enquiry form', selector: 'form, [data-testid*=form], [id*=contact], [class*=contact-form]', value: null, verify: 'presence' },
            { action: 'fillFirst', label: 'Fill name field', selector: 'input[name*=name i], input[placeholder*=name i], input[id*=name i]', value: FAKE_DATA.name, verify: 'value' },
            { action: 'fillFirst', label: 'Fill email field', selector: 'input[type=email], input[name*=email i], input[placeholder*=email i]', value: FAKE_DATA.email, verify: 'value' },
            { action: 'fillFirst', label: 'Fill message / textarea', selector: 'textarea, [name*=message i], [placeholder*=message i]', value: FAKE_DATA.message, verify: 'value' },
            { action: 'click', label: 'Submit form', selector: 'button[type=submit], input[type=submit], button:has-text("Send"), button:has-text("Submit")', value: null, verify: null },
            { action: 'verify', label: 'Verify success message shown', selector: '[class*=success], [class*=thank], [class*=confirmation], p:has-text("thank"), p:has-text("success"), div:has-text("Thank you"), div:has-text("message received")', value: null, verify: 'presence' },
        ],
    },

    search: {
        id: 'search',
        name: 'Site Search',
        goal: 'Locate the search feature, enter a query, and verify results are returned',
        icon: '🔍',
        color: '#0ea5e9',
        steps: [
            { action: 'navigate', label: 'Navigate to page', selector: null, value: null, verify: null },
            { action: 'detect', label: 'Detect search input', selector: 'input[type=search], input[name=q], input[name=search], input[placeholder*=search i], [role=searchbox], [aria-label*=search i]', value: null, verify: 'presence' },
            { action: 'fill', label: 'Enter search query', selector: 'input[type=search], input[name=q], input[name=search], input[placeholder*=search i], [role=searchbox]', value: FAKE_DATA.search, verify: 'value' },
            { action: 'submit', label: 'Submit search (Enter / btn)', selector: 'input[type=search], [role=searchbox], input[name=q]', value: null, verify: null },
            { action: 'waitNav', label: 'Results page loaded', selector: null, value: null, verify: null },
            { action: 'verify', label: 'Verify results rendered', selector: '[class*=result], [class*=search-result], article, .product, li[class*=item], [data-testid*=result]', value: null, verify: 'count' },
        ],
    },
};

// ── Failure reasoning engine ──────────────────────────────────────────────────

function buildFailureReason(step, errorMsg, context = {}) {
    const reasons = {
        not_found: [],
        action_failed: [],
        verify_failed: [],
        timeout: [],
        nav_failed: [],
    };

    const msg = (errorMsg || '').toLowerCase();
    const sel = step.selector || '';

    // Timeout patterns
    if (msg.includes('timeout') || msg.includes('exceeded')) {
        return {
            code: 'TIMEOUT',
            title: 'Element Wait Timeout',
            why: `The selector "${sel.slice(0, 80)}" was not found within the timeout period. This usually means the element doesn't exist on this page, is inside a shadow DOM, or requires a logged-in state to appear.`,
            suggestions: [
                'Verify the page loads the element within 10s',
                'Check if the element is inside an iframe or shadow DOM',
                'Ensure the page does not require authentication to show this element',
            ],
            category: 'Not Found',
        };
    }

    // Navigation failures
    if (msg.includes('net::') || msg.includes('navigation') || msg.includes('failed to navigate')) {
        return {
            code: 'NAV_FAILED',
            title: 'Page Navigation Failed',
            why: `The browser could not load the target URL. The server may be offline, returning a non-2xx status, or blocking headless browser traffic.`,
            suggestions: [
                'Check the URL is accessible in a real browser',
                'Look for Cloudflare or bot-protection blocking headless Chrome',
                'Ensure the backend is running and reachable',
            ],
            category: 'Navigation',
        };
    }

    // Element not clickable / intercepted
    if (msg.includes('intercept') || msg.includes('is not clickable') || msg.includes('covered')) {
        return {
            code: 'ELEMENT_COVERED',
            title: 'Element Intercepted by Overlay',
            why: `A click on "${sel.slice(0, 60)}" was intercepted. A modal, cookie banner, or sticky navbar is likely covering the target element.`,
            suggestions: [
                'Dismiss any cookie consent banners before clicking',
                'Scroll the element into view before click',
                'Check for overlapping modals or popups',
            ],
            category: 'Interaction',
        };
    }

    // Strict mode multiple elements
    if (msg.includes('strict mode') || msg.includes('multiple elements')) {
        return {
            code: 'AMBIGUOUS_SELECTOR',
            title: 'Ambiguous Selector — Multiple Matches',
            why: `The selector "${sel.slice(0, 80)}" matched more than one element. The judge's broad selectors are intentional for discovery, but this page has multiple matching elements causing ambiguity.`,
            suggestions: [
                'This is a selector breadth issue, not necessarily a bug in your app',
                'The element exists — consider this a partial pass',
                'Use data-testid attributes on interactive elements for determinism',
            ],
            category: 'Selector',
        };
    }

    // Verification failure (element present but count=0 or wrong)
    if (step.action === 'verify' || step.verify === 'presence') {
        return {
            code: 'VERIFICATION_FAILED',
            title: 'Expected Element Not Present After Action',
            why: context.prevStepFailed
                ? `The verification step failed because a preceding step (${context.prevStepLabel}) also failed. The application never reached the state where this element would appear.`
                : `After completing the action, the expected success indicator ("${sel.slice(0, 80)}") was not found in the DOM. The operation may have failed silently, or the success state uses different markup than expected.`,
            suggestions: context.prevStepFailed
                ? ['Fix the failing step above first — this failure is a cascade']
                : [
                    'Check server response / network tab for error responses',
                    'Look for inline validation errors in the form',
                    'The success state may use a different CSS class or text than the selector expects',
                ],
            category: 'Verification',
        };
    }

    // Generic fallback
    return {
        code: 'STEP_FAILED',
        title: 'Step Execution Failed',
        why: errorMsg
            ? `Playwright threw: "${errorMsg.slice(0, 150)}". The step could not complete as expected.`
            : `The step "${step.label}" did not produce the expected outcome. The element was located but the interaction or state change did not succeed.`,
        suggestions: [
            'Open DevTools and manually verify the selector works',
            'Check for JavaScript errors that may block interaction',
            'Ensure the target page has not changed its structure',
        ],
        category: 'Runtime',
    };
}

// ── Step executor ─────────────────────────────────────────────────────────────

async function executeStep(page, stepDef, baseUrl) {
    const start = Date.now();
    const result = {
        label: stepDef.label,
        action: stepDef.action,
        selector: stepDef.selector,
        value: stepDef.value ? stepDef.value.slice(0, 40) + (stepDef.value.length > 40 ? '…' : '') : null,
        verdict: 'pass',
        durationMs: 0,
        screenshot: null,
        reason: null,
        detail: null,
    };

    try {
        const TIMEOUT = 8000;

        switch (stepDef.action) {

            case 'navigate':
                await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await page.waitForTimeout(800);
                result.detail = `Loaded: ${await page.title() || baseUrl}`;
                break;

            case 'detect': {
                const loc = page.locator(stepDef.selector).first();
                await loc.waitFor({ state: 'visible', timeout: TIMEOUT });
                const count = await page.locator(stepDef.selector).count();
                result.detail = `Found ${count} matching element(s)`;
                break;
            }

            case 'fill': {
                const loc = page.locator(stepDef.selector).first();
                await loc.waitFor({ state: 'visible', timeout: TIMEOUT });
                await loc.click({ timeout: 3000 });
                await loc.fill(stepDef.value, { timeout: 3000 });
                result.detail = `Filled with: ${result.value}`;
                break;
            }

            case 'fillFirst': {
                // Try each comma-separated sub-selector until one works
                const sels = stepDef.selector.split(',').map(s => s.trim());
                let filled = false;
                for (const s of sels) {
                    try {
                        const el = page.locator(s).first();
                        const cnt = await page.locator(s).count();
                        if (cnt === 0) continue;
                        await el.waitFor({ state: 'visible', timeout: 2500 });
                        await el.click({ timeout: 2000 });
                        await el.fill(stepDef.value, { timeout: 2000 });
                        filled = true;
                        result.detail = `Filled "${s}" with: ${result.value}`;
                        break;
                    } catch { }
                }
                if (!filled) throw new Error(`No matching field found for selectors: ${stepDef.selector.slice(0, 80)}`);
                break;
            }

            case 'click': {
                const sels = stepDef.selector.split(',').map(s => s.trim());
                let clicked = false;
                for (const s of sels) {
                    try {
                        const el = page.locator(s).first();
                        const cnt = await page.locator(s).count();
                        if (cnt === 0) continue;
                        await el.waitFor({ state: 'visible', timeout: 3000 });
                        await el.click({ timeout: 3000 });
                        clicked = true;
                        result.detail = `Clicked: ${s.slice(0, 60)}`;
                        break;
                    } catch { }
                }
                if (!clicked) throw new Error(`No clickable element found for: ${stepDef.selector.slice(0, 80)}`);
                break;
            }

            case 'submit': {
                const el = page.locator(stepDef.selector).first();
                await el.waitFor({ state: 'visible', timeout: TIMEOUT });
                await el.press('Enter');
                result.detail = 'Pressed Enter to submit';
                break;
            }

            case 'waitNav':
                try {
                    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 });
                } catch { /* Page may not navigate — soft step */ }
                await page.waitForTimeout(600);
                result.detail = `URL: ${page.url().slice(0, 80)}`;
                break;

            case 'verify': {
                const sels = stepDef.selector.split(',').map(s => s.trim());
                let found = false;
                let count = 0;
                for (const s of sels) {
                    const c = await page.locator(s).count();
                    if (c > 0) { found = true; count = c; break; }
                }
                if (stepDef.verify === 'count' && count === 0) {
                    throw new Error('No result items found after search');
                }
                if (stepDef.verify === 'presence' && !found) {
                    throw new Error(`Expected element not found: ${stepDef.selector.slice(0, 80)}`);
                }
                result.detail = `Verified: ${count} element(s) present`;
                break;
            }
        }

        result.verdict = 'pass';
    } catch (err) {
        result.verdict = 'fail';
        result.reason = buildFailureReason(stepDef, err.message);
        result.detail = err.message?.slice(0, 120) || 'Unknown error';
    }

    result.durationMs = Date.now() - start;

    // Capture screenshot for failed/important steps
    try {
        if (result.verdict === 'fail' || stepDef.action === 'navigate' || stepDef.action === 'verify') {
            const buf = await page.screenshot({
                type: 'jpeg', quality: 45,
                clip: { x: 0, y: 0, width: 1280, height: 720 }
            });
            result.screenshot = `data:image/jpeg;base64,${buf.toString('base64')}`;
        }
    } catch { }

    return result;
}

// ── Flow runner ───────────────────────────────────────────────────────────────

async function runFlow(flowId, targetUrl, onStep) {
    const def = FLOW_DEFINITIONS[flowId];
    if (!def) throw new Error(`Unknown flow: ${flowId}`);

    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);

    const stepResults = [];
    let prevFailed = false;
    let prevLabel = '';

    try {
        for (const stepDef of def.steps) {
            // Pass cascade context into the reason builder
            const enriched = { ...stepDef };
            const raw = await executeStep(page, enriched, targetUrl);

            // Enrich failure with cascade context
            if (raw.verdict === 'fail' && raw.reason && prevFailed) {
                raw.reason.cascade = true;
                raw.reason.cascadeFrom = prevLabel;
            }

            stepResults.push(raw);
            if (onStep) onStep(raw, stepResults.length);

            prevFailed = raw.verdict === 'fail';
            prevLabel = raw.label;

            // Stop early if navigation totally failed
            if (stepDef.action === 'navigate' && raw.verdict === 'fail') break;
        }
    } finally {
        await browser.close();
    }

    // ── Compute flow verdict ─────────────────────────────────────────────────

    const failCount = stepResults.filter(s => s.verdict === 'fail').length;
    const passCount = stepResults.filter(s => s.verdict === 'pass').length;
    const total = stepResults.length;

    let verdict, confidence;
    if (failCount === 0) {
        verdict = 'pass';
        confidence = 92 + Math.min(7, passCount);
    } else if (failCount <= 1 && passCount >= total - 1) {
        verdict = 'warn';
        confidence = 55 + Math.round(passCount / total * 30);
    } else {
        verdict = 'fail';
        confidence = Math.max(20, Math.round((passCount / total) * 70));
    }

    // Overall reasoning
    const firstFail = stepResults.find(s => s.verdict === 'fail');
    let overallReason = null;
    if (verdict !== 'pass' && firstFail?.reason) {
        overallReason = {
            ...firstFail.reason,
            step: firstFail.label,
            cascade: stepResults.filter(s => s.verdict === 'fail').length > 1,
        };
    }

    return {
        flowId,
        name: def.name,
        goal: def.goal,
        icon: def.icon,
        color: def.color,
        url: targetUrl,
        verdict,
        confidence,
        durationMs: stepResults.reduce((s, r) => s + (r.durationMs || 0), 0),
        steps: stepResults,
        overallReason,
        passCount,
        failCount,
        totalSteps: total,
        executedAt: new Date().toISOString(),
    };
}

// ── Batch runner ─────────────────────────────────────────────────────────────

async function runAllFlows(targetUrl, flowIds, onFlowComplete, onStepUpdate) {
    const results = [];
    const ids = flowIds && flowIds.length > 0
        ? flowIds
        : Object.keys(FLOW_DEFINITIONS);

    for (const flowId of ids) {
        try {
            const result = await runFlow(flowId, targetUrl, (step, stepNum) => {
                if (onStepUpdate) onStepUpdate(flowId, step, stepNum);
            });
            results.push(result);
            if (onFlowComplete) onFlowComplete(result);
        } catch (err) {
            const errResult = {
                flowId,
                name: FLOW_DEFINITIONS[flowId]?.name || flowId,
                icon: FLOW_DEFINITIONS[flowId]?.icon || '❓',
                color: FLOW_DEFINITIONS[flowId]?.color || '#64748b',
                goal: FLOW_DEFINITIONS[flowId]?.goal || '',
                url: targetUrl,
                verdict: 'fail',
                confidence: 0,
                durationMs: 0,
                steps: [],
                totalSteps: 0,
                passCount: 0,
                failCount: 0,
                overallReason: buildFailureReason({ action: 'navigate', selector: null }, err.message),
                executedAt: new Date().toISOString(),
            };
            results.push(errResult);
            if (onFlowComplete) onFlowComplete(errResult);
        }
    }

    return results;
}

module.exports = { runAllFlows, runFlow, FLOW_DEFINITIONS };
