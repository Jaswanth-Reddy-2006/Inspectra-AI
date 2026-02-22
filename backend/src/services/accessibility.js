const { SEVERITY } = require('../utils/severity');

async function runAccessibilityAudit(page) {
    try {
        // Inject axe-core
        await page.addScriptTag({ path: require.resolve('axe-core') });

        const results = await page.evaluate(async () => {
            // @ts-ignore
            return await axe.run();
        });

        return results.violations.map(violation => ({
            type: 'Accessibility Violation',
            description: `${violation.help} (${violation.id})`,
            severity: mapAxeImpactToSeverity(violation.impact)
        }));
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
