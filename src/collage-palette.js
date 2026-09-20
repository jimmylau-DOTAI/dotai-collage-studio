(function (root) {
  'use strict';

  const KEY = 'dotai-collage-saved-colors-v1';
  const MAX = 8;
  const NAME_MAX = 20;
  const HEX = /^#[0-9a-f]{6}$/i;
  const BUILT_INS = [
    { color: '#FFFFFF', name: '純白' },
    { color: '#0B63F6', name: '亮藍' },
    { color: '#F5F8FF', name: '淺藍' },
    { color: '#00345C', name: '深海藍' }
  ];

  function validColor(value) {
    return typeof value === 'string' && HEX.test(value) ? value.toUpperCase() : null;
  }

  function mount(options) {
    options = options || {};
    const doc = options.document;
    if (!doc || typeof doc.getElementById !== 'function') return { sync: function () {} };
    const storage = options.storage;
    const notify = typeof options.notify === 'function' ? options.notify : function () {};
    const applyColor = typeof options.applyColor === 'function' ? options.applyColor : function () {};
    const getColor = typeof options.getColor === 'function' ? options.getColor : function () { return '#FFFFFF'; };
    const prompt = typeof options.prompt === 'function'
      ? options.prompt
      : (doc.defaultView && typeof doc.defaultView.prompt === 'function' ? doc.defaultView.prompt.bind(doc.defaultView) : null);
    const swatches = doc.getElementById('swatches');
    const input = doc.getElementById('bg-color');
    const saveButton = doc.getElementById('save-color');
    const saved = doc.getElementById('saved-colors');
    let records = [];

    function say(message, bad) {
      try { notify(message, bad); } catch (_) {}
    }

    function read() {
      if (!storage || typeof storage.getItem !== 'function') return [];
      let raw;
      try { raw = storage.getItem(KEY); } catch (_) {
        say('未能讀取已儲存底色', true);
        return [];
      }
      if (raw == null || raw === '') return [];
      let parsed;
      try { parsed = JSON.parse(raw); } catch (_) {
        say('已儲存底色資料無法讀取', true);
        return [];
      }
      if (!Array.isArray(parsed)) {
        say('已儲存底色資料格式不正確', true);
        return [];
      }
      const clean = parsed.filter(function (item) {
        return item && typeof item === 'object' && validColor(item.color) && typeof item.name === 'string' && item.name.trim();
      }).map(function (item) {
        return { color: validColor(item.color), name: item.name.trim().slice(0, NAME_MAX) };
      }).filter(function (item, index, list) {
        return list.findIndex(function (other) { return other.name === item.name; }) === index;
      }).slice(0, MAX);
      if (clean.length !== parsed.length) say('部分已儲存底色資料無效，已略過', true);
      return clean;
    }

    function write(next) {
      if (!storage || typeof storage.setItem !== 'function') {
        say('此環境未能儲存底色', true);
        return false;
      }
      let serialized;
      try { serialized = JSON.stringify(next); storage.setItem(KEY, serialized); }
      catch (_) { say('未能儲存底色；原有資料未被取代', true); return false; }
      records = next.slice();
      return true;
    }

    function currentColor() {
      let color;
      try { color = validColor(getColor()); } catch (_) { color = null; }
      return color || (input && validColor(input.value)) || '#FFFFFF';
    }

    function useColor(color) {
      const clean = validColor(color);
      if (!clean) return;
      try { applyColor(clean); } catch (_) { say('未能套用底色', true); return; }
      sync();
    }

    function swatchButton(item, parent) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'swatch';
      button.dataset.color = item.color;
      button.style.setProperty('--swatch', item.color);
      button.textContent = item.name;
      button.addEventListener('click', function () { useColor(item.color); });
      parent.appendChild(button);
      return button;
    }

    function render() {
      if (swatches) {
        swatches.replaceChildren();
        BUILT_INS.forEach(function (item) { swatchButton(item, swatches); });
      }
      if (saved) {
        saved.replaceChildren();
        records.forEach(function (item) {
          const row = doc.createElement('div');
          row.className = 'saved-color';
          const button = swatchButton(item, row);
          button.classList.add('saved-color-use');
          const rename = doc.createElement('button');
          rename.type = 'button'; rename.className = 'saved-color-action'; rename.textContent = '改名';
          rename.addEventListener('click', function () {
            if (!prompt) return;
            let value;
            try { value = prompt('為呢隻底色改名', item.name); } catch (_) { value = null; }
            if (value == null) return;
            const name = String(value).trim().slice(0, NAME_MAX);
            if (!name) { say('名稱不可留空', true); return; }
            if (records.some(function (other) { return other !== item && other.name === name; })) { say('已有相同名稱，請改用另一個名稱', true); return; }
            const next = records.map(function (other) { return other === item ? { name: name, color: item.color } : other; });
            if (write(next)) { render(); say('已改名：' + name); }
          });
          const remove = doc.createElement('button');
          remove.type = 'button'; remove.className = 'saved-color-action'; remove.textContent = '移除';
          remove.addEventListener('click', function () {
            const next = records.filter(function (other) { return other !== item; });
            if (write(next)) { render(); say('已移除底色：' + item.name); }
          });
          row.append(rename, remove); saved.appendChild(row);
        });
      }
      sync();
    }

    function sync() {
      const color = currentColor();
      if (input && input.value.toUpperCase() !== color) input.value = color;
      doc.querySelectorAll('.swatch').forEach(function (button) {
        button.setAttribute('aria-pressed', String(validColor(button.dataset.color) === color));
      });
    }

    if (input) input.addEventListener('change', function () {
      const color = validColor(input.value);
      if (color) useColor(color);
    });
    if (saveButton) saveButton.addEventListener('click', function () {
      if (!prompt) { say('此環境未能命名底色', true); return; }
      let value;
      try { value = prompt('為呢隻底色命名', '自訂色'); } catch (_) { value = null; }
      if (value == null) return;
      const name = String(value).trim().slice(0, NAME_MAX);
      if (!name) { say('名稱不可留空', true); return; }
      if (records.some(function (item) { return item.name === name; })) { say('已有相同名稱，請改用另一個名稱', true); return; }
      if (records.length >= MAX) { say('最多只可儲存 8 隻底色', true); return; }
      const next = [{ name: name, color: currentColor() }].concat(records);
      if (write(next)) { render(); say('已儲存底色：' + name); }
    });

    records = read();
    render();
    return { sync: sync };
  }

  const api = { mount: mount, KEY: KEY };
  root.CollagePalette = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
