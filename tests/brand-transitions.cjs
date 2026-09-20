const assert = require('node:assert/strict');
const {createCanvas} = require('@napi-rs/canvas');
require('../src/collage-brand.js');
require('../src/collage-core.js');

const C = globalThis.CollageCore;
const B = globalThis.CollageBrand;
const square = {id: 4, width: 256, height: 256};
const wordmark = {id: 5, width: 900, height: 160};

function frameIn(area, frame) {
  return frame.x >= area.x - 1e-7 && frame.y >= area.y - 1e-7 &&
    frame.x + frame.w <= area.x + area.w + 1e-7 &&
    frame.y + frame.h <= area.y + area.h + 1e-7;
}

for (const ratio of ['1:1', '4:5']) for (const layout of C.layouts) for (const spacing of [[0, 0], [64, 48]]) for (const placement of ['none', 'corner', 'top', 'bottom']) {
  const state = C.defaults();
  Object.assign(state, {ratio, layout: layout.id, margin: spacing[0], gap: spacing[1]});
  state.brand = {...state.brand, square, wordmark, placement: 'none', padding: 12, squareSize: .24, wordmarkSize: .4};
  const initialBoxes = C.frameBoxes(state);
  initialBoxes.forEach((box, i) => { state.slots[i].frame = {...box}; });
  B.update(state, brand => { brand.padding = 64; });
  const area = B.measure(C.size(state), state.brand).photoArea;
  state.slots.forEach((slot, i) => assert(frameIn(area, slot.frame), `${ratio}/${layout.id}/${spacing}/${placement} frame ${i} escaped photo area`));
  const roundTripBefore = state.slots.map(slot => ({...slot.frame}));
  B.update(state, brand => { brand.placement = 'none'; });
  B.update(state, brand => { brand.placement = 'top'; });
  B.update(state, brand => { brand.placement = 'bottom'; });
  B.update(state, brand => { brand.placement = 'none'; });
  state.slots.forEach((slot, i) => {
    for (const key of ['x', 'y', 'w', 'h']) assert(Math.abs(slot.frame[key] - roundTripBefore[i][key]) < 1e-7, `${ratio}/${layout.id}/${spacing} ${key} did not round-trip`);
  });
  B.update(state, brand => { brand.placement = placement; });
  const placedArea = B.measure(C.size(state), state.brand).photoArea;
  state.slots.forEach((slot, i) => assert(frameIn(placedArea, slot.frame), `${ratio}/${layout.id}/${spacing}/${placement} frame ${i} escaped placement area`));
  for (const next of ['top', 'bottom', 'none', 'corner', 'none']) {
    B.update(state, brand => { brand.placement = next; });
    const nextArea = B.measure(C.size(state), state.brand).photoArea;
    state.slots.forEach((slot, i) => assert(frameIn(nextArea, slot.frame), `${ratio}/${layout.id}/${next} frame ${i} escaped after repeat transition`));
  }
}

const rollback = C.defaults();
rollback.brand = {...rollback.brand, square, wordmark, placement: 'corner'};
rollback.slots[0].frame = {x: 20, y: 20, w: 300, h: 200};
const originalBrand = {...rollback.brand};
const originalFrame = {...rollback.slots[0].frame};
assert.throws(() => B.update(rollback, brand => { brand.placement = 'top'; brand.wordmark = null; }), /有效標誌/);
assert.deepEqual(rollback.brand, originalBrand, 'invalid brand update should roll back brand state');
assert.deepEqual(rollback.slots[0].frame, originalFrame, 'invalid brand update should roll back frames');
assert.deepEqual(B.sizeRange('corner'), {min: 6, max: 24});
assert.deepEqual(B.sizeRange('top'), {min: 12, max: 40});

const tall = B.measure({w: 1080, h: 1350}, {placement: 'top', wordmark: {id: 8, width: 100, height: 1000}, padding: 12, wordmarkSize: .4});
assert(tall.band.h <= 1350 * .2 + 1e-7, 'tall wordmark band exceeds 20% canvas height');
assert(Math.abs(tall.logo.w / tall.logo.h - .1) < 1e-7, 'wordmark aspect ratio changed');

const pixels = createCanvas(1080, 1350);
const ctx = pixels.getContext('2d');
const logo = createCanvas(100, 20);
logo.getContext('2d').fillStyle = '#00345C';
logo.getContext('2d').fillRect(0, 0, 100, 20);
const renderState = C.defaults();
renderState.ratio = '4:5';
renderState.brand = {...renderState.brand, wordmark: {id: 4, width: 100, height: 20}, placement: 'top', padding: 12, wordmarkSize: .4};
const photos = Array.from({length: 4}, () => { const image = createCanvas(300, 300); image.getContext('2d').fillStyle = '#E85D04'; image.getContext('2d').fillRect(0, 0, 300, 300); return image; });
C.draw(ctx, [...photos, logo], renderState);
const band = B.measure(C.size(renderState), renderState.brand);
assert.deepEqual([...ctx.getImageData(1, 1, 1, 1).data].slice(0, 3), [255, 255, 255], 'wordmark band must be white');
assert.deepEqual([...ctx.getImageData(Math.round(band.logo.x + band.logo.w / 2), Math.round(band.logo.y + band.logo.h / 2), 1, 1).data].slice(0, 3), [0, 52, 92], 'native logo pixels must be rendered');
assert(band.band.h <= 1350 * .2 + 1e-7, 'brand band exceeds 20% canvas height');
console.log('PASS: brand update rollback, ratio/layout/placement frame transitions, size ranges, and native logo pixels.');
