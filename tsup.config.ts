import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/css/index.ts',
      'src/native/index.ts',
      'src/a11y/index.ts',
      'src/navigation/index.ts',
      'src/vanilla/index.ts',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    minify: false,
    target: 'es2022',
    external: ['react', 'react-dom', 'react-native'],
  },
  {
    // Drop-in build for a plain <script src> with no bundler: the vanilla
    // entry only, minified, with its one dependency inlined and `process.env`
    // substituted so nothing reaches for Node globals in a browser.
    entry: { 'omh.global': 'src/vanilla/index.ts' },
    format: ['iife'],
    globalName: 'OMH',
    outExtension: () => ({ js: '.js' }),
    dts: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    splitting: false,
    minify: true,
    target: 'es2022',
    platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
  },
]);
