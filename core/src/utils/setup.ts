
import { launchBrowser } from '@utils/browserManager';
import { Browser, Page } from 'playwright';

export async function globalSetup(): Promise<{ browser: Browser; page: Page }> {
  const browser = await launchBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  return { browser, page };
}
