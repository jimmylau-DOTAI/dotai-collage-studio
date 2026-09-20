const assert=require('node:assert/strict');
const sharp=require('sharp');
const {openEditor}=require('./helpers/editor-harness.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
(async()=>{
 const a=await openEditor();
 try{
  const {window,el,pointer,file,upload,change,picture}=a,C=window.CollageCore;
  let state;const draw=C.draw;C.draw=(ctx,images,s,...rest)=>{state=copy(s);return draw(ctx,images,s,...rest)};
  el('zoom-in').click();el('undo').click();
  if(el('frame-edit')){el('frame-edit').checked=true;el('frame-edit').dispatchEvent(new window.Event('change'))}
  const before=copy(C.frameBoxes(state)),b=before[0];
  pointer('pointerdown',b.x+b.w-20,b.y+b.h-20);pointer('pointermove',b.x+b.w+120,b.y+b.h+100);pointer('pointerup',b.x+b.w+120,b.y+b.h+100);
  assert.deepEqual(copy(C.frameBoxes(state)),before,'No UI gesture may freely enlarge a frame over neighbours');
  assert(el('add-files')?.multiple,'Append photos without replacing the current set');
  const choose=async(id,files)=>{Object.defineProperty(el(id),'files',{configurable:true,value:files});await el(id).onchange({target:el(id)})};
  await choose('batch-files',[file('a.png','#FF0000'),file('b.png','#00FF00')]);
  el('zoom-in').click();const existing=copy(state.slots);
  await choose('add-files',[file('c.png','#0000FF'),file('d.png','#FFFF00'),file('e.png','#00FFFF')]);
  assert.equal(state.slots.length,5);assert.deepEqual(state.slots.slice(0,2),existing,'Append preserves existing photo IDs and crops');
  assert(window.document.querySelectorAll('.layout').length>=12,'Five-photo catalogue must provide more than four arrangements');
  window.document.querySelectorAll('.photo-remove')[1].click();assert.equal(state.slots.length,4);assert.equal(state.slots[1].photo,existing[1].photo+1);
  el('undo').click();assert.equal(state.slots.length,5);assert.deepEqual(state.slots.slice(0,2),existing);
  el('slant-toggle').click();assert(state.slant.x||state.slant.y);assert.equal(el('slant-toggle').getAttribute('aria-pressed'),'true');
  const slanted=copy(C.frameBoxes(state));assert(slanted.every(b=>b.mask?.kind==='polygon'));
  // Hand-derived midpoint of the first shared vertical edge in auto-5:
  // (x,y)=(.5,1/6), warped by (.08,.06), inside margin 18 on a 1080 canvas.
  const gutter=[484,192];
  const sample=()=>[...picture().getContext('2d').getImageData(...gutter,1,1).data];
  assert.deepEqual(sample(),[255,255,255,255],'Slanted shared divider remains white');
  const layout=state.layout,photoIds=state.slots.map(s=>s.photo);el('zoom-in').click();
  assert.deepEqual(copy(C.frameBoxes(state)),slanted,'Zoom cannot alter slanted frame boundaries');
  assert.equal(state.layout,layout);assert.deepEqual(state.slots.map(s=>s.photo),photoIds);
  assert.deepEqual(sample(),[255,255,255,255],'Zoomed image cannot cover slanted divider');
  for(const ratio of ['1:1','4:5']){
   change('ratio',ratio);const jpeg=await a.download(),meta=await sharp(jpeg).metadata();assert.deepEqual([meta.width,meta.height],[1080,ratio==='1:1'?1080:1350]);
   const y=ratio==='1:1'?192:237;const pixel=await sharp(jpeg).extract({left:484,top:y,width:1,height:1}).removeAlpha().raw().toBuffer();assert([...pixel].every(v=>v>=240),'Actual JPG retains the shared white slanted gutter');
  }
  change('ratio','1:1');
  el('slant-x').value='-12';el('slant-x').dispatchEvent(new window.Event('input'));el('slant-x').dispatchEvent(new window.Event('change'));
  assert.equal(state.slant.x,-.12);el('undo').click();assert.deepEqual(copy(C.frameBoxes(state)),slanted);
  el('slant-reset').click();assert.equal(state.slant.x,0);assert.equal(state.slant.y,0);
  // Flat gutters and neighbouring pixels remain untouched at 3x photo zoom.
  window.document.querySelector('[data-layout="auto-5"]').click();
  const flat=copy(C.frameBoxes(state));const first=flat[0],second=flat[1];
  const px=(x,y)=>[...picture().getContext('2d').getImageData(Math.floor(x),Math.floor(y),1,1).data];
  const gutterX=(first.x+first.w+second.x)/2,gutterY=first.y+first.h/2;
  const neighbor=px(second.x+second.w/2,second.y+second.h/2);
  el('zoom').value='300';el('zoom').dispatchEvent(new window.Event('input'));el('zoom').dispatchEvent(new window.Event('change'));
  pointer('pointerdown',first.x+first.w/2,first.y+first.h/2);pointer('pointermove',2000,2000);pointer('pointerup',2000,2000);
  assert.deepEqual(px(gutterX,gutterY),[255,255,255,255]);assert.deepEqual(px(second.x+second.w/2,second.y+second.h/2),neighbor);
  assert.deepEqual(copy(C.frameBoxes(state)),flat);
  // Failed append and exceeding capacity preserve the full artwork.
  const stable=copy(state);await choose('add-files',[file('ok.png','#FFFFFF'),new window.File(['bad'],'bad.png',{type:'image/png'})]);assert.deepEqual(state,stable);
  await choose('add-files',Array.from({length:5},(_,i)=>file(i+'.png','#FFFFFF')));assert.deepEqual(state,stable);
  while(state.slots.length>1)window.document.querySelector('.photo-remove').click();assert(window.document.querySelector('.photo-remove').disabled);
  assert(el('slant-toggle').disabled);assert.equal(state.slant.x,0);assert.equal(state.slant.y,0);
  assert.equal(a.errors.length,0);
  console.log('PASS: constrained frames/gutters, append/remove history, expanded layouts and visible universal slant controls.');
 }finally{a.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
