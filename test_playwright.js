const { chromium } = require('playwright');

(async () => {
    console.log('Testing chromium launch...');
    const browser = await chromium.launch({ headless: true });
    console.log('Browser launched successfully.');
    const page = await browser.newPage();
    console.log('Navigating to google.com...');
    await page.goto('https://www.google.com', { timeout: 10000 });
    console.log('Success! Page title:', await page.title());
    await browser.close();
    console.log('Test complete.');
})().catch(err => {
    console.error('Playwright Test Failed:', err);
    process.exit(1);
});
