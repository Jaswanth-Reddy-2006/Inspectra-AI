/**
 * Page Classifier Service — Inspectra AI
 * ──────────────────────────────────────
 * Hybrid ML classification pipeline:
 *   1. Launch Playwright → extract feature vector from DOM
 *   2. Run weighted rule engine → score each of 8 page types
 *   3. Return best type + confidence + full feature vector
 *   4. Persist result to JSON store
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ── Persistence ───────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'classified_pages.json');

function ensureDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function loadStore() {
    try { return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')); } catch { return {}; }
}
function saveStore(data) {
    ensureDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
}

// ── Page Type Definitions ─────────────────────────────────────────────────────

const PAGE_TYPES = ['Home', 'Listing', 'Form', 'Product', 'Checkout', 'Dashboard', 'Wizard', 'Modal'];

// ── Feature Extraction ────────────────────────────────────────────────────────

/**
 * Extracts a rich feature vector from a live Playwright page.
 * All extraction runs inside page.evaluate() in the browser context.
 */
async function extractFeatures(page, url) {
    return await page.evaluate((pageUrl) => {
        const doc = document;
        const body = doc.body;
        const text = body?.innerText || '';
        const html = body?.innerHTML || '';

        // ── DOM Density ───────────────────────────────────────────────────────
        const totalElements = doc.querySelectorAll('*').length;
        const divCount = doc.querySelectorAll('div').length;
        const sectionCount = doc.querySelectorAll('section, article').length;

        // ── Forms & Inputs ────────────────────────────────────────────────────
        const forms = doc.querySelectorAll('form');
        const inputs = doc.querySelectorAll('input:not([type=hidden]), textarea, select');
        const formCount = forms.length;
        const inputCount = inputs.length;
        const passwordInputs = doc.querySelectorAll('input[type=password]').length;
        const emailInputs = doc.querySelectorAll('input[type=email]').length;
        const checkboxCount = doc.querySelectorAll('input[type=checkbox]').length;
        const radioCount = doc.querySelectorAll('input[type=radio]').length;
        const textareaCount = doc.querySelectorAll('textarea').length;

        // ── Repeating Card Patterns ───────────────────────────────────────────
        // Detect repeated sibling-like elements (product/listing cards)
        const cardSelectors = [
            '[class*=card]', '[class*=item]', '[class*=product]',
            '[class*=tile]', '[class*=grid-item]', '[class*=listing]',
            'li', 'article',
        ];
        let repeatingCards = 0;
        for (const sel of cardSelectors) {
            const matches = doc.querySelectorAll(sel);
            if (matches.length > repeatingCards) repeatingCards = matches.length;
        }
        // Only count "real" repeating cards (not trivial list items)
        const realCards = repeatingCards > 3 ? repeatingCards : 0;

        // ── Price Patterns ────────────────────────────────────────────────────
        const priceRe = /(\$|€|£|¥|₹)\s*\d+([.,]\d+)?|\d+([.,]\d+)?\s*(\$|€|£|¥|₹)/g;
        const priceMatches = (text.match(priceRe) || []).length;
        const hasPriceText = priceMatches > 0 ||
            /price|mrp|cost|usd|eur|gbp/i.test(text.slice(0, 5000));

        // ── Button Keywords ───────────────────────────────────────────────────
        const buttons = [...doc.querySelectorAll('button, [role=button], a.btn, input[type=submit]')];
        const btnText = buttons.map(b => b.innerText?.toLowerCase() || '').join(' ');
        const hasAddToCart = /add.to.cart|buy.now|add to bag|purchase/i.test(btnText);
        const hasCheckout = /checkout|proceed|place.order|pay.now|complete.order/i.test(btnText);
        const hasLoginBtn = /log.?in|sign.?in|authenticate/i.test(btnText);
        const hasRegisterBtn = /sign.?up|register|create.account/i.test(btnText);
        const hasNextPrev = /next|previous|step|continue|back/i.test(btnText);
        const hasSubmit = /submit|save|update|confirm|apply|done/i.test(btnText);
        const hasCTA = /get.started|try.free|learn.more|join.now|start/i.test(btnText);
        const hasFilter = /filter|sort|search|category/i.test(btnText);

        // ── Navigation ────────────────────────────────────────────────────────
        const navLinks = doc.querySelectorAll('nav a, header a').length;
        const allLinks = doc.querySelectorAll('a[href]').length;
        const breadcrumbs = doc.querySelectorAll('[class*=breadcrumb], [aria-label*=breadcrumb]').length;

        // ── Charts / Tables / Media ───────────────────────────────────────────
        const tableCount = doc.querySelectorAll('table').length;
        const chartCount = doc.querySelectorAll('canvas, svg[class*=chart], [class*=recharts], [class*=chart-]').length;
        const imageCount = doc.querySelectorAll('img').length;
        const videoCount = doc.querySelectorAll('video').length;
        const heroImage = doc.querySelectorAll('[class*=hero], [class*=banner], [class*=jumbotron]').length;

        // ── Steps / Wizard Signals ────────────────────────────────────────────
        const stepEls = doc.querySelectorAll(
            '[class*=step], [class*=wizard], [class*=progress-step], [role=progressbar]'
        ).length;
        const hasStepNumbers = /step\s*\d|stage\s*\d|\d\s*of\s*\d/i.test(text.slice(0, 3000));

        // ── Modal Signals ─────────────────────────────────────────────────────
        const modalEls = doc.querySelectorAll('[role=dialog], [class*=modal], [class*=dialog], [class*=overlay]').length;
        const hasModalOpen = doc.querySelectorAll('[class*=modal][class*=open], [class*=modal][class*=show], [class*=dialog][class*=open]').length;

        // ── Page Title / URL Signals ──────────────────────────────────────────
        const titleText = doc.title.toLowerCase();
        const metaDesc = (doc.querySelector('meta[name=description]')?.content || '').toLowerCase();
        const pagePath = pageUrl.toLowerCase();

        // ── Sidebar / Dashboard ───────────────────────────────────────────────
        const sidebarCount = doc.querySelectorAll('aside, [class*=sidebar], [class*=side-nav]').length;
        const statCards = doc.querySelectorAll('[class*=stat], [class*=metric], [class*=kpi], [class*=widget]').length;
        const headerCount = doc.querySelectorAll('h1,h2,h3').length;

        // ── Text signals ──────────────────────────────────────────────────────
        const lowerText = text.slice(0, 8000).toLowerCase();
        const hasWelcome = /welcome|homepage|home page/.test(lowerText);
        const hasListingKw = /results|found|showing|items|products|listings/i.test(lowerText);
        const hasCheckoutKw = /checkout|payment|billing|shipping address|order summary/i.test(lowerText);
        const hasDashKw = /overview|total|revenue|analytics|performance|dashboard/i.test(lowerText);

        return {
            // Raw counts
            totalElements, divCount, sectionCount,
            formCount, inputCount, passwordInputs, emailInputs,
            checkboxCount, radioCount, textareaCount,
            repeatingCards: realCards,
            priceMatches, hasPriceText,
            // Button signals
            hasAddToCart, hasCheckout, hasLoginBtn, hasRegisterBtn,
            hasNextPrev, hasSubmit, hasCTA, hasFilter,
            // Nav
            navLinks, allLinks, breadcrumbs,
            // Rich content
            tableCount, chartCount, imageCount, videoCount,
            heroImage, sidebarCount, statCards, headerCount,
            // Step / Modal
            stepEls, hasStepNumbers, modalEls, hasModalOpen,
            // Text signals
            hasWelcome, hasListingKw, hasCheckoutKw, hasDashKw,
            hasCTA, hasFilter,
            // Meta
            titleText: titleText.slice(0, 80),
            pagePath: pagePath.slice(0, 200),
        };
    }, url);
}

