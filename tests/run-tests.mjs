import { getFailures } from './helpers.mjs';

const suites = ['./test-cbor.mjs', './test-derive.mjs', './test-cable-qr.mjs', './test-noise.mjs', './test-tunnel.mjs'];

for (const s of suites) {
  const mod = await import(s);
  await mod.run();
}

const failures = getFailures();
if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log('\nall tests passed');
