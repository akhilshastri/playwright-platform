import { globalSetup, performLogin, validCredentials } from 'playwright-core-utils';
import { Browser, Page } from 'playwright';
import { expect } from 'chai';

// @flow checkoutFlow
// @flow paymentFlow
describe('Team A Checkout Tests', function() {
  this.timeout(30000);

  let browser: Browser;
  let page: Page;

  before(async () => {
    const setup = await globalSetup();
    browser = setup.browser;
    page = setup.page;
    
    // Login before testing checkout functionality
    await performLogin(page, validCredentials.username, validCredentials.password);
    
    // Add a product to cart before checkout tests
    await page.click('nav a[href="/products"]');
    await page.click('.product-card:first-child');
    await page.click('.add-to-cart-btn');
    await page.waitForSelector('.success-message');
  });

  after(async () => {
    await browser.close();
  });

  it('should navigate to checkout from cart', async () => {
    // Navigate to cart
    await page.click('nav a[href="/cart"]');
    
    // Proceed to checkout
    await page.click('.checkout-btn');
    
    // Verify we're on the checkout page
    const url = page.url();
    expect(url).to.contain('/checkout');
    
    const heading = await page.textContent('h1');
    expect(heading).to.equal('Checkout');
  });

  it('should display correct order summary', async () => {
    // Navigate to checkout
    await page.click('nav a[href="/cart"]');
    await page.click('.checkout-btn');
    
    // Verify order summary
    const subtotal = await page.textContent('.order-subtotal');
    expect(subtotal).to.not.be.empty;
    
    const tax = await page.textContent('.order-tax');
    expect(tax).to.not.be.empty;
    
    const total = await page.textContent('.order-total');
    expect(total).to.not.be.empty;
    
    // Verify product details in summary
    const productName = await page.textContent('.order-item-name');
    expect(productName).to.not.be.empty;
  });

  it('should allow entering shipping information', async () => {
    // Navigate to checkout
    await page.click('nav a[href="/cart"]');
    await page.click('.checkout-btn');
    
    // Fill shipping form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="address"]', '123 Test St');
    await page.fill('input[name="city"]', 'Test City');
    await page.fill('input[name="zipCode"]', '12345');
    await page.selectOption('select[name="country"]', 'United States');
    
    // Continue to payment
    await page.click('.continue-to-payment-btn');
    
    // Verify we're on the payment section
    const paymentSection = await page.isVisible('.payment-section');
    expect(paymentSection).to.be.true;
  });

  it('should allow entering payment information', async () => {
    // Navigate to checkout and shipping
    await page.click('nav a[href="/cart"]');
    await page.click('.checkout-btn');
    await page.click('.continue-to-payment-btn');
    
    // Fill payment form
    await page.fill('input[name="cardNumber"]', '4111111111111111');
    await page.fill('input[name="cardName"]', 'John Doe');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    
    // Place order
    await page.click('.place-order-btn');
    
    // Verify order confirmation
    await page.waitForSelector('.order-confirmation');
    const confirmationMessage = await page.textContent('.confirmation-message');
    expect(confirmationMessage).to.contain('Your order has been placed');
    
    const orderNumber = await page.textContent('.order-number');
    expect(orderNumber).to.match(/\d+/);
  });
});