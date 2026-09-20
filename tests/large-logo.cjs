const assert=require('node:assert/strict');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const sharp=require('sharp');
const {openEditor}=require('./helpers/editor-harness.cjs');

(async()=>{const a=await openEditor();try{
 const {el,window,upload,change}=a,C=window.CollageCore;let state;
 const draw=C.draw;C.draw=(ctx,images,s,...rest)=>{state=JSON.parse(JSON.stringify(s));return draw(ctx,images,s,...rest)};
 // Original exceeds the former 4096px limit; includes both transparent space and color.
 const original=createCanvas(8192,1024),ctx=original.getContext('2d');
 ctx.fillStyle='#3296EF';ctx.fillRect(1024,256,6144,512);
 const bytes=original.toBuffer('image/png');
 await upload('brand-files',new window.File([bytes],'large-wide.png',{type:'image/png'}));
 assert.equal(window.document.querySelectorAll('.logo-asset').length,1,'Large logo must reach normalization instead of being rejected');
 const asset=state.brand.library[0];assert.equal(asset.width,1024);assert.equal(asset.height,128);
 const decoded=await loadImage(asset.src),copy=createCanvas(1024,128),cx=copy.getContext('2d');cx.drawImage(decoded,0,0);
 assert.deepEqual([...cx.getImageData(512,64,1,1).data],[50,150,239,255],'Original solid color preserved');
 assert.equal(cx.getImageData(0,0,1,1).data[3],0,'Transparency preserved');
 assert.deepEqual(original.toBuffer('image/png'),bytes,'Source stays unchanged');
 change('ratio','4:5');const jpg=await sharp(await a.download()).metadata();assert.equal(jpg.width,1080);assert.equal(jpg.height,1350);
 el('logo-remove').click();assert.equal(state.brand.library.length,0);el('undo').click();assert.equal(state.brand.library.length,1);
 await upload('brand-files',a.file('large-tall.png','#FFFFFF',512,8192));
 assert.equal(state.brand.library[1].width,64);assert.equal(state.brand.library[1].height,1024);
 await upload('brand-files',a.file('small.png','#FFFFFF',80,40));assert.equal(state.brand.library[2].width,80,'Small logos are not enlarged');
 const before=JSON.stringify(state),oversize=a.file('too-heavy.png','#FFFFFF');Object.defineProperty(oversize,'size',{value:10*1024*1024+1});
 await upload('brand-files',oversize);assert.equal(JSON.stringify(state),before,'File-byte limit still protects the current artwork');
 assert(el('kit-status').textContent.includes('太大'));assert.equal(el('brand-files').disabled,false,'Picker recovers after a rejected file');
 el('kit-save').click();const saved=JSON.parse(window.localStorage.getItem('dotai-collage-brand-kit-v1'));
 assert.equal((await loadImage(saved.logos[0].src)).width,1024,'Only normalized logo is persisted');
 assert.equal(a.errors.length,0);console.log('PASS: oversized logo import, proportional normalization, alpha/color, portrait JPG, delete/undo, and byte limit');
}finally{a.close()}})().catch(e=>{console.error(e);process.exitCode=1});
