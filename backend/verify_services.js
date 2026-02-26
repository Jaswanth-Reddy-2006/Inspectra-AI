const { buildGraph } = require('./src/services/defectGraph');
const { buildSeverityMatrix } = require('./src/services/severityMatrix');

console.log('--- Verification: Backend Services ---');

try {
    const graph = buildGraph();
    console.log('Defect Graph:', graph ? 'SUCCESS' : 'FAILED');
    console.log(' - Nodes:', graph?.nodes?.length || 0);
    console.log(' - Edges:', graph?.edges?.length || 0);

    const matrix = buildSeverityMatrix();
    console.log('Severity Matrix:', matrix ? 'SUCCESS' : 'FAILED');
    console.log(' - Defects:', matrix?.defects?.length || 0);
} catch (err) {
    console.error('Service Verification Failed:', err.message);
}
