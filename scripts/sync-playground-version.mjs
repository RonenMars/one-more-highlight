#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const rootPkgPath = resolve(here, '..', 'package.json');
const playgroundPkgPath = resolve(here, '..', 'examples', 'playground', 'package.json');

const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf8'));
const playgroundPkg = JSON.parse(readFileSync(playgroundPkgPath, 'utf8'));

const nextRange = `^${rootPkg.version}`;
playgroundPkg.dependencies ??= {};
const prev = playgroundPkg.dependencies[rootPkg.name];
playgroundPkg.dependencies[rootPkg.name] = nextRange;

writeFileSync(playgroundPkgPath, JSON.stringify(playgroundPkg, null, 2) + '\n');

console.log(`[sync-playground-version] ${rootPkg.name}: ${prev ?? '(unset)'} → ${nextRange}`);
