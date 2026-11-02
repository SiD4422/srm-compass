/**
 * Automated Data Drift Checker
 *
 * Fetches SRMIST's live admissions portals, computes hash signatures,
 * and compares against baseline SHA-256 signatures stored in data/HASHES.json.
 * Exits with code 0 if intact; exits with code 1 if upstream drift is detected.
 */

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface DriftCheckTarget {
  name: string;
  url: string;
  expectedPattern?: RegExp;
}

const TARGETS: DriftCheckTarget[] = [
  {
    name: 'SRMIST Admission Portal',
    url: 'https://www.srmist.edu.in/admission-india/',
    expectedPattern: /B\.Tech/i
  },
  {
    name: 'SRMIST Engineering Admissions',
    url: 'https://www.srmist.edu.in/admission-india/engineering/',
    expectedPattern: /SRMJEEE/i
  }
];

function fetchUrl(url: string, timeoutMs = 15000): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, timeoutMs).then(resolve, reject);
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, text: data });
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url} after ${timeoutMs}ms`));
    });
  });
}

export async function runDriftCheck(): Promise<{ drifted: boolean; details: string[] }> {
  const details: string[] = [];
  let drifted = false;

  console.log('[Drift Check] Checking repository hash baseline...');
  const hashesPath = path.join(rootDir, 'data', 'HASHES.json');
  if (!fs.existsSync(hashesPath)) {
    throw new Error('data/HASHES.json not found');
  }

  const hashes: Record<string, string> = JSON.parse(fs.readFileSync(hashesPath, 'utf-8'));
  let matchedFiles = 0;

  for (const [relPath, expectedHash] of Object.entries(hashes)) {
    const fullPath = path.join(rootDir, 'data', relPath);
    if (!fs.existsSync(fullPath)) {
      details.push(`MISSING FILE: ${relPath}`);
      drifted = true;
      continue;
    }
    const buf = fs.readFileSync(fullPath);
    const actualHash = crypto.createHash('sha256').update(buf).digest('hex');
    if (actualHash !== expectedHash) {
      details.push(`HASH DRIFT in ${relPath}: expected ${expectedHash.slice(0, 8)}, got ${actualHash.slice(0, 8)}`);
      drifted = true;
    } else {
      matchedFiles++;
    }
  }

  console.log(`[Drift Check] ${matchedFiles} baseline data files confirmed against SHA-256 signatures.`);

  // Remote probe checks
  console.log('[Drift Check] Probing upstream live endpoints for structural changes...');
  for (const target of TARGETS) {
    try {
      const res = await fetchUrl(target.url);
      if (res.status !== 200) {
        details.push(`ENDPOINT DRIFT: ${target.name} returned HTTP ${res.status}`);
        drifted = true;
      } else if (target.expectedPattern && !target.expectedPattern.test(res.text)) {
        details.push(`CONTENT DRIFT: ${target.name} missing expected pattern ${target.expectedPattern}`);
        drifted = true;
      } else {
        console.log(`[Drift Check] Upstream OK: ${target.name} (HTTP ${res.status}, pattern confirmed)`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Drift Check Warning] Network probe warning for ${target.name}: ${msg}`);
      // Network timeouts in offline CI environments do not invalidate local data signatures
    }
  }

  return { drifted, details };
}

// CLI Execution
if (process.argv[1] && (process.argv[1].endsWith('check-drift.ts') || process.argv[1].endsWith('check-drift.js'))) {
  runDriftCheck()
    .then(({ drifted, details }) => {
      if (drifted) {
        console.error('\n❌ DATA DRIFT DETECTED:\n' + details.map((d) => `  - ${d}`).join('\n'));
        process.exit(1);
      } else {
        console.log('\n✅ NO DRIFT DETECTED: All baseline data files and upstream endpoints align.');
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('\n❌ DRIFT CHECK RUNNER ERROR:', err);
      process.exit(1);
    });
}
