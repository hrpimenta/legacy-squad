import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, chmodSync } from 'node:fs';

// Bundle CLI
execSync(
  'npx esbuild apps/cli/src/index.ts --bundle --platform=node --target=node18 --format=esm --outfile=dist/cli.mjs --external:commander --banner:js="#!/usr/bin/env node"',
  { stdio: 'inherit' },
);

// Copy templates
mkdirSync('dist/templates/claude-commands', { recursive: true });
cpSync('templates/claude-commands', 'dist/templates/claude-commands', { recursive: true });

// Make CLI executable
try { chmodSync('dist/cli.mjs', 0o755); } catch {}

console.log('✅ Build complete');
