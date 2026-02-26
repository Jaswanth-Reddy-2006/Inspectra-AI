const { SEVERITY, SEVERITY_METADATA } = require('../utils/severity');

/**
 * Structural Hygiene Agent
 * Performs lightweight DOM analysis for best practices, SEO, and basic accessibility.
 */
async function runHygieneCheck(page) {
    try {
        const issues = await page.evaluate(({ SEVERITY_LEVELS, METADATA }) => {
            const hygieneIssues = [];
            const doc = document;

            const createIssue = (ruleId, type, description, severity, fix, example = null, selector = null) => {
                const idHash = btoa(`${ruleId}-${selector || 'page'}`).substring(0, 8);
                hygieneIssues.push({
                    id: `hygiene-${ruleId}-${idHash}`,
                    type,
                    severity,
                    ruleId,
                    severityReason: METADATA[severity].reason,
                    impactExplanation: METADATA[severity].impact,
                    description,
                    element: selector ? { selector, tagName: selector.split(' ')[0] } : null,
                    fixSuggestion: fix,
                    codeExampleFix: example,
                    documentationUrl: `https://web.dev/${ruleId.replace(/-/g, '_')}`
                });
            };

            // 1. Check Title
            if (!doc.title) {
                createIssue('missing-title', 'Structural Hygiene', 'Page is missing a <title> element.', SEVERITY_LEVELS.MEDIUM, 'Add a descriptive <title> to the <head>.', '<title>My App | Search</title>');
            }

            // 2. Check Meta Viewport
            if (!doc.querySelector('meta[name="viewport"]')) {
                createIssue('missing-viewport', 'Structural Hygiene', 'Missing <meta name="viewport"> tag for responsive design.', SEVERITY_LEVELS.MEDIUM, 'Add a viewport meta tag.', '<meta name="viewport" content="width=device-width, initial-scale=1">');
            }

            // 3. Check Meta Description
            if (!doc.querySelector('meta[name="description"]')) {
                createIssue('missing-description', 'Structural Hygiene', 'Missing <meta name="description"> for search engine visibility.', SEVERITY_LEVELS.MEDIUM, 'Add a concise meta description to the <head>.', '<meta name="description" content="Search results for products...">');
            }

            // 4. Check Language Attribute
            if (!doc.documentElement.lang) {
                createIssue('missing-lang', 'Structural Hygiene', 'Missing lang attribute on <html> element.', SEVERITY_LEVELS.MEDIUM, 'Add a lang attribute.', '<html lang="en">');
            }

            // 4. Check Images for Alt Text
            const imagesWithoutAlt = Array.from(doc.querySelectorAll('img:not([alt])'));
            imagesWithoutAlt.forEach(img => {
                const selector = img.id ? `#${img.id}` : img.className ? `.${img.className.split(' ').join('.')}` : 'img';
                createIssue(
                    'missing-img-alt',
                    'Structural Hygiene',
                    'Image is missing an alt attribute.',
                    SEVERITY_LEVELS.MEDIUM,
                    'Add a descriptive alt attribute to the image.',
                    '<img src="..." alt="Description of image">',
                    selector
                );
            });

            // 5. Heading Hierarchy (Multiple H1 & Skipped Levels)
            const h1s = doc.querySelectorAll('h1');
            if (h1s.length > 1) {
                createIssue('multiple-h1', 'Structural Hygiene', 'Detected multiple <h1> tags. A page should have exactly one primary heading.', SEVERITY_LEVELS.MEDIUM, 'Convert secondary <h1> tags to <h2>.', '<h1>Main Title</h1>\n<h2>Sub Title</h2>');
            }

            const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            for (let i = 1; i < headings.length; i++) {
                const prev = parseInt(headings[i - 1].tagName[1]);
                const curr = parseInt(headings[i].tagName[1]);
                if (curr > prev + 1) {
                    createIssue('skipped-heading', 'Structural Hygiene', `Skipped heading level: <${headings[i - 1].tagName}> followed by <${headings[i].tagName}>.`, SEVERITY_LEVELS.LOW, 'Ensure headings follow a logical descending order.', '<h1> -> <h2> -> <h3>');
                    break;
                }
            }

            // 6. Duplicate IDs
            const allIds = Array.from(doc.querySelectorAll('[id]')).map(el => el.id);
            const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
            if (duplicates.length > 0) {
                createIssue('duplicate-id', 'Structural Hygiene', `Detected duplicate IDs: #${duplicates[0]}. IDs must be unique per page.`, SEVERITY_LEVELS.MEDIUM, 'Change duplicate ID to a unique name.', '<div id="btn-1"></div>\n<div id="btn-2"></div>');
            }

            // 7. Inline Styles Overuse
            const inlineStyleNodes = doc.querySelectorAll('[style]');
            if (inlineStyleNodes.length > 15) {
                createIssue('inline-styles-overuse', 'Structural Hygiene', 'Found excessive use of inline styles (>15 elements).', SEVERITY_LEVELS.LOW, 'Move inline styles to a centralized CSS stylesheet or Tailwind classes.', '.custom-card { padding: 20px; }');
            }

            // 8. Excessive DOM Depth (>20)
            const checkDepth = (node, depth = 0) => {
                if (depth > 20) return true;
                for (let child of node.children) {
                    if (checkDepth(child, depth + 1)) return true;
                }
                return false;
            };
            if (checkDepth(doc.body)) {
                createIssue('extensive-dom-depth', 'Structural Hygiene', 'DOM depth exceeds 20 levels. This can significantly impact parsing and layout performance.', SEVERITY_LEVELS.HIGH, 'Flatten your HTML structure to reduce rendering debt.', 'Use Grid/Flexbox for flatter layouts.');
            }

            // 9. Deprecated tags
            const deprecated = doc.querySelectorAll('font, center, big, strike, tt');
            if (deprecated.length > 0) {
                createIssue('deprecated-tags', 'Structural Hygiene', 'Found legacy deprecated tags.', SEVERITY_LEVELS.LOW, 'Replace with modern CSS definitions.', '<span class="text-center">...</span>');
            }

            return hygieneIssues;
        }, { SEVERITY_LEVELS: SEVERITY, METADATA: SEVERITY_METADATA });

        return issues;
    } catch (error) {
        console.error('Hygiene check failed:', error.message);
        return [];
    }
}

module.exports = { runHygieneCheck };
