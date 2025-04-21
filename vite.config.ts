import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: './dev/public',
  server: {
    open: './dev/index.html',
  },
});
