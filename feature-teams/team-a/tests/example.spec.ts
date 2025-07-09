import { test, expect } from 'playwright-core-utils/test-utils/fixtures/testFixtures';
import { TestReporter } from 'playwright-core-utils/test-utils/reporting/testReporter';
import { UserFactory } from 'playwright-core-utils/test-utils/test-data/factories/UserFactory';

// @flow smoke
// @flow regression
test.describe('Example Test Suite', () => {
  test('should demonstrate test utilities', async ({ page, user }) => {
    TestReporter.logStep('Navigating to the application');
    await page.goto('/');
    
    TestReporter.logStep('Verifying page title');
    await expect(page).toHaveTitle(/Your App Name/);
    
    TestReporter.logStep('Performing login');
    await page.click('button.login');
    await page.fill('#username', user.username);
    await page.fill('#password', user.password);
    await page.click('button[type="submit"]');
    
    TestReporter.logStep('Verifying successful login');
    await expect(page.locator('.welcome-message')).toBeVisible();
    
    // Example of using the test data factory
    const testUser = UserFactory.createUser({
      firstName: 'Test',
      lastName: 'User'
    });
    
    TestReporter.logInfo(`Created test user: ${testUser.username}`);
  });

  test('should handle errors gracefully', async ({ page }) => {
    TestReporter.logStep('Testing error handling');
    await page.goto('/non-existent-page');
    
    // This will fail and trigger a screenshot
    await expect(page.locator('.non-existent-element')).toBeVisible({
      timeout: 2000
    });
  });
});
