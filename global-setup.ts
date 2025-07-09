import { FullConfig } from '@playwright/test';
import { setupBrowser } from './core/dist/test-utils/browser';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log(`\n=== Global Test Setup ===`);
  console.log(`Base URL: ${baseURL}`);
  
  // Initialize browser context for global setup if needed
  const { browser, page } = await setupBrowser({
    baseUrl: baseURL,
    headless: true,
  });
  
  try {
    // Perform any global setup here (e.g., authenticate once)
    console.log('Performing global setup...');
    
    // Example: Set authentication state
    // await page.goto('/login');
    // await page.fill('#username', process.env.TEST_USERNAME);
    // await page.fill('#password', process.env.TEST_PASSWORD);
    // await page.click('button[type="submit"]');
    // await page.context().storageState({ path: 'storageState.json' });
    
    console.log('Global setup completed');
  } finally {
    await browser.close();
  }
}

export default globalSetup;
