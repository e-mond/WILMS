#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const engines = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')).engines?.node;
const nvmrc = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
const dockerfile = readFileSync(path.join(root, 'Dockerfile'), 'utf8');
const major = Number(process.versions.node.split('.')[0]);

const checks = [
  { name: 'runtime major', pass: major >= 22, detail: process.versions.node },
  { name: 'engines', pass: typeof engines === 'string' && engines.includes('22'), detail: String(engines) },
  { name: '.nvmrc', pass: nvmrc === '22' || nvmrc.startsWith('22'), detail: nvmrc },
  {
    name: 'Dockerfile',
    pass: /FROM node:22\b/.test(dockerfile),
    detail: (dockerfile.match(/^FROM .+$/m) || ['missing'])[0],
  },
];

let failed = false;
for (const check of checks) {
  console.log(`  ${check.pass ? '✓' : '✗'} ${check.name}: ${check.detail}`);
  if (!check.pass) failed = true;
}

if (failed) {
  console.error('FAIL: Node 22 standardization checks');
  process.exit(1);
}
console.log('PASS: Node 22 standardization');
