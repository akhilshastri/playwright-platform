// Core test utilities
export * from './browser';
export * from './page-objects';
export * from './test-data';
export * from './reporting';
export * from './fixtures';

export interface TestConfig {
  baseUrl: string;
  headless: boolean;
  slowMo: number;
  timeout: number;
  viewport: {
    width: number;
    height: number;
  };
}
