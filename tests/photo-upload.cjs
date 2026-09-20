// Focused integration checks for local photo replacement, thumbnail caching, and async races.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createCanvas,Image}=require('@napi-rs/canvas');
const sharp=require('sharp');

const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
function imageFile(name,color,delay=0){
  const c=createCanvas(320,180),x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,320,180);
  return {name,type:'image/png',size:320*180,dataURL:'data:image/png;base64,'+c.toBuffer('image/png').toString('base64'),delay};
}
const files={old:imageFile('old.png','#ff0000',70),latest:imageFile('latest.png','#0000ff',5),other:imageFile('other.png','#00aa00',0),bad:{name:'bad.txt',type:'text/plain',size:3,delay:0}};
const errors=[],surfaces=new WeakMap(),vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
let thumbnailEncodes=0;
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,beforeParse(window){
  window.Image=Image;
  window.HTMLCanvasElement.prototype.getBoundingClientRect=function(){return{left:0,top:0,width:540,height:540*this.height/this.width};};
  for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(window.HTMLCanvasElement.prototype,key);Object.defineProperty(window.HTMLCanvasElement.prototype,key,{...d,set(v){d.set.call(this,v);if(surfaces.has(this))surfaces.get(this)[key]=v;}});}
  window.HTMLCanvasElement.prototype.setPointerCapture=function(){};
  window.HTMLCanvasElement.prototype.toDataURL=function(type,quality){thumbnailEncodes++;return surfaces.get(this).toDataURL(type,quality)};
  window.HTMLCanvasElement.prototype.toBlob=function(done,type,quality){surfaces.get(this).encode('jpeg',Math.round(quality*100)).then(bytes=>done({bytes,type,size:bytes.length}));};
  window.FileReader=class {readAsDataURL(file){this.result=file.dataURL;setTimeout(()=>this.onload&&this.onload(),file.delay||0)}};
  window.URL.createObjectURL=()=> 'blob:test';window.URL.revokeObjectURL=()=>{};window.HTMLAnchorElement.prototype.click=function(){};
  window.HTMLCanvasElement.prototype.getContext=function(){if(!surfaces.has(this))surfaces.set(this,createCanvas(this.width,this.height));return surfaces.get(this).getContext('2d');};
}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(predicate,label,timeout=2000){const stop=Date.now()+timeout;while(!predicate()){if(Date.now()>stop)throw Error('Timed out waiting for '+label);await sleep(10)}}
function choose(input,file){Object.defineProperty(input,'files',{configurable:true,value:[file]});return input.onchange({target:input})}
function photo(i){return dom.window.document.querySelectorAll('.photo')[i]}
(async()=>{
  const {document}=dom.window;const until=Date.now()+25000;
  while(document.body.dataset.ready!=='true'&&Date.now()<until)await sleep(10);
  const initialInput=document.getElementById('add-files');Object.defineProperty(initialInput,'files',{configurable:true,value:['#884422','#228844','#442288','#888844'].map((color,i)=>imageFile('initial-'+i+'.png',color))});await initialInput.onchange({target:initialInput});
  assert.equal(errors.length,0);assert.equal(document.querySelectorAll('.photo').length,4);
  const before=photo(0).querySelector('img').src;assert(before.startsWith('data:image/jpeg;base64,'));
  const beforeBytes=Buffer.from(before.split(',')[1],'base64');assert.equal((await sharp(beforeBytes).metadata()).format,'jpeg');
  const encodesAfterInitial=thumbnailEncodes;photo(0).click();photo(1).click();assert.equal(photo(1).getAttribute('aria-pressed'),'true');assert.equal(photo(0).getAttribute('aria-pressed'),'false');assert.equal(thumbnailEncodes,encodesAfterInitial,'selection reuses cached thumbnail');
  document.getElementById('zoom-in').click();assert.equal(thumbnailEncodes,encodesAfterInitial,'refresh reuses cached thumbnails');

  // The target slot is captured at selection time, not when decoding completes.
  photo(0).click();const slotTwoBefore=photo(2).querySelector('img').src;const delayed=choose(document.getElementById('files'),files.old);photo(2).click();await delayed;
  assert.notEqual(photo(0).querySelector('img').src,before);
  // A newer upload to the same slot wins even if the older decode completes later.
  const preConcurrent=photo(0).querySelector('img').src;
  photo(0).click();const older=choose(document.getElementById('files'),files.old),newer=choose(document.getElementById('files'),files.latest);await Promise.all([older,newer]);
  const latestThumb=photo(0).querySelector('img').src;assert.notEqual(latestThumb,before);
  const latestMeta=await sharp(Buffer.from(latestThumb.split(',')[1],'base64')).metadata();assert.deepEqual([latestMeta.width,latestMeta.height,latestMeta.format],[96,96,'jpeg']);
  const latestStats=await sharp(Buffer.from(latestThumb.split(',')[1],'base64')).stats();assert(latestStats.channels[2].mean>latestStats.channels[0].mean*2,'latest blue upload won over delayed red upload');
  assert.equal(photo(2).querySelector('img').src,slotTwoBefore,'changing selected photo did not redirect upload');

  // Logo upload must not change the captured photo slot; the subsequent photo is rendered on canvas.
  const logoInput=document.getElementById('logo-square');choose(logoInput,imageFile('logo.png','#ffffff'));await waitFor(()=>!document.getElementById('logo-square-remove').disabled,'logo upload');
  photo(1).click();const logoTargetBefore=photo(1).querySelector('img').src;await choose(document.getElementById('files'),files.latest);
  const pixels=dom.window.document.getElementById('canvas').getContext('2d').getImageData(800,250,1,1).data;assert.deepEqual([...pixels],[0,0,255,255],'Correct target frame contains uploaded blue photo after logo upload');
  const uploadedStats=await sharp(Buffer.from(photo(1).querySelector('img').src.split(',')[1],'base64')).stats();assert(uploadedStats.channels[2].mean>240&&uploadedStats.channels[0].mean<10,'Target thumbnail matches uploaded photo');

  // Failed files leave the current image and history untouched.
  const stable=photo(1).querySelector('img').src;await choose(document.getElementById('files'),files.bad);assert(document.getElementById('status').classList.contains('error'));assert.equal(photo(1).querySelector('img').src,stable);
  const corrupt={name:'corrupt.png',type:'image/png',size:12,dataURL:'data:image/png;base64,not-a-real-png'};await choose(document.getElementById('files'),corrupt);assert.match(document.getElementById('status').textContent,/圖片讀取失敗/);assert.equal(photo(1).querySelector('img').src,stable);
  photo(1).click();document.getElementById('undo').click();assert.equal(photo(1).querySelector('img').src,logoTargetBefore);document.getElementById('redo').click();assert.notEqual(photo(1).querySelector('img').src,logoTargetBefore);
  assert.equal(errors.length,0);console.log('PASS: photo selection ARIA, real decoded thumbnails, bounded async uploads, failed upload preservation, and undo/redo.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>dom.window.close());
