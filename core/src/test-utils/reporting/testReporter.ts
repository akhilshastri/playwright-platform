import { TestInfo } from '@playwright/test';
import { Page } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = 'test-results/screenshots';
const TRACES_DIR = 'test-results/traces';

export class TestReporter {
  static async onTestBegin(testInfo: TestInfo): Promise<void> {
    // Ensure directories exist
    this.ensureDirectoryExists(SCREENSHOTS_DIR);
    this.ensureDirectoryExists(TRACES_DIR);
    
    console.log(`\n=== Starting test: ${testInfo.title} ===`);
  }

  static async onTestEnd(testInfo: TestInfo, page: Page): Promise<void> {
    const testStatus = testInfo.status;
    const testName = testInfo.title.replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Take screenshot on test failure
    if (testStatus === 'failed' || testStatus === 'timedOut') {
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${testName}_${timestamp}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testInfo.attachments.push({
        name: 'screenshot',
        path: screenshotPath,
        contentType: 'image/png'
      });
      console.log(`Screenshot saved: ${screenshotPath}`);
    }
    
    // Save trace on failure
    if (testStatus === 'failed' && process.env.TRACE === 'on') {
      const traceFile = path.join(TRACES_DIR, `${testName}_${timestamp}.zip`);
      await page.context().tracing.stop({ path: traceFile });
      testInfo.attachments.push({
        name: 'trace',
        path: traceFile,
        contentType: 'application/zip'
      });
      console.log(`Trace saved: ${traceFile}`);
    }
    
    console.log(`=== Test ${testStatus.toUpperCase()}: ${testInfo.title} ===\n`);
  }
  
  static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  static logStep(step: string): void {
    console.log(`[STEP] ${step}`);
  }
  
  static logInfo(message: string): void {
    console.log(`[INFO] ${message}`);
  }
  
  static logError(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
}