// ── Rule Engine Scorer ────────────────────────────────────────────────────────

/**
 * Scores each page type 0-100 based on weighted feature signals.
 * Returns { scores, bestType, confidence, runner_up }
 */
function classifyFeatures(f, url) {
    const u = (url || '').toLowerCase();
    const scores = {};

    // ── Home ────────────────────────────────────────────────────────────────
    scores.Home = 0;
    if (f.hasCTA) scores.Home += 25;
    if (f.heroImage > 0) scores.Home += 20;
    if (f.navLinks > 3) scores.Home += 15;
    if (f.hasWelcome) scores.Home += 15;
    if (f.inputCount < 3) scores.Home += 10;
    if (f.imageCount > 5) scores.Home += 10;
    if (/^(https?:\/\/[^/]+\/?)?$/.test(url) || /\/(home|index|landing)/.test(u)) scores.Home += 20;

    // ── Listing ─────────────────────────────────────────────────────────────
    scores.Listing = 0;
    if (f.repeatingCards > 5) scores.Listing += 35;
    if (f.hasFilter) scores.Listing += 15;
    if (f.hasListingKw) scores.Listing += 20;
    if (f.breadcrumbs > 0) scores.Listing += 10;
    if (f.inputCount < 4) scores.Listing += 5;
    if (f.imageCount > 8) scores.Listing += 10;
    if (/\/(list|catalog|search|result|category|browse|shop|store|products?)/.test(u)) scores.Listing += 20;

    // ── Form ────────────────────────────────────────────────────────────────
    scores.Form = 0;
    if (f.inputCount > 6) scores.Form += 35;
    if (f.formCount > 0) scores.Form += 20;
    if (f.hasSubmit) scores.Form += 15;
    if (f.textareaCount > 0) scores.Form += 10;
    if (f.checkboxCount > 2) scores.Form += 10;
    if (!f.hasPriceText) scores.Form += 5;
    if (f.passwordInputs === 0) scores.Form += 5;
    if (/\/(form|contact|apply|survey|edit|create|new|submit)/.test(u)) scores.Form += 20;

    // ── Product ─────────────────────────────────────────────────────────────
    scores.Product = 0;
    if (f.hasPriceText && f.hasAddToCart) scores.Product += 50;
    if (f.hasPriceText) scores.Product += 20;
    if (f.hasAddToCart) scores.Product += 20;
    if (f.imageCount > 2) scores.Product += 10;
    if (/\/(product|item|detail|sku|pdp|goods?)/.test(u)) scores.Product += 20;

    // ── Checkout ────────────────────────────────────────────────────────────
    scores.Checkout = 0;
    if (f.hasCheckout) scores.Checkout += 40;
    if (f.hasCheckoutKw) scores.Checkout += 25;
    if (f.hasPriceText) scores.Checkout += 10;
    if (f.inputCount >= 4) scores.Checkout += 15;
    if (f.formCount > 0) scores.Checkout += 10;
    if (/\/(checkout|cart|payment|billing|order|confirm|basket)/.test(u)) scores.Checkout += 25;

    // ── Dashboard ───────────────────────────────────────────────────────────
    scores.Dashboard = 0;
    if (f.chartCount > 0) scores.Dashboard += 25;
    if (f.tableCount > 0) scores.Dashboard += 15;
    if (f.sidebarCount > 0) scores.Dashboard += 20;
    if (f.statCards > 2) scores.Dashboard += 20;
    if (f.hasDashKw) scores.Dashboard += 15;
    if (f.navLinks > 5) scores.Dashboard += 10;
    if (/\/(dashboard|admin|overview|analytics|metrics|reports?|home)/.test(u)) scores.Dashboard += 20;

    // ── Wizard ──────────────────────────────────────────────────────────────
    scores.Wizard = 0;
    if (f.stepEls > 0) scores.Wizard += 30;
    if (f.hasStepNumbers) scores.Wizard += 25;
    if (f.hasNextPrev) scores.Wizard += 25;
    if (f.formCount > 0) scores.Wizard += 15;
    if (/\/(wizard|step|onboard|setup|guide|tour|flow)/.test(u)) scores.Wizard += 25;

    // ── Modal ───────────────────────────────────────────────────────────────
    scores.Modal = 0;
    if (f.hasModalOpen > 0) scores.Modal += 50;
    if (f.modalEls > 0) scores.Modal += 30;
    if (f.totalElements < 80) scores.Modal += 10;  // minimal DOM = likely a modal
    if (/\/(modal|dialog|popup|overlay)/.test(u)) scores.Modal += 20;

    // ── Auth (may override Form when password is present) ────────────────────
    // Implicitly reclassified under Form for this classifier, but we adjust Form
    if (f.passwordInputs > 0 && f.inputCount <= 4) {
        scores.Form = Math.max(scores.Form, 60);
    }
    if (f.hasLoginBtn && f.passwordInputs > 0) {
        scores.Form += 15;
    }

    // Cap all scores at 100
    for (const k of Object.keys(scores)) {
        scores[k] = Math.min(100, Math.round(scores[k]));
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [bestType, bestScore] = sorted[0];
    const [runnerType, runnerScore] = sorted[1] || [null, 0];

    // Confidence = gap between top two scores normalised
    const gap = bestScore - runnerScore;
    const rawConfidence = Math.min(100, Math.round(50 + gap * 0.6 + (bestScore * 0.2)));
    const confidence = bestScore === 0 ? 10 : rawConfidence;

    return { scores, bestType, bestScore, confidence, runner_up: { type: runnerType, score: runnerScore } };
}

// ── Main: Classify a single URL ───────────────────────────────────────────────

async function classifyPage(url) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36 InspectraClassifier/1.0',
        ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();

    try {
        const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500); // let SPA render
        const statusCode = resp?.status() || 0;
        const title = await page.title();

        // Screenshot (compact JPEG)
        const shot = await page.screenshot({ type: 'jpeg', quality: 55, clip: { x: 0, y: 0, width: 1280, height: 720 } });
        const screenshot = `data:image/jpeg;base64,${shot.toString('base64')}`;

        // Feature extraction
        const features = await extractFeatures(page, url);

        // Classification
        const classification = classifyFeatures(features, url);

        const result = {
            url,
            title,
            statusCode,
            screenshot,
            features,
            pageType: classification.bestType,
            confidence: classification.confidence,
            scores: classification.scores,
            runner_up: classification.runner_up,
            classifiedAt: new Date().toISOString(),
        };

        // Persist
        const store = loadStore();
        store[url] = result;
        saveStore(store);

        return result;
    } finally {
        await browser.close();
    }
}

// ── Batch classify multiple URLs ──────────────────────────────────────────────

async function classifyPages(urls, onProgress) {
    const results = [];
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (onProgress) onProgress({ index: i, total: urls.length, url });
        try {
            const r = await classifyPage(url);
            results.push(r);
        } catch (err) {
            results.push({ url, error: err.message, pageType: 'Unknown', confidence: 0, features: {} });
        }
    }
    return results;
}

// ── Persist override (user edits type manually) ───────────────────────────────

function overridePagType(url, newType) {
    const store = loadStore();
    if (!store[url]) return false;
    store[url].pageType = newType;
    store[url].overridden = true;
    store[url].confidence = 100;
    saveStore(store);
    return true;
}

// ── Load all classified pages ─────────────────────────────────────────────────

function getAllClassified() {
    return Object.values(loadStore());
}

module.exports = { classifyPage, classifyPages, classifyFeatures, overridePagType, getAllClassified };
