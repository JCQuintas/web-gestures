import { defineConfig } from 'vite';

export default defineConfig({
  root: './dev',
  publicDir: './dev/public',
  server: {
    open: true,
  },
  build: {
    outDir: '../dist/demo',
    emptyOutDir: true,
  },
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development',
      DEBUG_GESTURES: process.env.DEBUG_GESTURES || 'false',
    },
  },
});
