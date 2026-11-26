import { pathToFileURL } from 'node:url';
import path from 'node:path';

const libDir = path.resolve(import.meta.dirname, '../extension/lib');

export async function loadLibs() {
  for (const f of ['util.js', 'cbor.js', 'p256.js', 'derive.js', 'cable-qr.js', 'noise.js', 'tunnel.js']) {
    await import(pathToFileURL(path.join(libDir, f)).href);
  }
  return globalThis.APB;
}

let failures = 0;

export function assert(cond, label) {
  if (cond) {
    console.log('  ok  - ' + label);
  } else {
    failures++;
    console.error('  FAIL - ' + label);
  }
}

export function assertEqual(a, b, label) {
  const sa = typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a);
  const sb = typeof b === 'object' && b !== null ? JSON.stringify(b) : String(b);
  assert(sa === sb, label + (sa === sb ? '' : ` (got ${sa}, want ${sb})`));
}

export function getFailures() {
  return failures;
}
