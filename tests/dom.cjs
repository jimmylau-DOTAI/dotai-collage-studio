// Integration check: execute the generated offline page in jsdom with native canvas.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');const {createCanvas,Image}=require('@napi-rs/canvas');const sharp=require('sharp');
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
const errors=[],surfaces=new WeakMap(),downloads=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,beforeParse(window){
  window.Image=Image;
  window.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return{left:0,top:0,width:540,height:540*this.height/this.width};};
  for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(window.HTMLCanvasElement.prototype,key);Object.defineProperty(window.HTMLCanvasElement.prototype,key,{...d,set(v){d.set.call(this,v);if(surfaces.has(this))surfaces.get(this)[key]=v;}});}
  window.HTMLCanvasElement.prototype.setPointerCapture=function(){};
  window.HTMLCanvasElement.prototype.toBlob=function(done,type,quality){surfaces.get(this).encode('jpeg',Math.round(quality*100)).then(bytes=>done({bytes,type,size:bytes.length}));};
  window.HTMLCanvasElement.prototype.getContext=function(){if(!surfaces.has(this))surfaces.set(this,createCanvas(this.width,this.height));return surfaces.get(this).getContext('2d');};
  window.URL.createObjectURL=blob=>{downloads.push(blob);return'blob:test';};window.URL.revokeObjectURL=()=>{};window.HTMLAnchorElement.prototype.click=function(){};
}});
(async()=>{const {document}=dom.window,el=id=>document.getElementById(id);
  await new Promise(resolve=>{const until=Date.now()+25000;const poll=()=>!el('export-top').disabled||errors.length||Date.now()>until?resolve():setTimeout(poll,20);poll();});
  assert.equal(errors.length,0);assert.equal(el('export-top').disabled,false);assert.equal(document.querySelectorAll('.layout').length,29);assert.equal(document.querySelectorAll('.photo').length,4);
  assert.deepEqual([...el('ratio').options].map(x=>x.value),['1:1','4:5']);assert.equal(el('edit-mode'),null);assert.equal(document.querySelector('[data-layout="grid"]').textContent,'經典四格');
  assert.equal(document.querySelectorAll('.layout-preview').length,29);assert.equal(document.querySelectorAll('.photo img').length,4);assert(el('bg-color'));
  document.querySelector('[data-color="#00345C"]').click();assert.equal(el('undo').disabled,false);
  el('ratio').value='4:5';el('ratio').dispatchEvent(new dom.window.Event('change'));assert.equal(el('canvas').width,1080);assert.equal(el('canvas').height,1350);
  const canvas=el('canvas'),box=dom.window.CollageCore.frameBoxes(dom.window.CollageCore.defaults())[0];
  const event=(type,x,y)=>{const e=new dom.window.MouseEvent(type,{clientX:x/2,clientY:y/2,button:0});Object.defineProperty(e,'pointerId',{value:7});canvas.dispatchEvent(e);};
  event('pointerdown',box.x+box.w*.5,box.y+box.h*.5);event('pointermove',box.x+box.w*.5+50,box.y+box.h*.5);event('pointerup',box.x+box.w*.5+50,box.y+box.h*.5);assert.equal(el('undo').disabled,false);
  el('export-top').click();await new Promise((yes,no)=>{const stop=Date.now()+5000;const poll=()=>downloads.length?yes():Date.now()>stop?no(Error(el('status').textContent)):setTimeout(poll,10);poll();});
  const meta=await sharp(downloads.at(-1).bytes).metadata();assert.deepEqual([meta.width,meta.height,meta.format],[1080,1350,'jpeg']);assert.equal(errors.length,0);
  console.log('PASS: direct social editor UI; 29 visual layouts; only 1:1 and 4:5; drag editing; undo; and 1080x1350 JPG.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>dom.window.close());
