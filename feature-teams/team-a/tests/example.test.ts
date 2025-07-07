
import { globalSetup, performLogin, validCredentials } from 'playwright-core-utils';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

// @flow loginFlow
describe('Team A Login Tests', function() {
  this.timeout(30000);

  let browser: Browser;
  let page: Page;

  before(async () => {
    const setup = await globalSetup();
    browser = setup.browser;
    page = setup.page;
  });

  after(async () => {
    await browser.close();
  });

  it('should login successfully', async () => {
    await performLogin(page, validCredentials.username, validCredentials.password);
    const title = await page.title();
    expect(title).to.contain('Dashboard');
  });
});
