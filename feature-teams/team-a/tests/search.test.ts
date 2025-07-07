import { globalSetup, performLogin, validCredentials } from 'playwright-core-utils';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

// @flow searchFlow
describe('Team A Search Tests', function() {
  this.timeout(30000);

  let browser: Browser;
  let page: Page;

  before(async () => {
    const setup = await globalSetup();
    browser = setup.browser;
    page = setup.page;
    
    // Login before testing search functionality
    await performLogin(page, validCredentials.username, validCredentials.password);
    // Navigate to search page
    await page.click('nav a[href="/search"]');
  });

  after(async () => {
    await browser.close();
  });

  it('should display search results for valid query', async () => {
    // Enter search query
    await page.fill('input[name="searchQuery"]', 'test product');
    
    // Click search button
    await page.click('button[type="submit"]');
    
    // Wait for results to load
    await page.waitForSelector('.search-results');
    
    // Verify results are displayed
    const resultsCount = await page.$$eval('.search-result-item', items => items.length);
    expect(resultsCount).to.be.greaterThan(0);
    
    // Verify search query is displayed in results
    const searchSummary = await page.textContent('.search-summary');
    expect(searchSummary).to.contain('test product');
  });

  it('should show no results message for invalid query', async () => {
    // Enter invalid search query
    await page.fill('input[name="searchQuery"]', 'xyznonexistentproduct123');
    
    // Click search button
    await page.click('button[type="submit"]');
    
    // Wait for no results message
    await page.waitForSelector('.no-results-message');
    
    // Verify no results message is displayed
    const noResultsMessage = await page.textContent('.no-results-message');
    expect(noResultsMessage).to.contain('No results found');
  });

  it('should filter search results by category', async () => {
    // Enter search query
    await page.fill('input[name="searchQuery"]', 'test');
    
    // Select category filter
    await page.selectOption('select[name="category"]', 'electronics');
    
    // Click search button
    await page.click('button[type="submit"]');
    
    // Wait for results to load
    await page.waitForSelector('.search-results');
    
    // Verify category filter is applied
    const categoryBadge = await page.textContent('.applied-filters');
    expect(categoryBadge).to.contain('electronics');
    
    // Verify all results are from the selected category
    const categoryLabels = await page.$$eval('.result-category', labels => 
      labels.every(label => label.textContent.toLowerCase().includes('electronics')));
    expect(categoryLabels).to.be.true;
  });
});