/* Offline social collage editor: no network requests or runtime dependencies. */
(async function(){
'use strict';
const C=CollageCore,B=CollageBrand,$=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
const canvas=$('canvas'),ctx=canvas.getContext('2d'),overlay=$('edit-overlay'),ox=overlay.getContext('2d');
const photos=JSON.parse($('photo-data').textContent),images=[],history=[],future=[];
let state=C.defaults(),selected=0,ready=false,gesture=null,downloadUrl=null,zoomBefore=null;
let pageW=1080,pageH=1080;
function say(s,bad=false){$('status').textContent=s;$('status').classList.toggle('error',bad)}
function save(before){if(before){history.push(before);if(history.length>60)history.shift();future.length=0}$('undo').disabled=!history.length;$('redo').disabled=!future.length}
function area(){return B.measure({w:pageW,h:pageH},state.brand).photoArea}
function sync(){const z=C.size(state);pageW=z.w;pageH=z.h;[canvas,overlay].forEach(c=>{c.width=pageW;c.height=pageH});$('canvas-wrap').style.aspectRatio=pageW+'/'+pageH;$('size-label').textContent=state.ratio+' · '+pageW+' × '+pageH}
function load(src){return new Promise((yes,no)=>{const i=new Image();i.onload=()=>yes(i);i.onerror=()=>no(new Error('圖片讀取失敗'));i.src=src})}
function box(){return C.frameBoxes(state)[selected]}
function draw(){
 if(!ready)return;C.draw(ctx,images,state);ox.clearRect(0,0,pageW,pageH);
 const b=box(),scale=pageW/(canvas.getBoundingClientRect().width||540),r=10*scale;
 ox.strokeStyle='#0059FF';ox.lineWidth=2*scale;ox.strokeRect(b.x,b.y,b.w,b.h);
 ox.fillStyle='#FFFFFF';ox.fillRect(b.x,b.y-r*2,r*2,r*2);ox.strokeRect(b.x,b.y-r*2,r*2,r*2);
 ox.fillRect(b.x+b.w-r,b.y+b.h-r,r*2,r*2);ox.strokeRect(b.x+b.w-r,b.y+b.h-r,r*2,r*2);
 if(state.layout==='cut-grid'&&!state.slots.some(s=>s.frame)){C.cutHandles(state).forEach(h=>{ox.beginPath();ox.arc(h.x,h.y,r,0,Math.PI*2);ox.fill();ox.stroke()})}
}
function controls(){
 sync();$('ratio').value=state.ratio;$('zoom').value=Math.round(state.slots[selected].zoom*100);$('zoom-value').value=$('zoom').value+'%';
 $('margin').value=state.margin;$('gap').value=state.gap;$('margin-value').value=state.margin+' px';$('gap-value').value=state.gap+' px';
 $('brand-placement').value=state.brand.placement;$('brand-size').value=Math.round((state.brand.placement==='corner'?state.brand.squareSize:state.brand.wordmarkSize)*100);$('brand-padding').value=state.brand.padding;
 $('brand-size').disabled=state.brand.placement==='none';$('brand-padding').disabled=state.brand.placement==='none';
 document.querySelectorAll('.layout').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.layout===state.layout)));
 document.querySelectorAll('.swatch').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.color.toLowerCase()===state.bg.toLowerCase())));
 $('logo-square-remove').disabled=!state.brand.square;$('logo-wordmark-remove').disabled=!state.brand.wordmark;
 save();
}
function thumbs(){const out=$('photos');out.replaceChildren();state.slots.forEach((s,i)=>{const e=document.createElement('button');e.className='photo';e.setAttribute('aria-pressed',String(i===selected));e.textContent='相片 '+(i+1);e.onclick=()=>{selected=i;controls();draw()};out.append(e)})}
function refresh(){controls();thumbs();draw()}
function rememberAnd(fn){const before=clone(state);fn();refresh();save(before)}
function coords(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*pageW/r.width,y:(e.clientY-r.top)*pageH/r.height}}
function hitHandle(p,b){const scale=pageW/(canvas.getBoundingClientRect().width||540),r=24*scale;if(Math.hypot(p.x-b.x,p.y-(b.y-r*2))<r)return'move';if(Math.hypot(p.x-(b.x+b.w),p.y-(b.y+b.h))<r)return'resize';if(state.layout==='cut-grid'&&!state.slots.some(s=>s.frame)){const h=C.cutHandles(state).find(x=>Math.hypot(p.x-x.x,p.y-x.y)<r);if(h)return h.key}return null}
canvas.addEventListener('pointerdown',e=>{if(!ready||gesture||e.button!==0)return;const p=coords(e),rects=C.frameBoxes(state);let i=selected,b=rects[i],action=hitHandle(p,b);if(!action){i=rects.length-1;while(i>=0&&!C.hit(rects[i],p))i--;if(i<0)return;selected=i;b=rects[i];action=hitHandle(p,b)||'crop'}const slot=state.slots[i],g=C.geometry(images[slot.photo],b,slot);gesture={id:e.pointerId,action,start:p,b,slot:{x:slot.x,y:slot.y},g,before:clone(state),moved:false};canvas.setPointerCapture(e.pointerId);refresh()});
canvas.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const p=coords(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(!gesture.moved&&Math.abs(dx)+Math.abs(dy)<2)return;gesture.moved=true;const b=gesture.b,a=area(),s=state.slots[selected];
 if(gesture.action==='crop'){if(gesture.g.overflowX)s.x=C.clamp(gesture.slot.x-dx/gesture.g.overflowX);if(gesture.g.overflowY)s.y=C.clamp(gesture.slot.y-dy/gesture.g.overflowY)}
 else if(gesture.action==='move')s.frame={x:C.clamp(b.x+dx,a.x,a.x+a.w-b.w),y:C.clamp(b.y+dy,a.y,a.y+a.h-b.h),w:b.w,h:b.h};
 else if(gesture.action==='resize')s.frame={x:b.x,y:b.y,w:C.clamp(b.w+dx,80,a.x+a.w-b.x),h:C.clamp(b.h+dy,80,a.y+a.h-b.y)};
 else {state.layout='cut-grid';state.cut[gesture.action]=C.clamp((['top','bottom'].includes(gesture.action)?p.x-a.x-state.margin:p.y-a.y-state.margin)/(['top','bottom'].includes(gesture.action)?a.w-2*state.margin:a.h-2*state.margin),.15,.85)}
 refresh()});
