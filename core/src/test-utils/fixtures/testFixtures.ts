import { test as base, expect, Page, BrowserContext, Browser, TestInfo } from '@playwright/test';
import { setupBrowser, teardownBrowser, takeScreenshot } from '../browser';
import { UserFactory, User } from '../test-data/factories/UserFactory';
import { TestReporter } from '../reporting/testReporter';

// Extend the base test with custom fixtures
export const test = base.extend<{
  page: Page;
  context: BrowserContext;
  browser: Browser;
  user: User;
  adminUser: User;
}>({
  // Browser instance (shared across tests in the same worker)
  browser: [async ({}, use) => {
    const { browser } = await setupBrowser();
    await use(browser);
    await teardownBrowser();
  }, { scope: 'worker' }],
  
  // Browser context (per test isolation)
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: process.env.RECORD_VIDEO ? { dir: 'test-results/videos/' } : undefined,
    });
    
    // Set default timeout for all actions
    context.setDefaultTimeout(30000);
    
    try {
      await use(context);
    } finally {
      await context.close();
    }
  },
  
  // Page instance (per test)
  page: async ({ context, testInfo }, use) => {
    const page = await context.newPage();
    
    // Set default navigation timeout
    page.setDefaultNavigationTimeout(60000);
    
    // Add unhandled request logging
    page.on('requestfailed', request => {
      console.error(`Request failed: ${request.failure()?.errorText}`, request.url());
    });
    
    try {
      // Initialize test reporter
      await TestReporter.onTestBegin(testInfo);
      await use(page);
      // Finalize test reporter
      await TestReporter.onTestEnd(testInfo, page);
    } finally {
      // Take screenshot on test failure
      const testInfo = test.info();
      if (testInfo.status === 'failed' || testInfo.status === 'timedOut') {
        const screenshotPath = `test-results/screenshots/${testInfo.title.replace(/\s+/g, '_')}_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        testInfo.attachments.push({
          name: 'screenshot',
          path: screenshotPath,
          contentType: 'image/png'
        });
      }
    }
  },
  
  // Test user fixture with automatic cleanup
  user: async ({ page }, use) => {
    const user = UserFactory.createUser();
    
    // Register cleanup after test completes
    test.info()._userToCleanup = user;
    
    try {
      await use(user);
    } finally {
      // Cleanup test user after test completes
      if (process.env.CLEANUP_TEST_USERS !== 'false') {
        try {
          // Implement your user cleanup logic here
          // Example: await cleanupTestUser(user.id);
        } catch (error) {
          console.error('Error cleaning up test user:', error);
        }
      }
    }
  },
  
  // Admin user fixture with automatic cleanup
  adminUser: async ({ page }, use) => {
    const admin = UserFactory.createAdminUser();
    
    // Register cleanup after test completes
    test.info()._adminToCleanup = admin;
    
    try {
      await use(admin);
    } finally {
      // Cleanup admin user after test completes
      if (process.env.CLEANUP_TEST_USERS !== 'false') {
        try {
          // Implement your admin cleanup logic here
          // Example: await cleanupTestUser(admin.id);
        } catch (error) {
          console.error('Error cleaning up admin user:', error);
        }
      }
    }
  },
});

// Add custom test info type
declare global {
  namespace PlaywrightTest {
    interface TestInfo {
      _userToCleanup?: User;
      _adminToCleanup?: User;
    }
  }
}

// Add custom expect matchers
expect.extend({
  async toBeVisible(page: Page, selector: string) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
      return {
        message: () => `expected element ${selector} not to be visible`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `expected element ${selector} to be visible`,
        pass: false,
      };
    }
  },
});

export { expect } from '@playwright/test';
