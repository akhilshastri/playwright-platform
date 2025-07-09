import { Page } from 'playwright';
import { waitForNetworkIdle } from '../browser';

export abstract class BasePage {
  protected url: string = '/';
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string = ''): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.url}${path}`;
    await this.page.goto(url);
    await waitForNetworkIdle(this.page);
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async getUrl(): Promise<string> {
    return this.page.url();
  }

  async isVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
      return true;
    } catch (e) {
      return false;
    }
  }

  async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    await this.page.fill(selector, text);
  }

  async getText(selector: string): Promise<string | null> {
    return await this.page.textContent(selector);
  }

  async waitFor(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
