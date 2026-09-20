const assert=require('node:assert/strict');
const {openEditor}=require('./helpers/editor-harness.cjs');
(async()=>{const a=await openEditor();try{
 const {el,pointer,window,upload,file,change}=a,C=window.CollageCore,B=window.CollageBrand;let state;
 const draw=C.draw;C.draw=(ctx,images,s,...rest)=>{state=JSON.parse(JSON.stringify(s));return draw(ctx,images,s,...rest)};
 await upload('brand-files',file('logo.png','#EE2200',300,150));
 assert(!el('logo-remove').closest('details'),'Delete is visible without expanding advanced options');
 assert(!el('logo-size').closest('details'),'Size is a primary control');
 const measure=()=>B.measure(C.size(state),state.brand).logo;
 let b=measure(),before=JSON.parse(JSON.stringify(state));
 pointer('pointerdown',b.x+b.w/2,b.y+b.h/2);pointer('pointerup',b.x+b.w/2,b.y+b.h/2);
 assert.equal(el('canvas').dataset.mode,'logo');assert.deepEqual(state,before,'Selecting logo never crops underlying photo');
 el('canvas-logo-larger').click();assert(measure().w>b.w);el('undo').click();assert.deepEqual(state,before);
 el('canvas-logo-smaller').click();assert(measure().w<b.w);el('undo').click();assert.deepEqual(state,before);
 pointer('pointerdown',b.x+b.w,b.y+b.h);pointer('pointermove',b.x+b.w+90,b.y+b.h+45);pointer('pointerup',b.x+b.w+90,b.y+b.h+45);
 assert(measure().w>b.w+60,'Dragging a logo corner really changes logo width');assert.equal(measure().w/measure().h,2);assert.deepEqual(state.slots,before.slots);
 el('undo').click();assert.deepEqual(state,before,'One undo restores whole logo drag');el('redo').click();assert(measure().w>b.w);
 b=measure();before=JSON.parse(JSON.stringify(state));pointer('pointerdown',b.x+b.w,b.y+b.h);pointer('pointermove',b.x+b.w+50,b.y+b.h+25);pointer('pointercancel',b.x+b.w+50,b.y+b.h+25);assert.deepEqual(state,before);
 change('ratio','4:5');
 for(const placement of ['tr','bl','br','top','bottom']){
  window.document.querySelector('[data-logo-position="'+placement+'"]').click();el('logo-flush').click();b=measure();
  pointer('pointerdown',b.x+b.w/2,b.y+b.h/2);pointer('pointerup',b.x+b.w/2,b.y+b.h/2);
  const h={x:Math.min(1070,Math.max(10,b.x+b.w)),y:Math.min(el('canvas').height-10,Math.max(10,b.y+b.h))};
  pointer('pointerdown',h.x,h.y);pointer('pointermove',h.x-30,h.y-15);pointer('pointerup',h.x-30,h.y-15);
  assert(measure().w<b.w,'Shrink remains usable at '+placement);assert(Math.abs(measure().w/measure().h-2)<1e-8);
 }
 b=measure();pointer('pointerdown',b.x+b.w/2,b.y+b.h/2);pointer('pointerup',b.x+b.w/2,b.y+b.h/2);el('canvas-logo-remove').click();assert.equal(state.brand.library.length,0);assert.equal(state.brand.placement,'none');el('undo').click();assert.equal(state.brand.library.length,1);
 el('photo-mode').click();assert.equal(el('canvas').dataset.mode,'crop');
 assert.equal(a.errors.length,0);console.log('PASS: visible logo deletion/size, direct proportional resize, anchored edges, photo isolation, cancel and undo');
}finally{a.close()}})().catch(e=>{console.error(e);process.exitCode=1});
