import { globalSetup, performLogin, validCredentials } from 'playwright-core-utils';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

// @flow navigationFlow
describe('Team A Navigation Tests', function() {
  this.timeout(30000);

  let browser: Browser;
  let page: Page;

  before(async () => {
    const setup = await globalSetup();
    browser = setup.browser;
    page = setup.page;
    
    // Login before testing navigation
    await performLogin(page, validCredentials.username, validCredentials.password);
  });

  after(async () => {
    await browser.close();
  });

  it('should navigate to the dashboard', async () => {
    await page.click('nav a[href="/dashboard"]');
    const url = page.url();
    expect(url).to.contain('/dashboard');
    const heading = await page.textContent('h1');
    expect(heading).to.equal('Dashboard');
  });

  it('should navigate to the profile page', async () => {
    await page.click('nav a[href="/profile"]');
    const url = page.url();
    expect(url).to.contain('/profile');
    const heading = await page.textContent('h1');
    expect(heading).to.equal('User Profile');
  });

  it('should navigate to the settings page', async () => {
    await page.click('nav a[href="/settings"]');
    const url = page.url();
    expect(url).to.contain('/settings');
    const heading = await page.textContent('h1');
    expect(heading).to.equal('Settings');
  });
});