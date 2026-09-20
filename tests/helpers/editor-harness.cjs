// Execute the shipped offline page with real image decoding and canvas output.
// This is not a browser layout or touch test.
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const {createCanvas,Image}=require('@napi-rs/canvas');

async function waitFor(predicate,label='editor update',timeout=5000){
  const stop=Date.now()+timeout;
  while(!predicate()){
    if(Date.now()>stop)throw Error('Timed out: '+label);
    await new Promise(resolve=>setTimeout(resolve,10));
  }
}

async function openEditor({empty=false,stored={}}={}){
  const surfaces=new WeakMap(),downloads=[],errors=[],prompts=[];
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  const html=fs.readFileSync(path.join(__dirname,'../../dist/index.html'),'utf8');
  const dom=new JSDOM(html,{url:'https://collage.test/',runScripts:'dangerously',virtualConsole,beforeParse(window){
    for(const [key,value] of Object.entries(stored))window.localStorage.setItem(key,value);
    window.Image=Image;
    window.prompt=()=>prompts.shift()??null;
    const proto=window.HTMLCanvasElement.prototype;
    for(const key of ['width','height']){
      const descriptor=Object.getOwnPropertyDescriptor(proto,key);
      Object.defineProperty(proto,key,{...descriptor,set(value){descriptor.set.call(this,value);if(surfaces.has(this))surfaces.get(this)[key]=value;}});
    }
    proto.getBoundingClientRect=function(){return{left:0,top:0,width:540,height:this.height/this.width*540};};
    proto.getContext=function(){if(!surfaces.has(this))surfaces.set(this,createCanvas(this.width,this.height));return surfaces.get(this).getContext('2d');};
    proto.setPointerCapture=function(){};
    proto.releasePointerCapture=function(){};
    proto.toDataURL=function(type,quality){return surfaces.get(this).toDataURL(type,quality);};
    proto.toBlob=function(done,type,quality){surfaces.get(this).encode('jpeg',Math.round(quality*100)).then(bytes=>done({bytes,type,size:bytes.length}));};
    window.URL.createObjectURL=blob=>{downloads.push(blob);return'blob:editor-test';};
    window.URL.revokeObjectURL=()=>{};
    window.HTMLAnchorElement.prototype.click=function(){};
  }});
  const {window}=dom,el=id=>window.document.getElementById(id);
  try{await waitFor(()=>errors.length||window.document.body.dataset.ready==='true','initialization',25000);if(errors.length)throw Error(errors.join('\n'));if(!empty)el('show-demo').click();}
  catch(error){window.close();throw error;}
  function change(id,value){el(id).value=value;el(id).dispatchEvent(new window.Event('change',{bubbles:true}));}
  function file(name,color,width=320,height=180){
    const canvas=createCanvas(width,height),ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,width,height);
    return new window.File([canvas.toBuffer('image/png')],name,{type:'image/png'});
  }
  async function upload(id,image){Object.defineProperty(el(id),'files',{configurable:true,value:[image]});await el(id).onchange({target:el(id)});}
  function pointer(type,x,y,id=1){
    const e=new window.MouseEvent(type,{clientX:x/2,clientY:y/2,button:0,bubbles:true});
    Object.defineProperty(e,'pointerId',{value:id});el('canvas').dispatchEvent(e);
  }
  async function download(){const n=downloads.length;el('export-top').click();await waitFor(()=>downloads.length>n,'download');return downloads.at(-1).bytes;}
  const picture=()=>surfaces.get(el('canvas'));
  return{window,el,change,file,upload,pointer,download,picture,errors,prompts,close:()=>window.close()};
}
module.exports={openEditor,waitFor};
