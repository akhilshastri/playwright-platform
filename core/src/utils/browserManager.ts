
import { chromium, Browser } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config();

export async function launchBrowser(): Promise<Browser> {
  return await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
}
