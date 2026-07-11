import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    // The React Native entry runs under its own Jest config (`test:native`);
    // vitest can't parse RN's Flow-typed source, so keep it out of this glob.
    exclude: ['tests/native/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/index.ts', 'src/native/**', 'src/**/*.d.ts'],
    },
  },
});
