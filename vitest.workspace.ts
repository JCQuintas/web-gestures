import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineWorkspace } from 'vitest/config';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');

export default defineWorkspace([
  // Browser tests with Playwright for real browser behavior
  {
    extends: 'vite.config.ts',
    test: {
      alias: [
        {
          find: `@web-gestures/core`,
          replacement: resolve(WORKSPACE_ROOT, `./packages/core/src`),
        },
        {
          find: `@web-gestures/testing`,
          replacement: resolve(WORKSPACE_ROOT, `./packages/testing/src`),
        },
        {
          find: `@web-gestures/matchers`,
          replacement: resolve(WORKSPACE_ROOT, `./packages/matchers/src`),
        },
      ],
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
          ...(process.env.CI
            ? [
                {
                  browser: 'firefox',
                },
                {
                  browser: 'webkit',
                },
              ]
            : []),
        ],
      },
    },
  },
]);
