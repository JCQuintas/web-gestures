import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/core/src/**', 'packages/testing/src/**'],
      skipFull: process.env.CI !== 'true',
      thresholds: {
        autoUpdate: true,
        statements: 46.06,
        branches: 89.41,
        functions: 76.29,
        lines: 46.06,
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
