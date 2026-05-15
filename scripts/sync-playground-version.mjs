#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const rootPkgPath = resolve(repoRoot, 'package.json');
const playgroundPkgPath = resolve(repoRoot, 'examples', 'playground', 'package.json');

const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
const playgroundPkg = JSON.parse(readFileSync(playgroundPkgPath, 'utf8'));

const nextRange = `^${rootPkg.version}`;
playgroundPkg.dependencies ??= {};
const prev = playgroundPkg.dependencies[rootPkg.name];
playgroundPkg.dependencies[rootPkg.name] = nextRange;

writeFileSync(playgroundPkgPath, JSON.stringify(playgroundPkg, null, 2) + '\n');

console.log(`[sync-playground-version] ${rootPkg.name}: ${prev ?? '(unset)'} → ${nextRange}`);

// Refresh pnpm-lock.yaml so the specifier bump doesn't strand it out of sync —
// Vercel runs `pnpm install --frozen-lockfile` and will fail on the next deploy
// if the lockfile still pins the previous range.
execFileSync('pnpm', ['install', '--lockfile-only'], { cwd: repoRoot, stdio: 'inherit' });
