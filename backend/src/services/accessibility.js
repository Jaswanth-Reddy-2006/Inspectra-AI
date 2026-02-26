const { SEVERITY, SEVERITY_METADATA } = require('../utils/severity');

/**
 * Maps common Axe rules to actionable developer fix suggestions and code examples
 */
const FIX_SUGGESTIONS = {
    'button-name': {
        suggestion: 'Add visible text inside <button> or include an aria-label attribute.',
        example: '<button aria-label="Submit Form">Submit</button>'
    },
    'color-contrast': {
        suggestion: 'Increase text/background contrast ratio to meet WCAG AA (4.5:1).',
        example: '.text { color: #000; background: #fff; }'
    },
    'document-title': {
        suggestion: 'Add a descriptive <title> element to the page header.',
        example: '<title>Welcome - Inspectra AI</title>'
    },
    'html-has-lang': {
        suggestion: 'Add a lang attribute (e.g., lang="en") to the <html> tag.',
        example: '<html lang="en">'
    },
    'image-alt': {
        suggestion: 'Add a descriptive alt attribute to the <img> tag.',
        example: '<img src="logo.png" alt="Company Logo">'
    },
    'label': {
        suggestion: 'Ensure every form element has a corresponding <label> or aria-label.',
        example: '<label for="email">Email</label><input id="email" type="email">'
    },
    'link-name': {
        suggestion: 'Ensure links have discernible text or an aria-label.',
        example: '<a href="/home" aria-label="Go to home">Home</a>'
    },
    'list': {
        suggestion: 'Ensure list items (<li>) are contained within <ul> or <ol> parents.',
        example: '<ul><li>Item 1</li></ul>'
    },
    'region': {
        suggestion: 'Ensure all content is contained within landmark regions.',
        example: '<main><nav>...</nav><article>...</article></main>'
    }
};

async function runAccessibilityAudit(page) {
    try {
        await page.addScriptTag({ path: require.resolve('axe-core') });

        const results = await page.evaluate(async () => {
            // axe.run with fixed config for determinism
            // @ts-ignore
            return await axe.run({
                resultTypes: ['violations'],
                rules: {
                    'p-as-heading': { enabled: false }, // Disable floating/random rules if any
                }
            });
        });

        // Deterministic sorting of violations by impact and ID
        const sortedViolations = results.violations.sort((a, b) => {
            const impacts = { critical: 0, serious: 1, moderate: 2, minor: 3 };
            return (impacts[a.impact] - impacts[b.impact]) || a.id.localeCompare(b.id);
        });

        const issues = [];
        const seen = new Set();

        sortedViolations.forEach(violation => {
            const severity = mapAxeImpactToSeverity(violation.impact);
            const metadata = SEVERITY_METADATA[severity];

            // Deterministic sorting of nodes by selector
            const sortedNodes = violation.nodes.sort((a, b) =>
                a.target.join(' > ').localeCompare(b.target.join(' > '))
            );

            sortedNodes.forEach(node => {
                const selector = node.target.join(' > ');
                const dedupeKey = `${violation.id}-${selector}`;

                if (seen.has(dedupeKey)) return;
                seen.add(dedupeKey);

                const fixInfo = FIX_SUGGESTIONS[violation.id] || {
                    suggestion: node.failureSummary || 'Review WCAG guidelines for this element.',
                    example: null
                };

                issues.push({
                    id: `axe-${violation.id}-${Buffer.from(selector).toString('base64').substring(0, 8)}`,
                    type: 'ACCESSIBILITY_VIOLATION',
                    severity: severity,
                    ruleId: violation.id,
                    severityReason: metadata.reason,
                    impactExplanation: metadata.impact,
                    description: violation.help,
                    helpUrl: violation.helpUrl,
                    element: {
                        selector: selector,
                        htmlSnippet: node.html,
                        tagName: node.html.match(/^<([a-z0-9]+)/i)?.[1]?.toLowerCase() || 'unknown'
                    },
                    fixSuggestion: fixInfo.suggestion,
                    codeExampleFix: fixInfo.example,
                    documentationUrl: violation.helpUrl
                });
            });
        });

        return issues;
    } catch (error) {
        console.error('Accessibility audit failed:', error.message);
        return [];
    }
}

function mapAxeImpactToSeverity(impact) {
    switch (impact) {
        case 'critical': return SEVERITY.CRITICAL;
        case 'serious': return SEVERITY.HIGH;
        case 'moderate': return SEVERITY.MEDIUM;
        case 'minor': return SEVERITY.LOW;
        default: return SEVERITY.LOW;
    }
}

module.exports = { runAccessibilityAudit };
