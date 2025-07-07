import { globalSetup, performLogin, validCredentials } from 'playwright-core-utils';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

// @flow profileFlow
// @flow userDataFlow
describe('Team A Profile Tests', function() {
  this.timeout(30000);

  let browser: Browser;
  let page: Page;

  before(async () => {
    const setup = await globalSetup();
    browser = setup.browser;
    page = setup.page;
    
    // Login and navigate to profile page before tests
    await performLogin(page, validCredentials.username, validCredentials.password);
    await page.click('nav a[href="/profile"]');
  });

  after(async () => {
    await browser.close();
  });

  it('should display correct user information', async () => {
    const username = await page.textContent('.profile-username');
    expect(username).to.equal(validCredentials.username);
    
    const email = await page.textContent('.profile-email');
    expect(email).to.contain('@example.com');
  });

  it('should allow updating profile information', async () => {
    // Click edit button
    await page.click('.edit-profile-btn');
    
    // Update display name
    await page.fill('input[name="displayName"]', 'Updated Name');
    
    // Save changes
    await page.click('.save-profile-btn');
    
    // Verify success message
    const message = await page.textContent('.success-message');
    expect(message).to.contain('Profile updated successfully');
    
    // Verify updated display name is shown
    const displayName = await page.textContent('.profile-display-name');
    expect(displayName).to.equal('Updated Name');
  });
});