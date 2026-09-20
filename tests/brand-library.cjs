const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const sharp=require('sharp');
const {openEditor}=require('./helpers/editor-harness.cjs');
(async()=>{
 const a=await openEditor();try{
 const {el,window,change,upload,file}=a,doc=window.document,C=window.CollageCore,B=window.CollageBrand;let state;
 const draw=C.draw;C.draw=(ctx,images,s,...rest)=>{state=JSON.parse(JSON.stringify(s));return draw(ctx,images,s,...rest)};
 assert(el('brand-files'),'One universal multi-logo picker');
 const batch=async files=>{Object.defineProperty(el('brand-files'),'files',{configurable:true,value:files});await el('brand-files').onchange({target:el('brand-files')})};
 await batch([file('wide.png','#FF0000',400,100),file('square.png','#00FF00',100,100)]);
 assert.equal(state.brand.library.length,2);assert.equal(doc.querySelectorAll('.logo-asset').length,2);
 doc.querySelector('[data-logo-position="br"]').click();el('logo-flush').click();
 const measured=B.measure(C.size(state),state.brand);assert.equal(measured.logo.x+measured.logo.w,1080);assert.equal(measured.logo.y+measured.logo.h,1080);assert.equal(measured.logo.w/measured.logo.h,4);
 const prior=JSON.parse(JSON.stringify(state));doc.querySelectorAll('.logo-asset')[1].click();assert.equal(B.measure(C.size(state),state.brand).logo.w/B.measure(C.size(state),state.brand).logo.h,1);el('undo').click();assert.deepEqual(state,prior);
 change('logo-tone','dark');assert.equal(state.brand.library[0].tone,'dark');
 doc.querySelector('[data-logo-position="bottom"]').click();change('bg-color','#123456');
 let pixel=[...a.picture().getContext('2d').getImageData(1,1079,1,1).data];assert.deepEqual(pixel,[18,52,86,255]);
 change('logo-color-mode','custom');change('logo-color','#ABCDEF');pixel=[...a.picture().getContext('2d').getImageData(1,1079,1,1).data];assert.deepEqual(pixel,[171,205,239,255]);
 const placed=JSON.stringify(B.measure(C.size(state),state.brand));el('logo-hide').click();assert.equal(state.brand.placement,'none');el('logo-hide').click();assert.equal(JSON.stringify(B.measure(C.size(state),state.brand)),placed,'Temporarily hiding a logo preserves its band position');
 const bytes=await a.download(),raw=await sharp(bytes).removeAlpha().raw().toBuffer();const offset=(1079*1080+1)*3;[171,205,239].forEach((v,i)=>assert(Math.abs(raw[offset+i]-v)<10,'Exported band matches preview'));
 const beforeBad=JSON.stringify(state);await batch([file('valid.png','#FFFFFF'),new window.File(['not an image'],'bad.png',{type:'image/png'})]);assert.equal(JSON.stringify(state),beforeBad,'One invalid file prevents partial batch ingestion');
 const transparent=createCanvas(200,100),tc=transparent.getContext('2d');tc.fillStyle='#0000FF';tc.fillRect(40,20,120,60);
 await batch([new window.File([transparent.toBuffer('image/png')],'trim.png',{type:'image/png'})]);doc.querySelectorAll('.logo-asset')[2].click();el('logo-trim').checked=true;el('logo-trim').dispatchEvent(new window.Event('change',{bubbles:true}));
 assert.deepEqual({...B.measure(C.size(state),state.brand).logo.source},{x:40,y:20,w:120,h:60});
 el('kit-name').value='My brand';el('kit-save').click();const stored=window.localStorage.getItem('dotai-collage-brand-kit-v1');assert(stored&&JSON.parse(stored).logos.length===3);assert(!stored.includes('slots'),'Kit never saves private photos');
 const reloaded=await openEditor({empty:true,stored:{'dotai-collage-brand-kit-v1':stored}});try{assert.equal(reloaded.window.document.querySelectorAll('.logo-asset').length,3);assert(!reloaded.el('empty-state').hidden,'Brand restores without personal or demo photos');assert.equal(reloaded.el('logo-color').value,'#abcdef');assert.equal(reloaded.errors.length,0)}finally{reloaded.close()}
 el('reset').click();await el('kit-load').onclick();assert.equal(state.brand.library.length,3);assert.equal(state.slots.length,0,'Loading kit never adds sample photos');assert.equal(state.brand.backdropColor,'#abcdef');
 el('logo-remove').click();assert.equal(state.brand.library.length,2);el('undo').click();assert.equal(state.brand.library.length,3);
 window.localStorage.setItem('dotai-collage-brand-kit-v1','{bad');const beforeRestore=JSON.stringify(state);await el('kit-load').onclick();assert.equal(JSON.stringify(state),beforeRestore,'Invalid stored kit leaves current artwork intact');
 window.localStorage.setItem('dotai-collage-brand-kit-v1',stored);const proto=Object.getPrototypeOf(window.localStorage),set=proto.setItem;proto.setItem=()=>{throw Error('quota')};el('kit-save').click();assert(el('kit-status').textContent.includes('未能'));assert.equal(window.localStorage.getItem('dotai-collage-brand-kit-v1'),stored);proto.setItem=set;
 const beforeLimit=JSON.stringify(state);await batch(Array.from({length:6},(_,i)=>file('extra'+i+'.png','#FFFFFF')));assert.equal(JSON.stringify(state),beforeLimit,'Over-limit batch preserves existing library');
 const blank=createCanvas(20,20);await batch([new window.File([blank.toBuffer('image/png')],'empty.png',{type:'image/png'})]);assert.equal(JSON.stringify(state),beforeLimit,'Invisible logos are rejected');
 window.confirm=()=>false;el('kit-forget').click();assert(window.localStorage.getItem('dotai-collage-brand-kit-v1'));window.confirm=()=>true;el('kit-forget').click();assert.equal(window.localStorage.getItem('dotai-collage-brand-kit-v1'),null);assert.equal(state.brand.library.length,3,'Forgetting storage does not erase current artwork');
 assert.equal(a.errors.length,0);console.log('PASS: multi-logo ingestion, four-corner UI, trim, backing pixels, undo and local kit persistence/failures');
 }finally{a.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
