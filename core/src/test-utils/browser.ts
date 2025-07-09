import { chromium, Browser, BrowserContext, Page, BrowserContextOptions } from 'playwright';
import { TestConfig } from './index';

let browser: Browser;
let context: BrowserContext;
let page: Page;

const defaultConfig: TestConfig = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  headless: process.env.HEADLESS !== 'false',
  slowMo: parseInt(process.env.SLOWMO || '0'),
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  viewport: {
    width: 1280,
    height: 720,
  },
};

export async function setupBrowser(customConfig: Partial<TestConfig> = {}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const config = { ...defaultConfig, ...customConfig };
  
  browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
  });

  const contextOptions: BrowserContextOptions = {
    viewport: config.viewport,
    ignoreHTTPSErrors: true,
    recordVideo: process.env.RECORD_VIDEO ? { dir: 'test-results/videos/' } : undefined,
  };

  context = await browser.newContext(contextOptions);
  page = await context.newPage();
  
  // Set default timeout for all actions
  page.setDefaultTimeout(config.timeout);
  
  return { browser, context, page };
}

export async function teardownBrowser(): Promise<void> {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
}

export async function takeScreenshot(page: Page, name: string): Promise<void> {
  const screenshotPath = `test-results/screenshots/${name.replace(/\s+/g, '_')}_${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved to: ${screenshotPath}`);
}

export async function waitForNetworkIdle(page: Page, timeout = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

// Re-export commonly used Playwright types
export type { Browser, Page, BrowserContext };
