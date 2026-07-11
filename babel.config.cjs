/**
 * Consumed only by Jest's `react-native` preset when running `test:native`.
 * vitest (esbuild), tsup, and eslint do not read this file, so it has no
 * effect on the web build or lint pipeline.
 */
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
