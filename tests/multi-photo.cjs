const assert=require('node:assert/strict');
const sharp=require('sharp');
const {createCanvas}=require('@napi-rs/canvas');
const {openEditor}=require('./helpers/editor-harness.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
(async()=>{
 const app=await openEditor();
 try{
  const {window,el,pointer,change,file,upload,picture}=app,C=window.CollageCore;
  let current;const draw=C.draw;C.draw=(ctx,images,state,...rest)=>{current=copy(state);return draw(ctx,images,state,...rest)};
  el('zoom-in').click();el('undo').click();
  const before=C.frameBoxes(current);
  // Before the fix the corner gesture resizes the frame instead of panning the photo.
  change('zoom','200');el('zoom').dispatchEvent(new window.Event('input'));el('zoom').dispatchEvent(new window.Event('change'));
  const b=before[0];pointer('pointerdown',b.x+b.w-20,b.y+b.h-20);pointer('pointermove',b.x+b.w+40,b.y+b.h+30);pointer('pointerup',b.x+b.w+40,b.y+b.h+30);
  assert.deepEqual(C.frameBoxes(current),before,'Normal photo drag must never resize a frame');
  assert(current.slots[0].x<.52&&current.slots[0].y<.53,'Zoomed image pans inside its fixed frame');
  assert(el('batch-files')?.multiple,'A single batch picker must accept multiple images');
  const colors=['#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF','#884400','#008844','#440088'];
  const batch=async files=>{Object.defineProperty(el('batch-files'),'files',{configurable:true,value:files});await el('batch-files').onchange({target:el('batch-files')})};
  for(const n of [1,2,3,4,5,6,7,8,9]){
   await batch(colors.slice(0,n).map((c,i)=>file(i+'.png',c)));
   assert.equal(current.slots.length,n);assert.equal(window.document.querySelectorAll('.photo').length,n);
   assert.equal(new Set(current.slots.map(s=>s.photo)).size,n,'Every selected image has its own slot');
   const buttons=[...window.document.querySelectorAll('.layout')];assert(buttons.length);
   for(const button of buttons){button.click();const boxes=C.frameBoxes(current);assert.equal(boxes.length,n);
    for(let i=0;i<n;i++){const r=boxes[i];assert(r.x>=0&&r.y>=0&&r.w>0&&r.h>0&&r.x+r.w<=1080.001&&r.y+r.h<=1080.001);
     const pixel=[...picture().getContext('2d').getImageData(Math.floor(r.x+r.w/2),Math.floor(r.y+r.h/2),1,1).data];
     if(!C.layouts.find(l=>l.id===current.layout)?.overlap)assert.deepEqual(pixel.slice(0,3),colors[i].slice(1).match(/../g).map(h=>parseInt(h,16)),'Actual photo order/pixels survive re-layout');
    }
   }
   change('ratio','4:5');const jpg=await app.download(),meta=await sharp(jpg).metadata();assert.deepEqual([meta.width,meta.height],[1080,1350]);change('ratio','1:1');
  }
  let preserved=copy(current);await batch([file('ok.png','#FFFFFF'),new window.File(['broken'],'bad.png',{type:'image/png'})]);assert.deepEqual(current,preserved,'A failed batch leaves the entire artwork intact');
  await batch(Array.from({length:10},(_,i)=>file(i+'.png','#FFFFFF')));assert.deepEqual(current,preserved,'Over-limit batches never silently discard files');
  await batch([]);assert.deepEqual(current,preserved,'Cancelling picker preserves artwork');
  await batch([file('one.png','#AA0000')]);assert.equal(current.slots.length,1);el('undo').click();assert.deepEqual(current,preserved,'One undo restores all previous photos/layout');el('redo').click();assert.equal(current.slots.length,1);
  let pickerCalls=0;el('files').click=()=>pickerCalls++;
  window.document.querySelector('.photo').dispatchEvent(new window.MouseEvent('dblclick',{bubbles:true}));assert.equal(pickerCalls,1);
  const dbl=new window.MouseEvent('dblclick',{clientX:200,clientY:200,bubbles:true});el('canvas').dispatchEvent(dbl);assert.equal(pickerCalls,2,'Canvas double-click also opens replacement picker');
  // A striped source makes crop movement observable in real pixels, not just state.
  const source=createCanvas(600,200),ctx=source.getContext('2d');['red','lime','blue'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*200,0,200,200)});
  await upload('files',new window.File([source.toBuffer('image/png')],'stripes.png',{type:'image/png'}));
  const fixed=copy(C.frameBoxes(current));change('zoom','200');el('zoom').dispatchEvent(new window.Event('input'));el('zoom').dispatchEvent(new window.Event('change'));
  const center=()=>[...picture().getContext('2d').getImageData(540,540,1,1).data];assert.deepEqual(center(),[0,255,0,255]);
  pointer('pointerdown',500,500);pointer('pointermove',2500,500);pointer('pointerup',2500,500);assert.deepEqual(center(),[255,0,0,255]);assert.deepEqual(copy(C.frameBoxes(current)),fixed);
  el('undo').click();assert.deepEqual(center(),[0,255,0,255]);
  el('frame-edit').checked=true;el('frame-edit').dispatchEvent(new window.Event('change'));
  pointer('pointerdown',1042,1042);pointer('pointermove',942,942);pointer('pointerup',942,942);
  assert.equal(current.slots[0].frame.w,944);el('restore-frames').click();assert.deepEqual(copy(C.frameBoxes(current)),fixed);el('undo').click();assert.equal(current.slots[0].frame.w,944);
  // Delay only file I/O; actual decoding and native pixels remain real.
  const Reader=window.FileReader;
  window.FileReader=class extends Reader{readAsDataURL(blob){if(blob.name.startsWith('slow'))window.setTimeout(()=>super.readAsDataURL(blob),30);else super.readAsDataURL(blob)}};
  const slowBatch=batch([file('slow-first.png','#FF0000'),file('second.png','#00FF00')]);
  const latestSingle=upload('files',file('latest.png','#0000FF'));await Promise.all([slowBatch,latestSingle]);
  assert.equal(current.slots.length,1,'A later single-photo choice cancels an older pending batch');
  assert.deepEqual([...picture().getContext('2d').getImageData(400,400,1,1).data],[0,0,255,255]);
  const oldSingle=upload('files',file('slow-single.png','#FF0000'));
  const newBatch=batch([file('new-a.png','#00FF00'),file('new-b.png','#0000FF')]);await Promise.all([oldSingle,newBatch]);assert.equal(current.slots.length,2);
  const oldBatch=batch([file('slow-old.png','#FF0000')]);
  const winningBatch=batch([file('new-c.png','#00FF00'),file('new-d.png','#0000FF'),file('new-e.png','#FFFF00')]);await Promise.all([oldBatch,winningBatch]);assert.equal(current.slots.length,3);
  const third=C.frameBoxes(current)[2];pointer('pointerdown',third.x+third.w/2,third.y+third.h/2);pointer('pointermove',third.x+third.w/2+50,third.y+third.h/2);
  await batch([file('during-drag.png','#00FF00')]);pointer('pointermove',300,300);pointer('pointerup',300,300);
  assert.equal(app.errors.length,0);
  console.log('PASS: variable photo counts, batch atomicity/history, double-click picker, fixed-frame zoom and actual crop pixels.');
 }finally{app.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
