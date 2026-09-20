const assert=require('node:assert/strict');
const {openEditor}=require('./helpers/editor-harness.cjs');
(async()=>{const a=await openEditor();try{
 const {window,el,pointer}=a,C=window.CollageCore;let state;const draw=C.draw;
 C.draw=(ctx,images,s,...args)=>{state=JSON.parse(JSON.stringify(s));return draw(ctx,images,s,...args)};
 el('canvas-zoom-in').click();const initial=JSON.parse(JSON.stringify(state)),frames=JSON.parse(JSON.stringify(C.frameBoxes(state)));
 const center=b=>[b.x+b.w/2,b.y+b.h/2],p=center(frames[0]),q=center(frames[1]);
 pointer('pointerdown',...p);await new Promise(r=>setTimeout(r,550));pointer('pointermove',...q);pointer('pointerup',...q);
 assert.equal(state.slots[1].photo,initial.slots[0].photo,'Hold then drag swaps without a separate button');
 assert.deepEqual(JSON.parse(JSON.stringify(C.frameBoxes(state))),frames);
 el('undo').click();assert.deepEqual(state,initial);
 pointer('pointerdown',...p);pointer('pointermove',p[0]+30,p[1]);await new Promise(r=>setTimeout(r,550));pointer('pointermove',...q);pointer('pointerup',...q);
 assert.deepEqual(state.slots.map(s=>s.photo),initial.slots.map(s=>s.photo),'Moving immediately crops and never becomes a delayed swap');
 assert.equal(el('swap-grip'),null,'Separate swap button removed');
 assert.equal(el('canvas').dataset.mode,'crop');
 assert.equal(a.errors.length,0);console.log('PASS: hold to swap, immediate drag to crop, fixed frames and undo');
}finally{a.close()}})().catch(e=>{console.error(e);process.exitCode=1});
