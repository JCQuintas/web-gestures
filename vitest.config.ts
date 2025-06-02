import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(CURRENT_DIR, './');

export default defineConfig({
  test: {
    projects: [
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
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['packages/core/src/**', 'packages/testing/src/**', 'packages/matchers/src/**'],
      skipFull: process.env.CI !== 'true',
      all: true,
      thresholds: {
        autoUpdate: false,
        statements: 50,
        branches: 80,
        functions: 55,
        lines: 50,
      },
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
        'packages/matchers/src/equals.ts',
        'packages/matchers/src/mocks/**',
      ],
    },
  },
});
