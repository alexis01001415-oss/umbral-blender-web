import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

const asset = (name) => readFileSync(new URL(`../public/hero/${name}`, import.meta.url));
const geometry = JSON.parse(asset('hero-geometry.json'));

// Inspect the delivered WebP headers; do not trust dimensions copied into JSON.
function webp(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.readUInt32LE(4) + 8, bytes.length, 'WebP must not be truncated');
  const result = { alpha: false };
  for (let offset = 12; offset < bytes.length;) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    assert.ok(start + length <= bytes.length);
    if (type === 'VP8X') {
      result.width = bytes.readUIntLE(start + 4, 3) + 1;
      result.height = bytes.readUIntLE(start + 7, 3) + 1;
      result.alpha = Boolean(bytes[start] & 0x10);
    } else if (type === 'VP8 ') {
      assert.equal(bytes.subarray(start + 3, start + 6).toString('hex'), '9d012a');
      result.width ??= bytes.readUInt16LE(start + 6) & 0x3fff;
      result.height ??= bytes.readUInt16LE(start + 8) & 0x3fff;
    } else if (type === 'ALPH') {
      result.alpha = true;
    }
    offset = start + length + (length % 2);
  }
  assert.ok(result.width > 0 && result.height > 0);
  return result;
}

for (const [layout, item] of Object.entries(geometry)) {
  test(`${layout}: open and closed images match the camera geometry and remain lightweight`, () => {
    for (const state of ['open', 'closed']) {
      const bytes = asset(item[state].file);
      const actual = webp(bytes);
      assert.equal(actual.width, item.width);
      assert.equal(actual.height, item.height);
      assert.equal(actual.alpha, false, 'Endpoint images must be opaque');
      assert.equal(bytes.length, item[state].bytes);
      assert.ok(bytes.length < 310_000, 'Each hero endpoint must remain under 310 KB');
    }
    assert.notDeepEqual(asset(item.open.file), asset(item.closed.file), 'Endpoints must depict different curtain states');
  });

  test(`${layout}: moving rail aligns with the opaque fabric aperture`, () => {
    const [left, top] = item.apertureTopLeft;
    const [right, bottom] = item.apertureBottomRight;
    assert.ok(0 <= left && left < right && right <= 1);
    assert.ok(0 <= top && top < bottom && bottom <= 1);
    assert.ok(item.openRailCenter > top && item.openRailCenter < bottom);
    assert.equal(item.closedRailCenter, bottom, 'Closed rail must reach the bottom of the curtain');
    assert.ok(Math.abs(left + right - 1) < .000002, 'The window must be centered');
    const actual = webp(asset(item.rail.file));
    assert.equal(actual.width, item.width, 'Rail sprite retains the full camera frame width');
    assert.equal(actual.height, item.rail.height);
    assert.ok(actual.alpha, 'Moving rail must have a transparent background');
    assert.equal(item.rail.centerOffsetPx, actual.height / 2);
    assert.ok(actual.height < item.height * .04, 'Rail is a compact sprite, not a full transparent frame');
  });
}

test('editable Blender hero is independently packed and passes the saved-scene animation audit', () => {
  const blend = readFileSync(new URL('../blender/hero/Hero-Umbral.blend', import.meta.url));
  const audit = JSON.parse(readFileSync(new URL('../blender/hero/validation-report.json', import.meta.url), 'utf8'));
  // Blender 5 can use Zstandard compression; the read-only Blender audit below
  // verifies its internal structure regardless of on-disk compression.
  assert.ok(blend.toString('ascii', 0, 7) === 'BLENDER' || blend.readUInt32LE(0) === 0xfd2fb528,
    'Source must be a plain or Zstandard-compressed Blender file');
  assert.equal(audit.sha256, createHash('sha256').update(blend).digest('hex'), 'Rerun validate_hero.py after editing the .blend');
  assert.equal(audit.engine, 'BLENDER_EEVEE');
  assert.equal(audit.allFileImagesPacked, true);
  assert.equal(audit.linkedLibraries, 0, 'The new hero cannot depend on the original room .blend');
  assert.equal(audit.opaqueFabric, true);
  assert.equal(audit.staticCameras, true);
  assert.equal(audit.fixedWeaveSpace, true, 'The fabric weave must not stretch during deployment');
  assert.equal(audit.projectionMatchesWebMetadata, true);
  assert.equal(audit.durationSeconds, 6);
  assert.equal(audit.fps, 24);
  assert.equal(audit.groupNames.length, 6);
  for (const frame of audit.frames) {
    assert.ok(Math.abs(frame.topZ - 3.635) < .00001);
    assert.ok(Math.abs(frame.bottomZ - frame.railZ) < .00001);
  }
  assert.ok(audit.frames[0].fabricScaleZ < .03);
  assert.equal(audit.frames.at(-1).fabricScaleZ, 1);
});
