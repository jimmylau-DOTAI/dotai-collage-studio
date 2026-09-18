// Offline smoke check: actual Canvas pixels + lightweight DOM event harness.
// This does not pretend to be a browser automation or visual browser test.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const {createCanvas,loadImage,Image}=require('@napi-rs/canvas');
const sharp=require('sharp');const base=path.join(__dirname,'../artifacts');
fs.mkdirSync(base,{recursive:true});
const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
const scripts=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const data=JSON.parse(scripts[0]);
require('../src/collage-core.js');const C=global.CollageCore;
const elements=[];
class Element{
  constructor(tag='div'){this.tag=tag;this.events={};this.children=[];this.attrs={};this.dataset={};this.value='';this.textContent='';this.disabled=false;this.hidden=false;this.clicked=0;this.classes=new Set();this.style={setProperty:(k,v)=>{this.style[k]=v;}};this.classList={add:(v)=>this.classes.add(v),remove:(v)=>this.classes.delete(v),toggle:(v,on)=>{on=on??!this.classes.has(v);if(on)this.classes.add(v);else this.classes.delete(v);}};elements.push(this);}
  set className(v){this.classes=new Set(v.split(' '));}get className(){return [...this.classes].join(' ');}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
  append(...els){this.children.push(...els);}replaceChildren(){this.children=[];}
  addEventListener(type,f){(this.events[type]??=[]).push(f);}
  async fire(type,e={}){e.target??=this;e.preventDefault??=()=>{};for(const f of this.events[type]||[])await f(e);}
  async click(){this.clicked++;return this.onclick?.({target:this});}
  focus(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:540,height:675};}
}
class Canvas extends Element{
  constructor(){super('canvas');this.native=createCanvas(1080,1350);}
  get width(){return this.native.width;}set width(v){this.native.width=v;}
  get height(){return this.native.height;}set height(v){this.native.height=v;}
  getContext(type){return this.native.getContext(type);}
  toBlob(callback,type,quality){this.native.encode('jpeg',Math.round(quality*100)).then(bytes=>callback({type,size:bytes.length,bytes}));}
}
(async()=>{
  assert.equal(data.length,4);assert(!html.includes('file:///'));assert(!html.includes('__APP_JS__'));
  const images=await Promise.all(data.map(p=>loadImage(p.src)));
  const logos={};
  for(const layout of C.layouts)for(const margin of [0,18,64])for(const gap of [0,12,48]){
    const boxes=C.boxes(layout.id,margin,gap);assert.equal(boxes.length,4);
    for(const b of boxes){assert(b.x>=0&&b.y>=0&&b.w>0&&b.h>0&&b.x+b.w<=1080.001&&b.y+b.h<=1350.001);}
    if(!layout.overlap)for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=boxes[i],b=boxes[j];assert(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<.001||Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)<.001);}
    for(let i=0;i<4;i++)for(const x of [0,.5,1])for(const y of [0,.5,1])for(const zoom of [1,3]){
      const b=boxes[i],g=C.geometry(images[i],b,{x,y,zoom});assert(g.x<=b.x+.001&&g.y<=b.y+.001&&g.x+g.w>=b.x+b.w-.001&&g.y+g.h>=b.y+b.h-.001);
    }
  }
  const ids={};for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))ids[id]=['canvas','edit-overlay'].includes(id)?new Canvas():new Element();
  ids['photo-data'].textContent=scripts[0];ids['bg-color']=new Element();
  const blobs=[];const sandbox={console,Image,CollageCore:C,setTimeout,clearTimeout,URL:{createObjectURL:b=>{blobs.push(b);return 'blob:offline-check';},revokeObjectURL(){}},document:{getElementById:id=>ids[id],createElement:tag=>tag==='canvas'?new Canvas():new Element(tag),querySelectorAll:selector=>elements.filter(el=>el.classes.has(selector.slice(1)))},window:{addEventListener(){}}};
  vm.createContext(sandbox);await vm.runInContext(scripts[scripts.length-1],sandbox);
  assert.match(ids.status.textContent,/四張圖片已就位/);assert.equal(ids['export-top'].disabled,false);
  assert.equal(ids['initial-preview'].hidden,true);
  const previewMatch=html.match(/id="initial-preview"[^>]*src="([^"]+)"/);assert(previewMatch);
  const previewImage=await loadImage(previewMatch[1]);assert.equal(previewImage.width,1080);assert.equal(previewImage.height,1080);
  const initial=ids.canvas.native.toBuffer('image/png');
  await ids['export-top'].click();assert.equal(blobs.length,1);let info=await sharp(blobs[0].bytes).metadata();assert.equal(info.width,1080);assert.equal(info.height,1080);assert.equal(info.format,'jpeg');
  // Selected border is separate DOM, so toggling it must not alter pixels.
  await ids.preview.click();assert(ids.canvas.native.toBuffer('image/png').equals(initial));
  for(const button of ids.layouts.children){await button.click();assert.equal(ids['layout-name'].textContent,C.layouts.find(l=>l.id===button.dataset.layout).name);}
  await ids.reset.click();
  ids.zoom.value='170';await ids.zoom.fire('input');await ids.zoom.fire('change');assert.equal(ids['zoom-value'].value,'170%');assert(!ids.canvas.native.toBuffer('image/png').equals(initial));
  await ids.undo.click();assert.equal(ids['zoom-value'].value,'100%');assert(ids.canvas.native.toBuffer('image/png').equals(initial));
  await ids.redo.click();assert.equal(ids['zoom-value'].value,'170%');
  await ids.reset.click();const first=ids.photos.children[0].children[0].src,second=ids.photos.children[1].children[0].src;
  await ids['move-next'].click();assert.equal(ids.photos.children[0].children[0].src,second);assert.equal(ids.photos.children[1].children[0].src,first);
  await ids.reset.click();ids.zoom.value='200';await ids.zoom.fire('input');await ids.zoom.fire('change');const before=ids['pan-x'].value;
  await ids.canvas.fire('pointerdown',{pointerId:7,button:0,clientX:250,clientY:240});await ids.canvas.fire('pointermove',{pointerId:7,clientX:290,clientY:240});await ids.canvas.fire('pointerup',{pointerId:7});assert.notEqual(ids['pan-x'].value,before);
  const previews=[];
  for(const layout of C.layouts){const state=C.defaults();state.layout=layout.id;const canvas=createCanvas(C.W,C.H);C.draw(canvas.getContext('2d'),images,state,logos);const jpg=await canvas.encode('jpeg',96);if(layout.id==='grid')fs.writeFileSync(path.join(base,'sample-1080x1080.jpg'),jpg);previews.push({input:await sharp(jpg).resize(180,180).toBuffer(),left:(previews.length%6)*196+8,top:Math.floor(previews.length/6)*196+8});}
  await sharp({create:{width:1176,height:Math.ceil(C.layouts.length/6)*196,channels:3,background:'#ececec'}}).composite(previews).jpeg({quality:90}).toFile(path.join(base,'layout-preview.jpg'));
  console.log('PASS: 29 layouts; 261 spacing configurations; crop containment; photo loading; zoom; pointer crop; swap; undo/redo; reset; JPEG; overlay excluded.');
})().catch(e=>{console.error(e);process.exit(1);});
