
import { globalSetup } from 'playwright-core-utils/dist/utils/setup';
import { performLogin } from 'playwright-core-utils/dist/flows/loginFlow';
import { validCredentials } from 'playwright-core-utils/dist/utils/testData';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

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