function finish(e,cancel=false){if(!gesture||gesture.id!==e.pointerId)return;const g=gesture;gesture=null;if(cancel){state=g.before;refresh();return}if(g.moved)save(g.before);draw()}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('lostpointercapture',e=>finish(e,true));
canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const d=e.shiftKey?.05:.01,dx=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0,dy=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;rememberAnd(()=>{const s=state.slots[selected];s.x=C.clamp(s.x-dx);s.y=C.clamp(s.y-dy)});});
C.layouts.forEach(l=>{const e=document.createElement('button');e.className='layout';e.dataset.layout=l.id;e.textContent=l.name;e.onclick=()=>rememberAnd(()=>{state.layout=l.id;state.slots.forEach(s=>delete s.frame)});$('layouts').append(e)});
[['#0B63F6','IG 藍'],['#FFFFFF','純白'],['#F5F8FF','淺藍'],['#00345C','深海藍']].forEach(([color,name])=>{const e=document.createElement('button');e.className='swatch';e.dataset.color=color;e.style.setProperty('--swatch',color);e.textContent=name;e.onclick=()=>rememberAnd(()=>state.bg=color);$('swatches').append(e)});
[['margin','margin'],['gap','gap']].forEach(([id,k])=>$(id).onchange=e=>rememberAnd(()=>state[k]=Number(e.target.value)));
$('ratio').onchange=e=>{if(!['1:1','3:4'].includes(e.target.value))return;rememberAnd(()=>{const old=C.size(state),oldA=B.measure(old,state.brand).photoArea;state.ratio=e.target.value;const next=C.size(state),newA=B.measure(next,state.brand).photoArea;B.remapFrames(state,oldA,newA)})};
$('zoom').onfocus=()=>{zoomBefore??=clone(state)};$('zoom').onpointerdown=()=>{zoomBefore=clone(state)};$('zoom').oninput=e=>{state.slots[selected].zoom=Number(e.target.value)/100;controls();draw()};$('zoom').onchange=()=>{save(zoomBefore||clone(state));zoomBefore=null};
$('center').onclick=()=>rememberAnd(()=>Object.assign(state.slots[selected],{x:.5,y:.5,zoom:1}));
$('undo').onclick=()=>{if(!history.length)return;future.push(clone(state));state=history.pop();refresh();say('已復原')};$('redo').onclick=()=>{if(!future.length)return;history.push(clone(state));state=future.pop();refresh();say('已重做')};$('reset').onclick=()=>rememberAnd(()=>{state=C.defaults();selected=0});
async function readFile(file,limit,maxDimension=Infinity){if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('請使用 PNG、JPG 或 WebP');if(file.size>limit)throw Error('圖片檔案太大');const src=await new Promise((yes,no)=>{const r=new FileReader();r.onload=()=>yes(r.result);r.onerror=()=>no(Error('檔案讀取失敗'));r.readAsDataURL(file)});const image=await load(src);if(image.width>maxDimension||image.height>maxDimension)throw Error('標誌尺寸不可超過 4096px');return{src,image,name:file.name,width:image.width,height:image.height}}
async function uploadLogo(kind,file){try{const asset=await readFile(file,10*1024*1024);const before=clone(state),beforeArea=area(),id=images.length;images.push(asset.image);state.brand[kind]={id,width:asset.width,height:asset.height};B.remapFrames(state,beforeArea,area());refresh();save(before);say('已上載'+(kind==='square'?'正方形':'全名')+'標誌')}catch(err){say(err.message,true)}}
$('logo-square').onchange=e=>{if(e.target.files[0])uploadLogo('square',e.target.files[0]);e.target.value=''};$('logo-wordmark').onchange=e=>{if(e.target.files[0])uploadLogo('wordmark',e.target.files[0]);e.target.value=''};
$('logo-square-remove').onclick=()=>rememberAnd(()=>{state.brand.square=null;if(state.brand.placement==='corner')state.brand.placement='none'});$('logo-wordmark-remove').onclick=()=>rememberAnd(()=>{state.brand.wordmark=null;if(['top','bottom'].includes(state.brand.placement))state.brand.placement='none'});
$('brand-placement').onchange=e=>{const p=e.target.value;if(p==='corner'&&!state.brand.square||(['top','bottom'].includes(p)&&!state.brand.wordmark)){say('請先上載相應標誌',true);controls();return}rememberAnd(()=>{const before=area();state.brand.placement=p;B.remapFrames(state,before,area())})};
$('brand-size').onchange=e=>rememberAnd(()=>{if(state.brand.placement==='corner')state.brand.squareSize=Number(e.target.value)/100;else state.brand.wordmarkSize=Number(e.target.value)/100});
$('brand-padding').onchange=e=>rememberAnd(()=>state.brand.padding=Number(e.target.value));
$('files').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const a=await readFile(f,40*1024*1024),before=clone(state),id=images.length;photos.push({name:a.name,src:a.src});images.push(a.image);Object.assign(state.slots[selected],{photo:id,x:.5,y:.5,zoom:1});refresh();save(before);say('已換入相片')}catch(err){say(err.message,true)}finally{e.target.value=''}};
async function exportJpg(){if(!ready)return;try{const out=document.createElement('canvas');out.width=pageW;out.height=pageH;C.draw(out.getContext('2d'),images,state);const blob=await new Promise((yes,no)=>out.toBlob(x=>x?yes(x):no(Error('JPG輸出失敗')),'image/jpeg',.96));if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=URL.createObjectURL(blob);const a=$('download-fallback');a.href=downloadUrl;a.download='dotai-social-'+pageW+'x'+pageH+'.jpg';a.hidden=false;a.click();say('JPG 已準備好 · '+pageW+' × '+pageH)}catch(err){say(err.message,true)}}
$('export-top').onclick=exportJpg;$('export-bottom').onclick=exportJpg;
try{images.push(...await Promise.all(photos.map(p=>load(p.src))));ready=true;refresh();$('initial-preview').hidden=true;$('export-top').disabled=false;$('export-bottom').disabled=false;say('四張示範圖已就位 · 直接拖動相片或相框') }catch(err){say(err.message,true)}
})();
