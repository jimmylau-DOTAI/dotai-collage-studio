const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const {JSDOM} = require('jsdom');
const {loadImage} = require('@napi-rs/canvas');
const path = require('node:path');
const root = path.join(__dirname, '..');

(async () => {
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const doc = new JSDOM(html).window.document;
  const logo = doc.querySelector('header img.brand-logo');
  assert(logo, 'Official logo belongs in the application header');
  assert.equal(logo.alt, 'DotAI');
  assert.match(logo.src, /^data:image\/png;base64,/);
  const bytes = Buffer.from(logo.src.split(',')[1], 'base64');
  assert.deepEqual(bytes, fs.readFileSync(path.join(root, 'assets/brand/dotai-icon.png')));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/brand/manifest.json'), 'utf8'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), manifest.derivedSha256);
  const image = await loadImage(bytes);
  assert.equal(image.width, 256);
  assert.equal(image.height, 256);
  assert.equal(doc.querySelectorAll('#canvas-wrap img.brand-logo').length, 0, 'Logo is not artwork');
  assert.equal(doc.querySelector('#swatches').getAttribute('aria-label'), '作品底色');
  const css = doc.querySelector('style').textContent;
  assert.match(css, /--brand-navy:\s*#00345C/i);
  assert.match(css, /--brand-accent:\s*#3298EF/i);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert(!/transition:\s*all/.test(css));
  assert.equal(doc.querySelectorAll('[id]').length, new Set([...doc.querySelectorAll('[id]')].map(el=>el.id)).size, 'IDs remain unique');
  const luminance = hex => {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  };
  const token = name => css.match(new RegExp(`--${name}:\\s*#([a-f\\d]{6})`, 'i'))[1];
  // Accent blue is a decorative header rule, never a small-text background.
  for(const [fg,bg] of [['FFFFFF',token('accent')],[token('ink'),'FFFFFF'],[token('muted'),'FFFFFF'],[token('muted'),token('workspace')],[token('brand-navy'),token('selected')]]) {
    const values=[luminance(fg),luminance(bg)].sort((a,b)=>b-a);
    assert((values[0]+.05)/(values[1]+.05)>=4.5, `Text contrast ${fg}/${bg}`);
  }
  console.log('PASS: exact official icon, square dimensions, isolated UI branding, focus/motion contracts, text contrast; browser layout still requires manual review.');
})().catch(error=>{console.error(error);process.exitCode=1;});
