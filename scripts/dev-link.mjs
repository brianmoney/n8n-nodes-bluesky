#!/usr/bin/env node
import { mkdirSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';

// Create a symlink of this package into the CLI custom folder to mimic n8n-node dev linking
const projectRoot = resolve(process.cwd());
const cliHome = resolve(os.homedir(), '.n8n-node-cli');
const customDir = resolve(cliHome, '.n8n', 'custom');
const linkPath = resolve(customDir, 'n8n-nodes-bluesky-enhanced');

mkdirSync(customDir, { recursive: true });

try {
  if (existsSync(linkPath)) {
    rmSync(linkPath, { recursive: true, force: true });
  }
  symlinkSync(projectRoot, linkPath, 'dir');
  console.log(`Linked ${projectRoot} -> ${linkPath}`);
} catch (e) {
  console.error('Failed to create symlink for manual dev link:', e);
  process.exit(1);
}
