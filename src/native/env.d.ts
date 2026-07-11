// Metro/Hermes inject `process.env.NODE_ENV` at runtime, but the RN type
// package does not declare a `process` global and this tsconfig intentionally
// omits `@types/node` (RN is not Node). Declare only the field the shared
// pipeline reads for its dev-only warnings.
declare const process: {
  env: {
    NODE_ENV?: string;
  };
};
