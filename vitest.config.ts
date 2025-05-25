import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      include: ['packages/core/src/**', 'packages/testing/src/**', 'packages/matchers/src/**'],
      skipFull: process.env.CI !== 'true',
      thresholds: {
        autoUpdate: true,
        statements: 51.08,
        branches: 89.83,
        functions: 89.83,
        lines: 51.08,
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
      ],
    },
  },
});