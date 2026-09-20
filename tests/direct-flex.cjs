const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const sharp=require('sharp');
const {openEditor}=require('./helpers/editor-harness.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
(async()=>{
 const a=await openEditor({empty:true});
 try{
  const {window,el,file,pointer}=a,C=window.CollageCore;
  assert.equal(window.document.querySelectorAll('.photo').length,0,'Start blank, not with four fake photos');
  assert(el('export-top').disabled);
  let state;const draw=C.draw;C.draw=(ctx,images,s,...rest)=>{state=copy(s);return draw(ctx,images,s,...rest)};
  const choose=async(id,files)=>{Object.defineProperty(el(id),'files',{configurable:true,value:files});await el(id).onchange({target:el(id)})};
  await choose('add-files',['red','lime','blue','yellow'].map((c,i)=>file(i+'.png',c)));
  assert.equal(state.slots.length,4,'First add contains only actual uploaded images');
  const rects=copy(C.frameBoxes(state)),third=rects[2];pointer('pointerdown',third.x+third.w/2,third.y+third.h/2);pointer('pointerup',third.x+third.w/2,third.y+third.h/2);
  el('canvas-zoom-in').click();assert.equal(state.slots[2].zoom,1.1);assert.equal(state.slots[0].zoom,1);
  const wheel=new window.WheelEvent('wheel',{clientX:(third.x+third.w/2)/2,clientY:(third.y+third.h/2)/2,deltaY:-100,cancelable:true});el('canvas').dispatchEvent(wheel);
  assert(state.slots[2].zoom>1.1);assert.deepEqual(copy(C.frameBoxes(state)),rects);
  el('slant-toggle').click();const slanted=copy(C.frameBoxes(state));el('canvas-zoom-in').click();assert.deepEqual(copy(C.frameBoxes(state)),slanted);
  const source=createCanvas(600,200),ctx=source.getContext('2d');['red','lime','blue'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*200,0,200,200)});
  await choose('files',[new window.File([source.toBuffer('image/png')],'crop.png',{type:'image/png'})]);el('canvas-zoom-in').click();
  const clip=C.frameBoxes(state)[2],px=Math.floor(clip.x+clip.w/2),py=Math.floor(clip.y+clip.h/2);
  const pixel=()=>[...a.picture().getContext('2d').getImageData(px,py,1,1).data];assert.deepEqual(pixel(),[0,255,0,255]);
  pointer('pointerdown',px,py);pointer('pointermove',px+2000,py);pointer('pointerup',px+2000,py);assert.deepEqual(pixel(),[255,0,0,255],'Slanted photo actually pans in rendered pixels');
  assert.deepEqual(copy(C.frameBoxes(state)),slanted);el('undo').click();assert.deepEqual(pixel(),[0,255,0,255]);
  el('slant-reset').click();
  const ids=state.slots.map(s=>s.photo),dt={setData(){},getData(){return''}};
  function drag(node,type,x=0,y=0){const e=new window.MouseEvent(type,{bubbles:true,cancelable:true,clientX:x/2,clientY:y/2});Object.defineProperty(e,'dataTransfer',{value:dt});node.dispatchEvent(e)}
  let photos=window.document.querySelectorAll('.photo');drag(photos[0],'dragstart');drag(photos[1],'drop');assert.deepEqual(state.slots.map(s=>s.photo),[ids[1],ids[0],ids[2],ids[3]]);el('undo').click();assert.deepEqual(state.slots.map(s=>s.photo),ids);
  // Select third and pull its upper-right shared corner right/up: third becomes largest.
  photos=window.document.querySelectorAll('.photo');photos[2].click();
  const handles=C.flexHandles(state,2),h=handles.find(h=>h.corner==='tr');assert(h);
  pointer('pointerdown',h.x,h.y);pointer('pointermove',800,270);pointer('pointerup',800,270);
  const boxes=copy(C.frameBoxes(state)),areas=boxes.map(b=>b.w*b.h);assert(areas[2]>Math.max(areas[0],areas[1],areas[3]));
  assert.deepEqual(state.slots.map(s=>s.photo),ids,'Resizing preserves photo placement');
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(Math.min(a.x+a.w,b.x+b.w)<=Math.max(a.x,b.x)||Math.min(a.y+a.h,b.y+b.h)<=Math.max(a.y,b.y),'Flex frames do not overlap')}
  el('undo').click();assert.deepEqual(copy(C.frameBoxes(state)),rects);el('redo').click();assert.deepEqual(copy(C.frameBoxes(state)),boxes);
  el('slant-toggle').click();assert(state.customCells);const tilted=copy(C.frameBoxes(state));el('canvas-zoom-in').click();assert.deepEqual(copy(C.frameBoxes(state)),tilted);
  const output=await a.download(),meta=await sharp(output).metadata();assert.deepEqual([meta.width,meta.height],[1080,1080]);
  // Dedicated drag grip swaps the selected photo onto the actual canvas target.
  const target=C.frameBoxes(state)[1],beforeGrip=state.slots.map(s=>s.photo);drag(el('swap-grip'),'dragstart');drag(el('canvas'),'drop',target.x+target.w/2,target.y+target.h/2);assert.equal(state.slots[1].photo,beforeGrip[2]);assert.deepEqual(copy(C.frameBoxes(state)),tilted);el('undo').click();
  el('make-hero').click();const hero=C.frameBoxes(state),areasHero=hero.map(b=>b.w*b.h);assert(areasHero[1]>Math.max(areasHero[0],areasHero[2],areasHero[3]));
  const shifted=(type,b)=>{const e=new window.MouseEvent(type,{bubbles:true,button:0,shiftKey:true,clientX:(b.x+b.w/2)/2,clientY:(b.y+b.h/2)/2});Object.defineProperty(e,'pointerId',{value:22});el('canvas').dispatchEvent(e)};
  const shiftIds=state.slots.map(s=>s.photo),shiftFrames=copy(C.frameBoxes(state));shifted('pointerdown',hero[1]);shifted('pointermove',hero[3]);shifted('pointerup',hero[3]);assert.equal(state.slots[3].photo,shiftIds[1]);assert.equal(state.slots[1].photo,shiftIds[3]);assert.deepEqual(copy(C.frameBoxes(state)),shiftFrames);el('undo').click();assert.deepEqual(state.slots.map(s=>s.photo),shiftIds);
  // Demo is optional; the first actual append must replace all demo placeholders.
  el('reset').click();assert.equal(state.slots.length,0);el('show-demo').click();assert.equal(state.slots.length,4);await choose('add-files',[file('real.png','blue')]);assert.equal(state.slots.length,1);assert.equal(state.demo,false);
  el('undo').click();assert.equal(state.demo,true);el('redo').click();assert.equal(state.slots.length,1);
  assert.equal(a.errors.length,0);console.log('PASS: empty start, first-add demo replacement, direct zoom, swap, flexible largest third frame, slant and undo.');
 }finally{a.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
