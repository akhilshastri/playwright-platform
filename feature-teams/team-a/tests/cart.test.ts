import { globalSetup, performLogin, validCredentials } from 'playwright-core-utils';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

// @flow cartFlow
// @flow checkoutFlow
describe('Team A Shopping Cart Tests', function() {
  this.timeout(30000);

  let browser: Browser;
  let page: Page;

  before(async () => {
    const setup = await globalSetup();
    browser = setup.browser;
    page = setup.page;
    
    // Login before testing cart functionality
    await performLogin(page, validCredentials.username, validCredentials.password);
    
    // Clear cart before tests
    await page.click('nav a[href="/cart"]');
    const clearCartButton = await page.$('.clear-cart-btn');
    if (clearCartButton) {
      await clearCartButton.click();
      await page.waitForSelector('.empty-cart-message');
    }
  });

  after(async () => {
    await browser.close();
  });

  it('should add product to cart', async () => {
    // Navigate to products page
    await page.click('nav a[href="/products"]');
    
    // Click on first product
    await page.click('.product-card:first-child');
    
    // Add to cart
    await page.click('.add-to-cart-btn');
    
    // Verify success message
    const message = await page.textContent('.success-message');
    expect(message).to.contain('added to cart');
    
    // Navigate to cart
    await page.click('nav a[href="/cart"]');
    
    // Verify product is in cart
    const cartItems = await page.$$eval('.cart-item', items => items.length);
    expect(cartItems).to.equal(1);
  });

  it('should update product quantity in cart', async () => {
    // Navigate to cart
    await page.click('nav a[href="/cart"]');
    
    // Update quantity
    await page.fill('.quantity-input', '2');
    await page.press('.quantity-input', 'Enter');
    
    // Wait for cart to update
    await page.waitForTimeout(500);
    
    // Verify quantity updated
    const quantity = await page.inputValue('.quantity-input');
    expect(quantity).to.equal('2');
    
    // Verify subtotal updated
    const itemPrice = await page.textContent('.item-price');
    const subtotal = await page.textContent('.item-subtotal');
    
    // Extract numeric values for comparison
    const priceValue = parseFloat(itemPrice.replace(/[^0-9.]/g, ''));
    const subtotalValue = parseFloat(subtotal.replace(/[^0-9.]/g, ''));
    
    expect(subtotalValue).to.equal(priceValue * 2);
  });

  it('should remove product from cart', async () => {
    // Navigate to cart
    await page.click('nav a[href="/cart"]');
    
    // Remove item
    await page.click('.remove-item-btn');
    
    // Wait for cart to update
    await page.waitForSelector('.empty-cart-message');
    
    // Verify cart is empty
    const emptyMessage = await page.textContent('.empty-cart-message');
    expect(emptyMessage).to.contain('Your cart is empty');
  });
});