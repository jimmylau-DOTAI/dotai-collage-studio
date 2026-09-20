const assert = require('node:assert/strict');
const {JSDOM} = require('jsdom');
const Palette = require('../src/collage-palette.js');

function setup(seed, opts = {}) {
  const dom = new JSDOM('<div id="swatches"></div><input id="bg-color" type="color" value="#FFFFFF"><button id="save-color">save</button><div id="saved-colors"></div>');
  const data = Object.assign({}, seed); const messages = []; let color = '#FFFFFF';
  const storage = opts.storage || { getItem: k => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
  const mounted = Palette.mount({document: dom.window.document, storage, getColor: () => color, applyColor: c => { color = c; }, notify: (m, bad) => messages.push([m, bad]), prompt: opts.prompt || (() => '我的色')});
  return {dom, data, messages, storage, mounted, get color() { return color; }, set color(v) { color = v; }};
}
function click(el) { el.dispatchEvent(new el.ownerDocument.defaultView.Event('click', {bubbles: true})); }

{
  const x = setup();
  assert(x.dom.window.document.querySelectorAll('#swatches .swatch').length >= 12, 'General palette includes neutral, warm and cool choices');
  click(x.dom.window.document.querySelector('#swatches [data-color="#0B63F6"]'));
  assert.equal(x.color, '#0B63F6'); assert.equal(x.dom.window.document.querySelector('#bg-color').value, '#0b63f6');
}
{
  let n = 0; const x = setup({}, {prompt: () => (++n === 1 ? '  <img src=x onerror=1>  ' : '改名後')});
  click(x.dom.window.document.querySelector('#save-color')); assert.equal(x.dom.window.document.querySelector('.saved-color .swatch').textContent, '<img src=x onerror=1');
  assert.equal(x.dom.window.document.querySelector('img'), null); click(x.dom.window.document.querySelector('.saved-color-action'));
  assert.equal(x.dom.window.document.querySelector('.saved-color .swatch').textContent, '改名後');
  click(x.dom.window.document.querySelectorAll('.saved-color-action')[1]); assert.equal(x.dom.window.document.querySelectorAll('.saved-color').length, 0);
}
{
  const seed = {}; const x = setup(seed, {prompt: () => 'one'});
  click(x.dom.window.document.getElementById('save-color'));
  const y = setup(x.data, {prompt: () => 'one'}); assert.equal(y.dom.window.document.querySelector('.saved-color .swatch').textContent, 'one');
  click(x.dom.window.document.querySelector('#save-color')); assert.match(x.messages.at(-1)[0], /相同名稱/);
  const bad = setup({[Palette.KEY]: '{bad'}); assert.ok(bad.messages.some(m => m[1]));
}
{
  const x = setup(); let count = 0; x.storage.setItem = () => { count++; throw new Error('denied'); }; x.dom.window.document.getElementById('save-color').dispatchEvent(new x.dom.window.Event('click')); assert.equal(count, 1); assert.equal(x.dom.window.document.querySelectorAll('.saved-color').length, 0); assert.ok(x.messages.at(-1)[1]);
}
{
  const names = Array.from({length: 8}, (_, i) => ({name: 'n' + i, color: '#123456'}));
  const x = setup({[Palette.KEY]: JSON.stringify(names)}, {prompt: () => 'ninth'});
  click(x.dom.window.document.getElementById('save-color'));
  assert.equal(x.dom.window.document.querySelectorAll('.saved-color').length, 8);
  assert.match(x.messages.at(-1)[0], /8/);
}
{
  const long = 'abcdefghijklmnopqrstuv'; const x = setup({[Palette.KEY]: JSON.stringify([{name: long, color: '#123456'}])}, {prompt: () => long});
  click(x.dom.window.document.getElementById('save-color')); assert.match(x.messages.at(-1)[0], /相同名稱/);
  const malformed = setup({[Palette.KEY]: JSON.stringify(null)}); assert.ok(malformed.messages.some(m => m[1]));
  setup({[Palette.KEY]: JSON.stringify([null, {name: 2, color: '#ffffff'}, {name: 'ok', color: 'nope'}])});
}
{
  const x = setup({[Palette.KEY]: JSON.stringify([{name: 'kept', color: '#123456'}])}, {prompt: () => 'renamed'});
  x.storage.setItem = () => { throw new Error('denied'); };
  click(x.dom.window.document.querySelector('.saved-color-action'));
  assert.equal(JSON.parse(x.data[Palette.KEY])[0].name, 'kept');
  click(x.dom.window.document.querySelectorAll('.saved-color-action')[1]);
  assert.equal(x.dom.window.document.querySelectorAll('.saved-color').length, 1);
  const deniedRead = setup({}, {storage: {getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }}});
  assert.ok(deniedRead.messages.some(m => m[1]));
}
{
  const x = setup(); x.color = '#5F4B78'; x.mounted.sync();
  assert.equal(x.dom.window.document.getElementById('bg-color').value, '#5f4b78');
  assert.equal(x.dom.window.document.querySelector('#swatches .swatch:last-child').getAttribute('aria-pressed'), 'true');
}
console.log('PASS: palette');
