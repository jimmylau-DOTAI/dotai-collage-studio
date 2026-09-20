// Generate demo artwork and embed the checked-in official mark in the app shell.
// No personal photographs or external asset directories are read.
const fs = require('node:fs');
const path = require('node:path');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
require('../src/collage-brand.js');
require('../src/collage-core.js');
const root = path.join(__dirname, '..');
const C = globalThis.CollageCore;

async function demo(index) {
  const canvas = createCanvas(1600, 1100);
  const ctx = canvas.getContext('2d');
  const colors = ['#0B63F6', '#00345C', '#3298EF', '#65788F'];
  ctx.fillStyle = colors[index];
  ctx.fillRect(0, 0, 1600, 1100);
  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = .12;
  ctx.beginPath();ctx.arc(1200-index*100, 220+index*90, 410, 0, Math.PI*2);ctx.fill();
  ctx.globalAlpha = .2;
  ctx.beginPath();ctx.moveTo(0, 900);ctx.lineTo(500, 300+index*90);ctx.lineTo(1400, 1100);ctx.lineTo(0, 1100);ctx.closePath();ctx.fill();
  // Vector seven-segment numerals avoid dependence on installed fonts.
  ctx.globalAlpha = .8;
  const segments = [[30,0,160,28],[190,28,28,160],[190,216,28,160],[30,376,160,28],[2,216,28,160],[2,28,28,160],[30,188,160,28]];
  const digits = [[1,2],[0,1,6,4,3],[0,1,6,2,3],[5,6,1,2]];
  for(const i of digits[index]) { const [x,y,w,h]=segments[i];ctx.fillRect(x+680,y+345,w,h); }
  return {name:`demo-${index+1}.jpg`,src:'data:image/jpeg;base64,'+(await canvas.encode('jpeg',90)).toString('base64')};
}

(async()=>{
  const photos=await Promise.all([0,1,2,3].map(demo));
  const preview=createCanvas(1080,1080);
  C.draw(preview.getContext('2d'),await Promise.all(photos.map(p=>loadImage(p.src))),C.defaults());
  const replacements={
    __ICON_DATA__:JSON.stringify(Object.fromEntries(['help','arrows-exchange','photo','frame','layout-grid','download','arrow-back-up','arrow-forward-up','focus-centered','layout-dashboard','brand-sketch','plus','minus','rotate-2'].map(name=>[name,fs.readFileSync(path.join(root,'node_modules/@tabler/icons/icons/outline',name+'.svg'),'utf8')]))),
    __BRAND_JS__:['collage-brand.js','brand-studio.js'].map(file=>fs.readFileSync(path.join(root,'src',file),'utf8')).join('\n').replace(/<\/script/gi,'<\\/script'),
    __PALETTE_JS__:fs.readFileSync(path.join(root,'src/collage-palette.js'),'utf8').replace(/<\/script/gi,'<\\/script'),
    __EDITOR_CSS__:fs.readFileSync(path.join(root,'src/editor.css'),'utf8'),
    __BRAND_LOGO__:'data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/brand/dotai-icon.png')).toString('base64'),
    __PREVIEW_DATA__:'data:image/jpeg;base64,'+(await preview.encode('jpeg',88)).toString('base64'),
    __PHOTO_DATA__:JSON.stringify(photos),
    __CORE_JS__:fs.readFileSync(path.join(root,'src/collage-core.js'),'utf8').replace(/<\/script/gi,'<\\/script'),
    __APP_JS__:fs.readFileSync(path.join(root,'src/collage-app.js'),'utf8').replace(/<\/script/gi,'<\\/script')
  };
  const template=fs.readFileSync(path.join(root,'src/editor.html.template'),'utf8');
  for(const key of Object.keys(replacements))if(template.split(key).length!==2)throw new Error(`Expected exactly one ${key}`);
  const html=template.replace(/__ICON_DATA__|__EDITOR_CSS__|__BRAND_LOGO__|__PREVIEW_DATA__|__PHOTO_DATA__|__BRAND_JS__|__PALETTE_JS__|__CORE_JS__|__APP_JS__/g,key=>replacements[key]);
  fs.mkdirSync(path.join(root,'dist'),{recursive:true});
  const notice='<!-- Tabler Icons\n'+fs.readFileSync(path.join(root,'node_modules/@tabler/icons/LICENSE'),'utf8')+'\n-->';
  fs.writeFileSync(path.join(root,'dist/index.html'),html.replace('</head>',notice+'</head>'));
  console.log(`Built dist/index.html (${Buffer.byteLength(html)} bytes, 4 generated demo images)`);
})().catch(error=>{console.error(error);process.exitCode=1;});
