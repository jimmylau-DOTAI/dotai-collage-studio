const assert=require('node:assert/strict');const {openEditor}=require('./helpers/editor-harness.cjs');
(async()=>{const a=await openEditor();try{const {window,el,pointer}=a;const mode=()=>el('canvas').dataset.mode;
 pointer('pointerdown',2,2);pointer('pointerup',2,2);assert.equal(mode(),'frame','Canvas margin enters frame mode');
 pointer('pointerdown',200,200);pointer('pointerup',200,200);assert.equal(mode(),'crop');
 window.document.querySelector('.stage').dispatchEvent(new window.MouseEvent('pointerdown',{bubbles:true,button:0}));assert.equal(mode(),'frame','Stage whitespace enters frame mode');
 el('photo-mode').click();el('canvas-zoom-in').click();assert.equal(mode(),'crop','Controls never count as outside click');
 const modes=window.document.querySelector('.mode-switch');assert(modes.compareDocumentPosition(el('canvas-wrap'))&window.Node.DOCUMENT_POSITION_FOLLOWING,'Modes precede canvas');
 assert.equal(a.errors.length,0);console.log('PASS: outside selects frame, inside selects photo, controls excluded, modes above canvas');
}finally{a.close()}})().catch(e=>{console.error(e);process.exitCode=1});
