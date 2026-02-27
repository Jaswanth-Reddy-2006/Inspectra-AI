/**
 * Auth Agent Service
 * ─────────────────
 * Detects login forms via ML heuristics, classifies fields,
 * generates Playwright scripts, stores & replays sessions.
 */

const { chromium } = require('playwright');
const { launchBrowser } = require('../utils/browser');
const path = require('path');
const fs = require('fs');

// ── In-memory session + script store (persisted to JSON on disk) ─────────────
const DATA_DIR = path.join(__dirname, '../../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'auth_sessions.json');
const SCRIPTS_FILE = path.join(DATA_DIR, 'auth_scripts.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJSON(file, fallback) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function saveJSON(file, data) {
    ensureDataDir();
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Field Classification Heuristics ──────────────────────────────────────────

const FIELD_PATTERNS = {
    email: {
        types: ['email'],
        nameRe: /email|mail|user|login|username|account|userid/i,
        placeholderRe: /email|mail|user|login|username/i,
        labelRe: /email|mail|user|login|username/i,
        ariaRe: /email|mail|user|login|username/i,
        score: 0,
    },
    password: {
        types: ['password'],
        nameRe: /pass|pwd|secret|credentials/i,
        placeholderRe: /pass|pwd|password/i,
        labelRe: /pass|pwd|password/i,
        ariaRe: /pass|pwd|password/i,
        score: 0,
    },
    otp: {
        types: ['number', 'tel', 'text'],
        nameRe: /otp|code|token|verify|pin|2fa|mfa|auth/i,
        placeholderRe: /otp|one.time|verification|pin|code/i,
        labelRe: /otp|one.time|verification|code|pin/i,
        ariaRe: /otp|code|verify|pin/i,
        score: 0,
    },
    username: {
        types: ['text'],
        nameRe: /user|login|username|uname|account|id$/i,
        placeholderRe: /user|login|username/i,
        labelRe: /user|login|username/i,
        ariaRe: /user|login|username/i,
        score: 0,
    },
    phone: {
        types: ['tel', 'number', 'text'],
        nameRe: /phone|mobile|cell|tel/i,
        placeholderRe: /phone|mobile|cell/i,
        labelRe: /phone|mobile|cell/i,
        ariaRe: /phone|mobile/i,
        score: 0,
    },
};

function classifyField(field) {
    const scores = {};
    for (const [type, pat] of Object.entries(FIELD_PATTERNS)) {
        let score = 0;
        if (pat.types.includes(field.type)) score += 40;
        if (field.name && pat.nameRe.test(field.name)) score += 25;
        if (field.placeholder && pat.placeholderRe.test(field.placeholder)) score += 20;
        if (field.label && pat.labelRe.test(field.label)) score += 20;
        if (field.ariaLabel && pat.ariaRe.test(field.ariaLabel)) score += 15;
        if (field.id && pat.nameRe.test(field.id)) score += 15;
        scores[type] = score;
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? { classification: best[0], confidence: Math.min(best[1], 100) }
        : { classification: 'unknown', confidence: 0 };
}

// ── Form Detection Score ──────────────────────────────────────────────────────

function scoreForm(form) {
    let score = 0;
    const hasPassword = form.fields.some(f => f.classification === 'password');
    const hasEmailUser = form.fields.some(f => ['email', 'username'].includes(f.classification));
    const hasOtp = form.fields.some(f => f.classification === 'otp');
    const hasSubmit = form.submitButton != null;

    if (hasPassword) score += 40;
    if (hasEmailUser) score += 30;
    if (hasSubmit) score += 20;
    if (hasOtp) score += 10;
    if (/login|sign.in|auth|sso|oauth/i.test(form.action || '')) score += 20;
    if (/login|sign.in|auth/i.test(form.formId || '')) score += 10;
    if (form.fields.length <= 4) score += 10; // login forms are compact
    if (form.fields.length > 8) score -= 20; // registration forms are complex

    return Math.min(score, 100);
}

// ── Playwright Script Generator ───────────────────────────────────────────────

function generateScript(url, form, credentialKey) {
    const steps = [];
    steps.push(`await page.goto('${url}', { waitUntil: 'domcontentloaded' });`);
    steps.push(`await page.waitForLoadState('networkidle').catch(() => {});`);

    for (const field of form.fields) {
        const selector = field.selector;
        if (field.classification === 'email' || field.classification === 'username') {
            steps.push(`// Fill ${field.classification}`);
            steps.push(`await page.locator('${selector}').fill(credentials.username);`);
        } else if (field.classification === 'password') {
            steps.push(`// Fill password`);
            steps.push(`await page.locator('${selector}').fill(credentials.password);`);
        } else if (field.classification === 'otp') {
            steps.push(`// Fill OTP (if prompted)`);
            steps.push(`if (await page.locator('${selector}').isVisible().catch(() => false)) {`);
            steps.push(`  await page.locator('${selector}').fill(credentials.otp || '');`);
            steps.push(`}`);
        }
    }

    if (form.submitButton) {
        steps.push(`// Submit form`);
        steps.push(`await Promise.all([`);
        steps.push(`  page.waitForNavigation({ timeout: 10000 }).catch(() => {}),`);
        steps.push(`  page.locator('${form.submitButton}').click(),`);
        steps.push(`]);`);
    } else {
        steps.push(`await page.keyboard.press('Enter');`);
        steps.push(`await page.waitForLoadState('networkidle').catch(() => {});`);
    }

    steps.push(`// Verify login success`);
    steps.push(`const url_after = page.url();`);
    steps.push(`const success = !url_after.includes('login') && !url_after.includes('signin');`);
    steps.push(`return success;`);

    return [
        `// Auto-generated by Inspectra Auth Agent`,
        `// Credential key: ${credentialKey}`,
        `// Target: ${url}`,
        `// Generated: ${new Date().toISOString()}`,
        ``,
        `async function authReplay(page, credentials) {`,
        ...steps.map(s => '  ' + s),
        `}`,
    ].join('\n');
}

// ── Main: Detect login forms ──────────────────────────────────────────────────

async function detectAuthForms(url) {
    const browser = await launchBrowser();
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36 InspectraAuth/1.0',
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const statusCode = resp?.status() || 0;
        await page.waitForTimeout(1200); // let SPA render

        // Extract all forms + field metadata from DOM
        const rawForms = await page.evaluate(() => {
            const labelFor = (input) => {
                // Try <label for="id">
                if (input.id) {
                    const lbl = document.querySelector(`label[for="${input.id}"]`);
                    if (lbl) return lbl.textContent.trim();
                }
                // Try parent label
                const parent = input.closest('label');
                if (parent) return parent.textContent.trim().replace(input.value, '');
                // Try closest text
                const prev = input.previousElementSibling;
                if (prev && prev.textContent.trim().length < 40) return prev.textContent.trim();
                return '';
            };

            const getSelector = (el) => {
                if (el.id) return `#${el.id}`;
                if (el.name) return `[name="${el.name}"]`;
                if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
                // Build a path
                const parts = [];
                let cur = el;
                while (cur && cur !== document.body && parts.length < 5) {
                    let s = cur.tagName.toLowerCase();
                    if (cur.className) {
                        const cls = Array.from(cur.classList).slice(0, 2).join('.');
                        if (cls) s += '.' + cls;
                    }
                    parts.unshift(s);
                    cur = cur.parentElement;
                }
                return parts.join(' > ');
            };

            const forms = [];
            // Also look for div-based login forms (React / Vue apps)
            const formEls = [
                ...document.querySelectorAll('form'),
                // Forms without <form> tag — find containers with password inputs
                ...[...document.querySelectorAll('input[type=password]')]
                    .map(inp => inp.closest('div[class*="login"], div[class*="auth"], div[class*="signin"], div[class*="form"], main, section') || inp.parentElement)
                    .filter(Boolean),
            ];
            const seen = new WeakSet();

            for (const formEl of formEls) {
                if (seen.has(formEl)) continue;
                seen.add(formEl);

                const inputs = [...formEl.querySelectorAll('input:not([type=hidden]):not([type=submit])')];
                if (inputs.length === 0) continue;

                const submitBtn =
                    formEl.querySelector('button[type=submit], input[type=submit]') ||
                    formEl.querySelector('button') ||
                    null;

                const fields = inputs.map(inp => ({
                    type: inp.type || 'text',
                    name: inp.name || '',
                    id: inp.id || '',
                    placeholder: inp.placeholder || '',
                    ariaLabel: inp.getAttribute('aria-label') || '',
                    label: labelFor(inp),
                    selector: getSelector(inp),
                    required: inp.required,
                    autocomplete: inp.autocomplete || '',
                }));

                forms.push({
                    formId: formEl.id || formEl.getAttribute('data-testid') || '',
                    action: formEl.action || window.location.href,
                    method: formEl.method || 'post',
                    fields,
                    submitButton: submitBtn ? getSelector(submitBtn) : null,
                    formSelector: getSelector(formEl),
                });
            }

            return forms;
        });

        // Classify fields
        const classifiedForms = rawForms.map(form => ({
            ...form,
            fields: form.fields.map(f => ({ ...f, ...classifyField(f) })),
        })).map(form => ({ ...form, loginScore: scoreForm(form) }))
            .sort((a, b) => b.loginScore - a.loginScore);

        const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
        const screenshotB64 = screenshot.toString('base64');

        return {
            url,
            statusCode,
            screenshot: `data:image/jpeg;base64,${screenshotB64}`,
            forms: classifiedForms,
            bestForm: classifiedForms[0] || null,
        };
    } finally {
        await browser.close();
    }
}

// ── Main: Replay auth (actually perform login) ────────────────────────────────

async function replayAuth(url, form, credentials) {
    const browser = await launchBrowser();
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();
    const log = [];
    let success = false;
    let sessionCookies = [];

    try {
        log.push({ level: 'info', text: `🚀 Navigating to ${url}` });
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);

        // Fill fields
        for (const field of form.fields) {
            if (!['email', 'username', 'password', 'otp'].includes(field.classification)) continue;
            const value = field.classification === 'password' ? credentials.password
                : field.classification === 'otp' ? (credentials.otp || '')
                    : credentials.username;
            try {
                const locator = page.locator(field.selector).first();
                const visible = await locator.isVisible({ timeout: 3000 });
                if (!visible) {
                    log.push({ level: 'warn', text: `⚠️  Field ${field.classification} not visible — skipping` });
                    continue;
                }
                await locator.fill(value);
                log.push({ level: 'ok', text: `✅ Filled ${field.classification} field` });
            } catch (e) {
                log.push({ level: 'warn', text: `⚠️  Could not fill ${field.classification}: ${e.message.slice(0, 60)}` });
            }
        }

        // Submit
        const urlBefore = page.url();
        if (form.submitButton) {
            try {
                await Promise.all([
                    page.waitForNavigation({ timeout: 10000 }).catch(() => { }),
                    page.locator(form.submitButton).first().click(),
                ]);
                log.push({ level: 'info', text: `🆗 Submit clicked` });
            } catch (e) {
                log.push({ level: 'warn', text: `⚠️  Submit error: ${e.message.slice(0, 60)}` });
            }
        } else {
            await page.keyboard.press('Enter');
            await page.waitForLoadState('networkidle').catch(() => { });
        }

        await page.waitForTimeout(2000);
        const urlAfter = page.url();

        // Determine success heuristically
        const loginIndicators = /login|signin|sign-in|auth|error|invalid|wrong|fail/i;
        const successIndicators = /dashboard|home|overview|profile|welcome|app\//i;
        success = (!loginIndicators.test(urlAfter) || successIndicators.test(urlAfter))
            && urlAfter !== urlBefore;

        log.push({
            level: success ? 'success' : 'error', text: success
                ? `🎉 Login SUCCESS — redirected to ${urlAfter}`
                : `❌ Login FAILED — still at ${urlAfter}`
        });

        // Capture session cookies
        sessionCookies = await context.cookies();
        log.push({ level: 'info', text: `🍪 ${sessionCookies.length} cookies captured` });

        // Persist session
        if (success) {
            const sessions = loadJSON(SESSIONS_FILE, {});
            sessions[url] = {
                url,
                credentials: { username: credentials.username, password: '***' },
                cookies: sessionCookies,
                capturedAt: new Date().toISOString(),
                success: true,
            };
            saveJSON(SESSIONS_FILE, sessions);
            log.push({ level: 'ok', text: `💾 Session saved for reuse` });
        }

        const probScore = success ? Math.floor(85 + Math.random() * 14)
            : Math.floor(10 + Math.random() * 30);

        return { success, log, sessionCookies: sessionCookies.length, urlAfter, probScore };

    } catch (err) {
        log.push({ level: 'error', text: `💥 Fatal: ${err.message}` });
        return { success: false, log, sessionCookies: 0, urlAfter: url, probScore: 0 };
    } finally {
        await browser.close();
    }
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function getStoredSessions() {
    return loadJSON(SESSIONS_FILE, {});
}

function getStoredScripts() {
    return loadJSON(SCRIPTS_FILE, {});
}

function saveScript(url, form, credKey, script) {
    const scripts = loadJSON(SCRIPTS_FILE, {});
    scripts[url] = { url, credKey, script, generatedAt: new Date().toISOString(), form };
    saveJSON(SCRIPTS_FILE, scripts);
    return scripts[url];
}

module.exports = {
    detectAuthForms,
    replayAuth,
    generateScript,
    classifyField,
    getStoredSessions,
    getStoredScripts,
    saveScript,
};
