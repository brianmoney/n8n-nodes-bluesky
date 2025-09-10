#!/usr/bin/env node
import { AtpAgent } from '@atproto/api';
import fs from 'node:fs';
import path from 'node:path';

function loadDotEnv(dotenvPath) {
  try {
    const text = fs.readFileSync(dotenvPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
    return true;
  } catch {
    return false;
  }
}

// Load .env if present
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
loadDotEnv(path.join(repoRoot, '.env'));

const identifier = process.env.BLUESKY_IDENTIFIER;
const password = process.env.BLUESKY_PASSWORD;
const serviceUrl = process.env.BLUESKY_SERVICE_URL || 'https://bsky.social';

if (!identifier || !password) {
  console.error('[ERROR] Missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD in env');
  process.exit(1);
}

const agent = new AtpAgent({ service: serviceUrl });

function logJson(label, obj) {
  console.log(`\n=== ${label} ===`);
  try { console.log(JSON.stringify(obj, null, 2)); } catch { console.log(obj); }
}

(async () => {
  try {
    console.log(`[INFO] Logging in to ${serviceUrl} as ${identifier}`);
    await agent.login({ identifier, password });
    console.log('[OK] Logged in');

    // getUploadLimits
    try {
      const limits = await agent.api.app.bsky.video.getUploadLimits();
      logJson('getUploadLimits', limits?.data ?? limits);
    } catch (e) {
      console.error('[FAIL] getUploadLimits:', e?.error || e?.message || e);
    }

    // Attempt a tiny upload to probe endpoint
    const buf = Buffer.alloc(1024, 0); // 1KB zeroes - just a probe
    try {
      const up = await agent.api.app.bsky.video.uploadVideo(buf, {
        encoding: 'application/octet-stream',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': String(buf.length),
        },
      });
      logJson('uploadVideo response', up?.data ?? up);
      // If a job id is returned, try status
      const jobId = up?.data?.jobId || up?.data?.job?.id || up?.data?.id;
      if (jobId) {
        try {
          const status = await agent.api.app.bsky.video.getJobStatus({ jobId });
          logJson(`getJobStatus(${jobId})`, status?.data ?? status);
        } catch (e) {
          console.error(`[FAIL] getJobStatus(${jobId}):`, e?.error || e?.message || e);
        }
      }
    } catch (e) {
      console.error('[FAIL] uploadVideo:', e?.error || e?.message || e);
    }
  } catch (err) {
    console.error('[ERROR] Top-level:', err?.message || err);
    process.exit(2);
  }
})();
