const { SEVERITY } = require('../utils/severity');

/**
 * Maps common Axe rules to actionable developer fix suggestions
 */
const FIX_SUGGESTIONS = {
    'button-name': 'Add an aria-label or visible text content to the button.',
    'color-contrast': 'Ensure text color has a contrast ratio of at least 4.5:1 against its background.',
    'document-title': 'Add a descriptive <title> element to the page header.',
    'html-has-lang': 'Add a lang attribute (e.g., lang="en") to the <html> tag.',
    'image-alt': 'Add a descriptive alt attribute to the <img> tag.',
    'label': 'Ensure every form element has a corresponding <label> or aria-label.',
    'link-name': 'Ensure links have discernible text or an aria-label.',
    'list': 'Ensure list items (<li>) are contained within <ul> or <ol> parents.',
    'region': 'Ensure all content is contained within landmark regions (main, nav, header, footer).',
};

async function runAccessibilityAudit(page) {
    try {
        await page.addScriptTag({ path: require.resolve('axe-core') });

        const results = await page.evaluate(async () => {
            // @ts-ignore
            return await axe.run({
                resultTypes: ['violations']
            });
        });

        const issues = [];

        results.violations.forEach(violation => {
            violation.nodes.forEach(node => {
                issues.push({
                    type: 'Accessibility Violation',
                    ruleId: violation.id,
                    description: violation.help,
                    helpUrl: violation.helpUrl,
                    severity: mapAxeImpactToSeverity(violation.impact),
                    impact: violation.impact,
                    element: {
                        selector: node.target.join(' > '),
                        html: node.html
                    },
                    fixSuggestion: FIX_SUGGESTIONS[violation.id] || node.failureSummary || 'Review WCAG guidelines for this element.',
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
