// Interaction contract checks through the shipped DOM. State snapshots come
// only from a test-only CollageCore.draw spy; production has no debug globals.
const assert=require('node:assert/strict');
const {openEditor}=require('./helpers/editor-harness.cjs');
const copy=v=>JSON.parse(JSON.stringify(v));
(async()=>{
  const editor=await openEditor();
  try{
    const {window,el,pointer}=editor,draws=[];
    const core=window.CollageCore,originalDraw=core.draw;
    core.draw=function(ctx,images,state,...rest){draws.push(copy(state));return originalDraw.call(this,ctx,images,state,...rest)};
    const state=()=>draws.at(-1),snap=()=>copy(state()),canvas=el('canvas');
    const key=k=>canvas.dispatchEvent(new window.KeyboardEvent('keydown',{key:k,bubbles:true}));
    // Produce one post-spy render, then return to the shipped defaults.
    el('zoom-in').click();el('undo').click();
    const initial=snap(),initialFrames=copy(core.frameBoxes(initial));
    el('zoom-in').click();
    pointer('pointerdown',50,50);pointer('pointermove',80,80);pointer('pointerup',80,80);
    const moved=snap();assert.deepEqual(copy(core.frameBoxes(moved)),initialFrames,'Corner drag only crops the image');
    const beforeResize=snap(),frame=core.frameBoxes(beforeResize)[0];
    pointer('pointerdown',frame.x+frame.w-10,frame.y+frame.h-10);pointer('pointermove',frame.x+frame.w+50,frame.y+frame.h+40);pointer('pointerup',frame.x+frame.w+50,frame.y+frame.h+40);
    const resized=snap();assert.deepEqual(copy(core.frameBoxes(resized)),initialFrames,'Lower corner cannot resize a frame');
    el('undo').click();const redoState=snap();assert.equal(el('redo').disabled,false);
    pointer('pointerdown',220,220);pointer('pointermove',260,260);key('Escape');assert.deepEqual(snap(),redoState,'Escape restores exact pre-drag state');assert.equal(el('redo').disabled,false,'cancel preserves redo');el('redo').click();
    const cancelState=snap();pointer('pointerdown',220,220);pointer('pointermove',260,260);pointer('pointercancel',260,260);assert.deepEqual(snap(),cancelState,'pointercancel restores exact state');
    el('zoom-in').click();el('undo').click();assert.equal(el('redo').disabled,false);pointer('pointerdown',220,220);pointer('pointerup',220,220);assert.equal(el('redo').disabled,false,'zero-motion gesture preserves redo');el('redo').click();
    const zoom=el('zoom');zoom.focus();el('zoom-in').click();const afterUnrelated=snap();zoom.value='130';zoom.dispatchEvent(new window.Event('input',{bubbles:true}));zoom.dispatchEvent(new window.Event('change',{bubbles:true}));el('undo').click();assert.deepEqual(snap(),afterUnrelated,'undo removes slider edit, not unrelated focused-button action');el('redo').click();assert.equal(snap().slots[0].zoom,1.3);
    const beforeGrouped=snap();canvas.focus();zoom.focus();zoom.value='120';zoom.dispatchEvent(new window.Event('input',{bubbles:true}));zoom.value='140';zoom.dispatchEvent(new window.Event('input',{bubbles:true}));zoom.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(snap().slots[0].zoom,1.4);el('undo').click();assert.deepEqual(snap(),beforeGrouped,'grouped slider undo returns exact prior state');el('redo').click();assert.equal(snap().slots[0].zoom,1.4);
    el('undo').click();assert.equal(el('redo').disabled,false);canvas.focus();zoom.focus();zoom.value=String(Math.round(snap().slots[0].zoom*100));zoom.dispatchEvent(new window.Event('input',{bubbles:true}));zoom.dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(el('redo').disabled,false,'no-op slider preserves redo');el('redo').click();
    el('reset').click();const straight=snap();assert.equal(straight.layout,'grid');el('slant-toggle').click();const cut=snap();assert.equal(cut.layout,'grid');assert.notEqual(cut.slant.x,straight.slant.x);el('undo').click();assert.deepEqual(snap(),straight,'slant conversion is undoable exactly');assert.equal(editor.errors.length,0);
    console.log('PASS: constrained corners, cancel+redo, slider history/no-op, and undoable slant.');
  }finally{editor.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
