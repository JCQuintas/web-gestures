import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // Browser tests with Playwright for real browser behavior
  {
    extends: 'vite.config.ts',
    test: {
      name: 'browser',
      setupFiles: ['./vitest.setup.ts'],
      browser: {
        enabled: true,
        provider: 'playwright',
        headless: true,
        // https://vitest.dev/guide/browser/playwright
        instances: [
          {
            browser: 'chromium',
          },
          {
            browser: 'firefox',
          },
          {
            browser: 'webkit',
          },
        ],
      },
    },
  },
]);
