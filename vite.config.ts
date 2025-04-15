import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: './',
  publicDir: './dev/public',
  server: {
    open: './dev/index.html',
  },
  build: {
    lib: {
      entry: resolve(__dirname, './src/index.ts'),
      formats: ['cjs'],
      fileName: format => `index.${format}.js`,
    },
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        exports: 'named',
        globals: {},
      },
    },
  },
});
