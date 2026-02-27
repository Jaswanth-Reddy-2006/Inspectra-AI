/**
 * Visual Judge — Screenshot Comparison Engine
 * ─────────────────────────────────────────────
 * Captures two screenshots (baseline vs current) then:
 *   • Pixel-level diff with configurable threshold
 *   • SSIM-style luminance comparison
 *   • Region-level analysis: shifted elements, overflow, hidden buttons
 *   • Diff heatmap overlay (PNG with red/green channels)
 *
 * Dependencies: pngjs, pixelmatch
 *   npm install pngjs pixelmatch
 */

const { chromium } = require('playwright');
const { launchBrowser } = require('../utils/browser');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

// ── Viewport presets ──────────────────────────────────────────────────────────

const VIEWPORTS = {
    desktop: { width: 1280, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 },
};

// ── Dynamic area masking (% of width/height) ──────────────────────────────────
// Regions to ignore during diff (e.g. ads, timestamps, carousels)

const DYNAMIC_MASKS = [
    // Top navbar area (timestamps, live notifications)
    { x: 0.7, y: 0, w: 0.3, h: 0.06 },
];

function buildMaskBuffer(width, height) {
    // Returns a Uint8Array where masked pixels = 1
    const mask = new Uint8Array(width * height);
    for (const region of DYNAMIC_MASKS) {
        const x0 = Math.floor(region.x * width);
        const y0 = Math.floor(region.y * height);
        const x1 = Math.min(width, Math.floor((region.x + region.w) * width));
        const y1 = Math.min(height, Math.floor((region.y + region.h) * height));
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                mask[y * width + x] = 1;
            }
        }
    }
    return mask;
}

// ── SSIM-like block comparison (8×8 macro-blocks) ────────────────────────────

function computeBlockSimilarity(imgA, imgB, width, height) {
    const BLOCK = 32;
    const cols = Math.ceil(width / BLOCK);
    const rows = Math.ceil(height / BLOCK);
    const blocks = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x0 = col * BLOCK;
            const y0 = row * BLOCK;
            const x1 = Math.min(x0 + BLOCK, width);
            const y1 = Math.min(y0 + BLOCK, height);

            let sumDiff = 0, count = 0;
            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const i = (y * width + x) * 4;
                    const rA = imgA[i], gA = imgA[i + 1], bA = imgA[i + 2];
                    const rB = imgB[i], gB = imgB[i + 1], bB = imgB[i + 2];
                    // Luminance delta
                    const lumA = 0.299 * rA + 0.587 * gA + 0.114 * bA;
                    const lumB = 0.299 * rB + 0.587 * gB + 0.114 * bB;
                    sumDiff += Math.abs(lumA - lumB);
                    count++;
                }
            }
            const avgDiff = count > 0 ? sumDiff / count : 0;
            const similarity = Math.max(0, 1 - avgDiff / 255);
            blocks.push({
                col, row,
                x: x0, y: y0, w: x1 - x0, h: y1 - y0,
                similarity: parseFloat(similarity.toFixed(3)),
                diff: parseFloat((avgDiff / 255).toFixed(3)),
            });
        }
    }

    return blocks;
}

// ── Issue detector ────────────────────────────────────────────────────────────

async function detectVisualIssues(page) {
    return page.evaluate(() => {
        const issues = [];
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Overflow check
        document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            if (r.right > vw + 4) {
                issues.push({
                    type: 'overflow',
                    tag: el.tagName.toLowerCase(),
                    selector: (el.id ? '#' + el.id : el.className?.split(' ')[0] || el.tagName.toLowerCase()),
                    detail: `Element extends ${Math.round(r.right - vw)}px beyond viewport right edge`,
                    severity: 'medium',
                    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
                });
            }
            if (r.bottom > document.documentElement.scrollHeight + 10) {
                issues.push({
                    type: 'overflow',
                    tag: el.tagName.toLowerCase(),
                    selector: (el.id ? '#' + el.id : el.className?.split(' ')[0] || el.tagName.toLowerCase()),
                    detail: `Element overflows page height by ${Math.round(r.bottom - document.documentElement.scrollHeight)}px`,
                    severity: 'medium',
                    rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
                });
            }
        });

        // Hidden interactive elements
        const interactives = document.querySelectorAll('button, a[href], input[type=submit], [role=button]');
        interactives.forEach(el => {
            const style = getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const hidden =
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.opacity === '0' ||
                parseFloat(style.opacity) < 0.15 ||
                (rect.width < 2 || rect.height < 2);

            if (hidden && el.textContent?.trim()) {
                issues.push({
                    type: 'hidden_button',
                    tag: el.tagName.toLowerCase(),
                    selector: el.id ? '#' + el.id : (el.textContent?.trim().slice(0, 30) || 'unknown'),
                    detail: `Interactive element "${el.textContent?.trim().slice(0, 40)}" is not visible (opacity:${style.opacity || style.visibility || style.display})`,
                    severity: 'high',
                    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
                });
            }
        });

        // Z-index stacking (element covering another interactive)
        const clickTargets = [...document.querySelectorAll('button, a, input')].slice(0, 60);
        clickTargets.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 2 || rect.height < 2) return;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const top = document.elementFromPoint(cx, cy);
            if (top && top !== el && !el.contains(top)) {
                issues.push({
                    type: 'z_overlap',
                    tag: el.tagName.toLowerCase(),
                    selector: el.id ? '#' + el.id : (el.textContent?.trim().slice(0, 30) || 'element'),
                    detail: `"${el.textContent?.trim().slice(0, 30) || el.tagName}" is covered by <${top.tagName?.toLowerCase()}>`,
                    severity: 'high',
                    rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
                });
            }
        });

        return issues.slice(0, 40);
    });
}

