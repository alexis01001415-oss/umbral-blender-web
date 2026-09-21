import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Read the shipped asset, rather than duplicating its authoring script or mocks.
const bytes = readFileSync(new URL('../public/models/umbral-room.glb', import.meta.url));
assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'The model must be a GLB file.');
assert.equal(bytes.readUInt32LE(4), 2, 'The model must use GLB version 2.');
assert.equal(bytes.readUInt32LE(8), bytes.length, 'The GLB must not be truncated.');
const chunks = [];
for (let offset = 12; offset < bytes.length;) {
  assert.ok(offset + 8 <= bytes.length, 'The chunk header must fit in the GLB.');
  const length = bytes.readUInt32LE(offset);
  assert.equal(length % 4, 0, 'GLB chunks must have four-byte alignment.');
  assert.ok(offset + 8 + length <= bytes.length, 'The chunk payload must fit in the GLB.');
  chunks.push({ type: bytes.readUInt32LE(offset + 4), data: bytes.subarray(offset + 8, offset + 8 + length) });
  offset += 8 + length;
}
assert.equal(chunks[0]?.type, 0x4e4f534a, 'JSON must be the first GLB chunk.');
const gltf = JSON.parse(chunks[0].data.toString('utf8'));
const binary = chunks.find((chunk) => chunk.type === 0x004e4942)?.data;
assert.ok(binary, 'The scene must contain embedded binary data.');

const widths = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const formats = {
  5120: [1, 'readInt8'], 5121: [1, 'readUInt8'],
  5122: [2, 'readInt16LE'], 5123: [2, 'readUInt16LE'],
  5125: [4, 'readUInt32LE'], 5126: [4, 'readFloatLE'],
};

function readAccessor(index) {
  const accessor = gltf.accessors[index];
  assert.ok(accessor, `Accessor ${index} exists.`);
  assert.ok(!accessor.sparse, 'The inspected animation/geometry accessor must be directly readable.');
  const view = gltf.bufferViews[accessor.bufferView];
  const count = widths[accessor.type];
  const [size, method] = formats[accessor.componentType] || [];
  assert.ok(view && count && size, `Accessor ${index} has a supported storage format.`);
  const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const stride = view.byteStride || count * size;
  assert.ok(start + (accessor.count - 1) * stride + count * size <= (view.byteOffset || 0) + view.byteLength,
    `Accessor ${index} must stay inside its buffer view.`);
  return Array.from({ length: accessor.count }, (_, row) => Array.from({ length: count }, (_, column) => {
    const value = binary[method](start + row * stride + column * size);
    assert.ok(Number.isFinite(value), `Accessor ${index} must not contain NaN or Infinity.`);
    return value;
  }));
}

function node(name) {
  const matches = gltf.nodes.filter((item) => item.name === name);
  assert.equal(matches.length, 1, `The core node ${name} must exist exactly once.`);
  return matches[0];
}

function descendants(root) {
  const found = new Set();
  const visit = (item) => {
    assert.ok(item, 'Every child reference must point to a node.');
    assert.ok(!found.has(item), 'The editable hierarchy must not contain cycles or shared children.');
    found.add(item);
    (item.children || []).forEach((index) => visit(gltf.nodes[index]));
  };
  visit(root);
  return found;
}

function track(clipName, nodeName, path) {
  const clip = gltf.animations?.find((item) => item.name === clipName);
  assert.ok(clip, `The exported ${clipName} clip must exist.`);
  const channel = clip.channels.find((item) => gltf.nodes[item.target.node]?.name === nodeName && item.target.path === path);
  assert.ok(channel, `${clipName} must animate ${nodeName}.${path}.`);
  const sampler = clip.samplers[channel.sampler];
  const times = readAccessor(sampler.input).map(([time]) => time);
  const output = readAccessor(sampler.output);
  const values = sampler.interpolation === 'CUBICSPLINE' ? times.map((_, index) => output[index * 3 + 1]) : output;
  assert.ok(times.length >= 2, `${nodeName}.${path} needs more than a still frame.`);
  assert.equal(values.length, times.length, 'Every animation time must have a value.');
  times.forEach((time, index) => {
    assert.ok(time >= 0 && (!index || time > times[index - 1]), 'Keyframe times must be nonnegative and strictly increasing.');
  });
  assert.ok(times.at(-1) > times[0], 'The clip must have a positive duration.');
  return { times, values, first: values[0], last: values.at(-1) };
}

