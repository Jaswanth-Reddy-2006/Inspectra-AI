const { chromium } = require('playwright');

/**
 * Centrally managed browser launcher for Inspectra AI.
 * Includes memory optimizations and sandbox bypass for production environments.
 */
async function launchBrowser() {
    return await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process',
            '--disable-extensions',
            '--disable-dev-tools'
        ]
    });
}

module.exports = { launchBrowser };
