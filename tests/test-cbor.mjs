import { loadLibs, assert, assertEqual } from './helpers.mjs';

export async function run() {
  console.log('test-cbor');
  const APB = await loadLibs();
  const { cbor, util } = APB;

  assertEqual(util.hex(cbor.encode(1000)), '1903e8', 'encode uint 1000');
  assertEqual(util.hex(cbor.encode('IETF')), '6449455446', 'encode text IETF');
  assertEqual(util.hex(cbor.encode(-1)), '20', 'encode -1');
  assertEqual(util.hex(cbor.encode(true)), 'f5', 'encode true');

  const dec = cbor.decode(util.fromHex('a10102'));
  assert(dec.value instanceof Map && dec.value.get(1) === 2 && dec.rest.length === 0, 'decode map {1:2}');

  const map = new Map();
  map.set(0, util.randomBytes(33));
  map.set(1, util.randomBytes(16));
  map.set(2, 2);
  map.set(3, 1760000000);
  map.set(4, true);
  map.set(5, 'ga');
  const enc = cbor.encode(map);
  const back = cbor.decode(enc);
  assert(back.value instanceof Map, 'roundtrip map type');
  assertEqual(back.value.get(2), 2, 'roundtrip int');
  assertEqual(back.value.get(3), 1760000000, 'roundtrip large int');
  assertEqual(back.value.get(4), true, 'roundtrip bool');
  assertEqual(back.value.get(5), 'ga', 'roundtrip string');
  assert(util.equalBytes(back.value.get(0), map.get(0)), 'roundtrip bstr 33');
  assert(util.equalBytes(back.value.get(1), map.get(1)), 'roundtrip bstr 16');
  assertEqual(back.rest.length, 0, 'full consumption');

  const arr = cbor.decode(cbor.encode([1, [2, 3], 'x']));
  assertEqual(JSON.stringify(arr.value), JSON.stringify([1, [2, 3], 'x']), 'roundtrip array');
}
