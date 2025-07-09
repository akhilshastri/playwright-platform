import { FullConfig } from '@playwright/test';
import { teardownBrowser } from './core/dist/test-utils/browser';

async function globalTeardown(config: FullConfig) {
  console.log('\n=== Global Test Teardown ===');
  
  try {
    // Perform any global cleanup here
    console.log('Performing global cleanup...');
    
    // Example: Clean up test data from the database
    // await cleanupTestData();
    
    // Ensure all browser instances are closed
    await teardownBrowser();
    
    console.log('Global teardown completed');
  } catch (error) {
    console.error('Error during global teardown:', error);
    throw error;
  }
}

export default globalTeardown;
