// Integration check: parse the shipped HTML and execute its scripts with jsdom.
// Canvas/Image use native decoding; this is not a browser or browser-policy workaround.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createCanvas,Image}=require('@napi-rs/canvas');
fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});
const errors=[];
const virtualConsole=new VirtualConsole();
virtualConsole.on('jsdomError',e=>errors.push(e.message));
const surfaces=new WeakMap();
const downloads=[];
const input='../dist/index.html';
const html=fs.readFileSync(path.join(__dirname,input),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole,beforeParse(window){
  window.Image=Image;
  window.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return {left:0,top:0,width:540,height:540*this.height/this.width};};
  for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(window.HTMLCanvasElement.prototype,key);Object.defineProperty(window.HTMLCanvasElement.prototype,key,{...d,set(v){d.set.call(this,v);if(surfaces.has(this))surfaces.get(this)[key]=v;}});}
  window.HTMLCanvasElement.prototype.setPointerCapture=function(){};
  window.HTMLCanvasElement.prototype.toBlob=function(callback,type,quality){surfaces.get(this).encode('jpeg',Math.round(quality*100)).then(bytes=>callback({bytes,type,size:bytes.length}));};
  window.URL.createObjectURL=blob=>{downloads.push(blob);return 'blob:integration-check';};window.URL.revokeObjectURL=()=>{};
  window.HTMLAnchorElement.prototype.click=function(){};
  window.HTMLCanvasElement.prototype.getContext=function(type){
    if(!surfaces.has(this))surfaces.set(this,createCanvas(this.width,this.height));
    return surfaces.get(this).getContext(type);
  };
}});
(async()=>{
  const {document}=dom.window;
  await new Promise(resolve=>{
    const started=Date.now();
    const check=()=>{
      if(!document.getElementById('export-top').disabled||errors.length||Date.now()-started>25000)resolve();
      else setTimeout(check,20);
    };check();
  });
  console.log(JSON.stringify({status:document.getElementById('status').textContent,errors,layouts:document.querySelectorAll('.layout').length,photos:document.querySelectorAll('.photo').length}));
  assert.equal(errors.length,0);
  assert.equal(document.getElementById('export-top').disabled,false,'Editor must finish initialization');
  assert.equal(document.querySelectorAll('.photo').length,4);
  assert.equal(document.querySelectorAll('.layout').length,29);
  assert.deepEqual([...document.getElementById('ratio').options].map(o=>o.value),['1:1','4:3']);
  assert.equal(document.getElementById('bg-color').value,'#0b63f6');
  const palette=['#0B63F6','#FFFFFF','#F5F8FF','#00345C'];
  assert.deepEqual([...document.querySelectorAll('.swatch')].map(b=>b.dataset.color),palette);
  for(const color of palette){
    const button=document.querySelector(`[data-color="${color}"]`);button.click();
    assert.equal(button.getAttribute('aria-pressed'),'true');
    const pixel=surfaces.get(document.getElementById('canvas')).getContext('2d').getImageData(0,0,1,1).data;
    assert.deepEqual([...pixel].slice(0,3),color.slice(1).match(/../g).map(n=>parseInt(n,16)),'Selected background must reach actual output pixels');
  }
  document.getElementById('undo').click();assert.equal(document.getElementById('bg-color').value,'#f5f8ff');
  document.getElementById('redo').click();assert.equal(document.getElementById('bg-color').value,'#00345c');
  const custom=document.getElementById('bg-color');custom.value='#0b63f6';custom.dispatchEvent(new dom.window.Event('change'));
  assert.equal(document.querySelector('[data-color="#0B63F6"]').getAttribute('aria-pressed'),'true','Custom color matches preset regardless of hex case');
  document.getElementById('reset').click();
  document.querySelector('[data-layout="grid"]').click();
  assert.equal(document.getElementById('layout-name').textContent,'經典四格');
  const el=id=>document.getElementById(id),change=(id,value)=>{el(id).value=value;el(id).dispatchEvent(new dom.window.Event('change'));};
  el('shape-triangle').click();assert.equal(el('edit-mode').value,'shape');assert.equal(el('vertex').options.length,3);
  const canvas=el('canvas'),b=dom.window.CollageCore.boxes('grid',18,12)[0];
  function pointer(type,x,y){const ev=new dom.window.MouseEvent(type,{clientX:x*540/canvas.width,clientY:y*540/canvas.width,button:0});Object.defineProperty(ev,'pointerId',{value:1});canvas.dispatchEvent(ev);}
  pointer('pointerdown',b.x+b.w*.5,b.y);pointer('pointermove',b.x+b.w*.3,b.y+b.h*.1);pointer('pointerup',b.x+b.w*.3,b.y+b.h*.1);
  assert.equal(el('point-x').value,'30');assert.equal(el('point-y').value,'10');
  el('undo').click();assert.equal(el('point-x').value,'50');el('redo').click();assert.equal(el('point-x').value,'30');
  change('edit-mode','frame');pointer('pointerdown',b.x+b.w*.5,b.y+b.h*.7);pointer('pointermove',b.x+b.w*.5+40,b.y+b.h*.7+30);pointer('pointerup',b.x+b.w*.5+40,b.y+b.h*.7+30);
  assert.equal(el('frame-x').value,'58');assert.equal(el('frame-y').value,'48');
  pointer('pointerdown',58+b.w,48+b.h);pointer('pointermove',58+b.w-90,48+b.h-110);pointer('pointerup',58+b.w-90,48+b.h-110);
  assert.equal(Number(el('frame-w').value),Math.round(b.w-90));assert.equal(Number(el('frame-h').value),Math.round(b.h-110));
  const before=surfaces.get(canvas).toBuffer('image/png');el('preview').click();assert(surfaces.get(canvas).toBuffer('image/png').equals(before),'Editing overlay is excluded from picture pixels');
  async function download(){const count=downloads.length;el('export-top').click();await new Promise((resolve,reject)=>{const deadline=Date.now()+5000;const poll=()=>downloads.length>count?resolve():Date.now()>deadline?reject(new Error(el('status').textContent)):setTimeout(poll,10);poll();});return downloads.at(-1);}
  await download();
  const sharp=require('sharp'),meta=await sharp(downloads[0].bytes).metadata();assert.equal(meta.width,1080);assert.equal(meta.height,1080);assert.equal(meta.format,'jpeg');
  fs.writeFileSync(path.join(__dirname,'../artifacts/shape-editor-example.jpg'),downloads[0].bytes);
  el('shape-circle').click();assert.equal(el('edit-mode').value,'frame');assert.equal(el('vertex').disabled,true);
  el('shape-diamond').click();assert.equal(el('vertex').options.length,4);
  el('shape-hexagon').click();assert.equal(el('vertex').options.length,6);
  el('shape-diagonal').click();assert.equal(el('vertex').options.length,4);
  el('frame-reset').click();assert.equal(el('frame-x').value,'18');
  el('reset').click();assert.equal(el('bg-color').value,'#0b63f6');assert.equal(el('edit-mode').value,'crop');
  document.querySelector('[data-layout="cut-grid"]').click();assert.equal(el('edit-mode').value,'cut');
  const cx=18+.43*(1080-36);pointer('pointerdown',cx,18);pointer('pointermove',18+.3*(1080-36),18);pointer('pointerup',18+.3*(1080-36),18);assert.equal(el('cut-top').value,'30');
  el('undo').click();assert.equal(el('cut-top').value,'43');el('redo').click();assert.equal(el('cut-top').value,'30');
  const startX=el('frame-x').value;change('frame-x','90');assert.equal(el('frame-x').value,'90');el('undo').click();assert.equal(el('frame-x').value,startX);
  change('ratio','4:3');assert.equal(canvas.width,1440);assert.equal(canvas.height,1080);
  const wide=await download();const wideMeta=await sharp(wide.bytes).metadata();assert.equal(wideMeta.width,1440);assert.equal(wideMeta.height,1080);
  fs.writeFileSync(path.join(__dirname,'../artifacts/slanted-example-4x3.jpg'),wide.bytes);
  el('undo').click();assert.equal(el('ratio').value,'1:1');assert.equal(canvas.width,1080);
  assert.equal(errors.length,0);
  console.log('PASS: 4 DotAI palette pixel checks; custom color and palette undo/redo; 29 layouts; ONLY 1:1 and 4:3; polygon drag; frame move/resize; shared slanted endpoint drag; undo/redo; both exact JPEG sizes; handles excluded.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>dom.window.close());
