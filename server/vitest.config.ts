import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: loadEnv('', path.resolve(__dirname, '..'), ''),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
