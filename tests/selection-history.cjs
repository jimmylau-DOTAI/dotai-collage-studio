const assert=require('node:assert/strict');
const {openEditor}=require('./helpers/editor-harness.cjs');
(async()=>{const a=await openEditor();try{
 const {window,el}=a;let state;const C=window.CollageCore,draw=C.draw;
 C.draw=(ctx,images,s,...args)=>{state=JSON.parse(JSON.stringify(s));return draw(ctx,images,s,...args)};
 let opened=0;el('files').click=()=>opened++;
 window.document.querySelectorAll('.photo')[1].dispatchEvent(new window.MouseEvent('dblclick',{bubbles:true}));
 el('canvas').dispatchEvent(new window.MouseEvent('dblclick',{bubbles:true,clientX:100,clientY:100}));
 assert.equal(opened,0,'Selecting or double-clicking photos must not launch replacement picker');
 el('canvas-zoom-in').click();assert.equal(state.slots[0].zoom,1.1);
 window.document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'z',metaKey:true,bubbles:true,cancelable:true}));
 assert.equal(state.slots[0].zoom,1,'Command Z undoes canvas zoom');
 window.document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'z',metaKey:true,shiftKey:true,bubbles:true,cancelable:true}));
 assert.equal(state.slots[0].zoom,1.1,'Command Shift Z redoes canvas zoom');
 el('undo').click();assert.equal(state.slots[0].zoom,1);
 window.document.querySelector('[data-layout="cut-grid"]').click();assert(state.slant.x||state.slant.y);
 window.document.querySelector('[data-layout="grid"]').click();assert.equal(state.slant.x,0,'Changing template must clear inherited slant');assert.equal(state.slant.y,0);
 console.log('PASS: selection, keyboard history and template-local slant');
}finally{a.close()}})().catch(e=>{console.error(e);process.exitCode=1});
