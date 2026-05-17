import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/css/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  target: 'es2022',
  external: ['react', 'react-dom'],
});
