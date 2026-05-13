import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'one-more-highlight': resolve(__dirname, '../../dist/index.js'),
    },
  },
});