function close(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message} (${actual} versus ${expected})`);
}

test('GLB binary data and buffer views are complete and self-contained', () => {
  assert.equal(gltf.asset.version, '2.0');
  assert.equal(gltf.buffers.length, 1);
  assert.equal(gltf.buffers[0].uri, undefined, 'The binary payload must not depend on an external file.');
  assert.ok(gltf.buffers[0].byteLength <= binary.length);
  assert.ok(binary.length - gltf.buffers[0].byteLength <= 3, 'Only GLB padding may follow the buffer.');
  for (const view of gltf.bufferViews) {
    assert.equal(view.buffer, 0);
    assert.ok((view.byteOffset || 0) + view.byteLength <= gltf.buffers[0].byteLength, 'Every buffer view must fit in the embedded buffer.');
  }
});

test('room assemblies remain editable under named empty groups', () => {
  const root = node('ROOT_Umbral');
  const members = descendants(root);
  const scene = gltf.scenes[gltf.scene || 0];
  assert.ok(scene.nodes.some((index) => gltf.nodes[index] === root), 'The editable root must be in the default scene.');
  for (const name of ['ROOT_Umbral', 'GROUP_Architecture', 'GROUP_Blind', 'GROUP_Armchair', 'GROUP_Lamp', 'GROUP_Cameras', 'GROUP_Exterior']) {
    const group = node(name);
    assert.ok(members.has(group), `${name} must belong to the room root.`);
    assert.equal(group.mesh, undefined, `${name} must remain an empty parent rather than a combined mesh.`);
    assert.ok(group.children?.length, `${name} must contain editable children.`);
  }
  const blind = descendants(node('GROUP_Blind'));
  for (const name of ['BLIND_Fabric', 'BLIND_BottomRail', 'BLIND_Roller']) {
    assert.ok(blind.has(node(name)), `${name} must move with GROUP_Blind, including through helper empties.`);
  }
});

test('fabric has usable geometry, UVs, and embedded color and surface textures', () => {
  assert.ok(gltf.images?.length && gltf.textures?.length, 'The exported room must contain textures.');
  for (const image of gltf.images) {
    assert.equal(image.uri, undefined, 'Images must be embedded for portable GLB downloads.');
    const view = gltf.bufferViews[image.bufferView];
    assert.ok(view?.byteLength > 16, `${image.name || 'Image'} must have a real payload.`);
    const payload = binary.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    if (image.mimeType === 'image/png') assert.deepEqual([...payload.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    else if (image.mimeType === 'image/jpeg') assert.deepEqual([...payload.subarray(0, 3)], [255, 216, 255]);
    else assert.fail(`Add payload validation for image format ${image.mimeType}.`);
  }
  for (const texture of gltf.textures) assert.ok(gltf.images[texture.source], 'Every texture must point to an embedded image.');
  const primitive = gltf.meshes[node('BLIND_Fabric').mesh].primitives[0];
  const positions = readAccessor(primitive.attributes.POSITION);
  const uv = readAccessor(primitive.attributes.TEXCOORD_0);
  assert.equal(uv.length, positions.length, 'Every fabric vertex needs a UV coordinate.');
  const extent = (rows, axis) => Math.max(...rows.map((row) => row[axis])) - Math.min(...rows.map((row) => row[axis]));
  assert.ok(extent(positions, 0) > 1 && extent(positions, 1) > 1, 'The fabric must span a room-sized window.');
  assert.ok(extent(positions, 2) < .1, 'The fabric must remain a thin sheet.');
  assert.ok(extent(uv, 0) > 0 && extent(uv, 1) > 0, 'Fabric UVs must cover both texture axes.');
  const material = gltf.materials[primitive.material];
  const color = gltf.textures[material.pbrMetallicRoughness?.baseColorTexture?.index];
  const normal = gltf.textures[material.normalTexture?.index];
  assert.ok(color && normal, 'The blind must retain its woven color and surface-detail textures.');
  assert.notEqual(color.source, normal.source, 'A diffuse color image must not be reused as a tangent-space normal map.');
});

test('closing lowers the rail while preserving its lateral alignment', () => {
  const rail = track('Blind_Close', 'BLIND_BottomRail', 'translation');
  assert.ok(rail.first[1] - rail.last[1] > 1, 'Closing must lower the rail by a substantial window height along glTF Y.');
  rail.values.forEach((value, index) => {
    close(value[0], rail.first[0], .02, 'The rail must remain in its horizontal guides.');
    close(value[2], rail.first[2], .02, 'The rail must remain at the window depth.');
    if (index) assert.ok(value[1] <= rail.values[index - 1][1] + .0001, 'The closing rail must not reverse during its stroke.');
  });
});

test('closing extends fabric vertically without horizontal stretching or gaps at the rail', () => {
  const fabric = node('BLIND_Fabric');
  const scale = track('Blind_Close', 'BLIND_Fabric', 'scale');
  const rail = track('Blind_Close', 'BLIND_BottomRail', 'translation');
  assert.ok(scale.last[1] > scale.first[1] * 2, 'The closed fabric must be longer than the rolled-up fabric.');
  scale.values.forEach((value, index) => {
    assert.ok(value.every((component) => component > 0), 'Fabric scaling must not flatten or invert its geometry.');
    close(value[0], scale.first[0], .0001, 'The fabric width must stay constant.');
    close(value[2], scale.first[2], .0001, 'The fabric thickness must stay constant.');
    if (index) assert.ok(value[1] >= scale.values[index - 1][1] - .0001, 'Fabric extension must progress consistently with closing.');
  });
  const primitive = gltf.meshes[fabric.mesh].primitives[0];
  const positions = readAccessor(primitive.attributes.POSITION);
  const top = Math.max(...positions.map((value) => value[1]));
  const bottom = Math.min(...positions.map((value) => value[1]));
  close(top, 0, .01, 'The fabric origin must anchor the sheet at its top.');
  const offset = fabric.translation?.[1] || 0;
  close(offset + bottom * scale.first[1], rail.first[1], .04, 'The open fabric hem must meet the rail.');
  close(offset + bottom * scale.last[1], rail.last[1], .04, 'The closed fabric hem must meet the rail.');
});

test('roller rotation and the dedicated camera travel are real exported motion', () => {
  const roller = track('Blind_Close', 'BLIND_Roller', 'rotation');
  const cameraPosition = track('Camera_Travel', 'CAMERA_Hero', 'translation');
  const cameraRotation = track('Camera_Travel', 'CAMERA_Hero', 'rotation');
  const cameraTree = descendants(node('CAMERA_Hero'));
  assert.ok([...cameraTree].some((item) => item.camera !== undefined && gltf.cameras[item.camera]), 'The animated camera node must contain an exported camera.');
  assert.ok(Math.hypot(...cameraPosition.last.map((value, axis) => value - cameraPosition.first[axis])) > .05, 'Camera travel must move the viewing position.');
  for (const quaternion of [...roller.values, ...cameraRotation.values]) close(Math.hypot(...quaternion), 1, .001, 'Animation quaternions must be normalized.');
  assert.ok(roller.values.some((value) => Math.abs(value.reduce((sum, component, axis) => sum + component * roller.first[axis], 0)) < .99),
    'The roller must turn between frames, even when complete revolutions have equal endpoints.');
});
