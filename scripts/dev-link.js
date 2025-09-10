/* eslint-disable no-console */
'use strict';
const { mkdirSync, rmSync, symlinkSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const os = require('node:os');

// Symlink this repo into node-cli's custom folder: ~/.n8n-node-cli/.n8n/custom
const projectRoot = resolve(process.cwd());
const cliHome = resolve(os.homedir(), '.n8n-node-cli');
const customDir = resolve(cliHome, '.n8n', 'custom');
const linkPath = resolve(customDir, 'n8n-nodes-bluesky-enhanced');

mkdirSync(customDir, { recursive: true });

try {
  if (existsSync(linkPath)) rmSync(linkPath, { recursive: true, force: true });
  symlinkSync(projectRoot, linkPath, 'dir');
  console.log(`Linked ${projectRoot} -> ${linkPath}`);
  process.exit(0);
} catch (e) {
  console.error('Failed to create symlink for manual dev link:', e);
  process.exit(1);
}