// ── Main comparison function ──────────────────────────────────────────────────

async function compareScreenshots(baselineUrl, currentUrl, viewportKey = 'desktop', onProgress) {
    const viewport = VIEWPORTS[viewportKey] || VIEWPORTS.desktop;
    const { width, height } = viewport;

    if (onProgress) onProgress({ phase: 'launching', pct: 5 });
    const browser = await launchBrowser();

    let baselineShot, currentShot, baselineIssues, currentIssues;

    try {
        // ── Capture baseline ──────────────────────────────────────────────────
        if (onProgress) onProgress({ phase: 'capturing_baseline', pct: 15 });
        const ctxA = await browser.newContext({ viewport });
        const pageA = await ctxA.newPage();
        await pageA.goto(baselineUrl, { waitUntil: 'networkidle', timeout: 25000 });
        await pageA.waitForTimeout(800);
        baselineIssues = await detectVisualIssues(pageA);
        baselineShot = await pageA.screenshot({ type: 'png', fullPage: false, clip: { x: 0, y: 0, width, height } });
        await ctxA.close();

        // ── Capture current ───────────────────────────────────────────────────
        if (onProgress) onProgress({ phase: 'capturing_current', pct: 35 });
        const ctxB = await browser.newContext({ viewport });
        const pageB = await ctxB.newPage();
        await pageB.goto(currentUrl, { waitUntil: 'networkidle', timeout: 25000 });
        await pageB.waitForTimeout(800);
        currentIssues = await detectVisualIssues(pageB);
        currentShot = await pageB.screenshot({ type: 'png', fullPage: false, clip: { x: 0, y: 0, width, height } });
        await ctxB.close();

    } finally {
        await browser.close();
    }

    if (onProgress) onProgress({ phase: 'computing_diff', pct: 55 });

    // ── Parse PNGs ────────────────────────────────────────────────────────────
    const imgA = PNG.sync.read(baselineShot);
    const imgB = PNG.sync.read(currentShot);

    // If size mismatch, skip pixel diff
    const sameSize = imgA.width === imgB.width && imgA.height === imgB.height;

    let diffPixels = 0;
    let ssimScore = 100;
    let diffImgB64 = null;
    let blocks = [];

    if (sameSize) {
        const diffPng = new PNG({ width: imgA.width, height: imgA.height });

        diffPixels = pixelmatch(
            imgA.data, imgB.data, diffPng.data,
            imgA.width, imgA.height,
            { threshold: 0.12, includeAA: false, alpha: 0.1, diffColor: [255, 50, 50], aaColor: [255, 200, 0] }
        );

        // Apply dynamic mask — zero out masked diff pixels
        const mask = buildMaskBuffer(imgA.width, imgA.height);
        for (let i = 0; i < mask.length; i++) {
            if (mask[i]) diffPng.data[i * 4 + 3] = 0;
        }

        diffImgB64 = `data:image/png;base64,${PNG.sync.write(diffPng).toString('base64')}`;

        // Block similarity
        blocks = computeBlockSimilarity(imgA.data, imgB.data, imgA.width, imgA.height);
        const totalPx = imgA.width * imgA.height;
        const diffPct = diffPixels / totalPx;
        ssimScore = Math.max(0, Math.round((1 - diffPct * 6) * 100));
    }

    if (onProgress) onProgress({ phase: 'analysing', pct: 80 });

    // ── Build issue list ──────────────────────────────────────────────────────

    // Detect shifted blocks (blocks that changed significantly)
    const shiftedBlocks = blocks
        .filter(b => b.diff > 0.15)
        .sort((a, b) => b.diff - a.diff)
        .slice(0, 20);

    const shiftedIssues = shiftedBlocks.map(b => ({
        type: 'shifted_element',
        detail: `Block at (${b.x},${b.y}) has ${Math.round(b.diff * 100)}% luminance change`,
        severity: b.diff > 0.5 ? 'high' : 'medium',
        rect: { x: b.x, y: b.y, w: b.w, h: b.h },
    }));

    const allIssues = [
        ...shiftedIssues,
        ...currentIssues,
    ];

    const issuesByType = {
        overflow: allIssues.filter(i => i.type === 'overflow').length,
        hidden_button: allIssues.filter(i => i.type === 'hidden_button').length,
        z_overlap: allIssues.filter(i => i.type === 'z_overlap').length,
        shifted_element: allIssues.filter(i => i.type === 'shifted_element').length,
    };

    const overallVerdict =
        ssimScore >= 95 && allIssues.filter(i => i.severity === 'high').length === 0 ? 'pass'
            : ssimScore >= 80 ? 'warn'
                : 'fail';

    if (onProgress) onProgress({ phase: 'done', pct: 100 });

    return {
        baselineUrl,
        currentUrl,
        viewport: viewportKey,
        width, height,

        // Screenshots (base64)
        baselineImg: `data:image/png;base64,${baselineShot.toString('base64')}`,
        currentImg: `data:image/png;base64,${currentShot.toString('base64')}`,
        diffImg: diffImgB64,

        // Scores
        ssimScore,
        diffPixels,
        diffPct: sameSize ? parseFloat((diffPixels / (imgA.width * imgA.height) * 100).toFixed(2)) : null,
        overallVerdict,

        // Issues
        issues: allIssues,
        issuesByType,
        baselineIssues,

        // Block heatmap data
        blocks: blocks.filter(b => b.diff > 0.05),

        analyzedAt: new Date().toISOString(),
    };
}

module.exports = { compareScreenshots, VIEWPORTS };
