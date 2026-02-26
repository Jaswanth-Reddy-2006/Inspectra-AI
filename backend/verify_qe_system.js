const { extractIntelligence } = require('./src/services/intelligenceEngine');
const { calculateProductionReadiness } = require('./src/services/scoringLogic');
const { generateAIReasoning } = require('./src/services/aiReasoner');

// Mock Telemetry Data
const mockPages = [
    {
        url: 'http://unsafe-startup.com',
        signals: { maxDepth: 30, nodeCount: 1500, forms: [{ hasSubmit: false }], scripts: [{ src: 'main.js.map' }] },
        perf: { loadTime: 4500 }
    }
];

const mockGlobalSignals = {
    securityHeaders: { 'server': 'Nginx-Dev-Build' }, // No HTTPS, No CSP, Dev Leakage
    consoleLogLevels: { error: 12, warning: 5, log: 10 },
    networkStats: { totalRequests: 150, failedRequests: 10, crossOriginRequests: 50 },
    stressTest: { successRate: 60, avgResponseTime: 800 }, // Stress test failure
    fuzzing: { handled404: false, customErrorPage: false }
};

console.log('--- STARTING QUALITY INTELLIGENCE E2E LOGIC TEST ---');

// 1. Extraction
const intelligence = extractIntelligence(mockPages, mockGlobalSignals);
console.log('\n[1] Intelligence Extraction (7 Dimensions):');
Object.entries(intelligence).forEach(([dim, val]) => {
    console.log(` - ${dim.toUpperCase()}: ${val.score} (Maturity: ${val.maturity})`);
});

// 2. Scoring & Overrides
const readiness = calculateProductionReadiness(intelligence);
console.log('\n[2] Production Readiness & Risk:');
console.log(` - Overall Score: ${readiness.overallScore}`);
console.log(` - Risk Level: ${readiness.riskLevel}`);
console.log(` - Readiness: ${readiness.readiness}`);
console.log(` - Overrides Applied:`, readiness.overrides);
console.log(` - Regression Prob: ${readiness.regressionProb}%`);

// 3. AI Reasoning
const reasoning = generateAIReasoning(intelligence, readiness);
console.log('\n[3] AI Reasoning Layer:');
console.log(` - Executive Summary: ${reasoning.executiveSummary}`);
console.log(` - Top Priority: ${reasoning.remediationPriorities[0]?.title}`);
console.log(` - Engineering Strategy: ${reasoning.longTermStrategy}`);

console.log('\n--- VERIFICATION COMPLETE ---');
