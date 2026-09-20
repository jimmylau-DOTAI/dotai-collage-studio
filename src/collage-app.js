/* Offline social collage editor: no network requests or runtime dependencies. */
(async function(){
'use strict';
const C=CollageCore,B=CollageBrand,$=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
const canvas=$('canvas'),ctx=canvas.getContext('2d'),overlay=$('edit-overlay'),ox=overlay.getContext('2d');
const photos=JSON.parse($('photo-data').textContent),images=[],history=[],future=[],thumbnailCache=new WeakMap(),uploadTokens=[];
let state=C.defaults(),selected=0,ready=false,gesture=null,downloadUrl=null,zoomBefore=null,palette=null;
state.slots=[];state.demo=false;
let pageW=1080,pageH=1080;
let layoutCount=0,batchToken=0,wheelTimer=null,dragSource=null,dropTarget=-1;
$('photos').before($('batch-upload-ui').content.cloneNode(true));
$('layouts').after($('slant-ui').content.cloneNode(true));
const fileInputs=[...document.querySelectorAll('input[type=file]')];fileInputs.forEach(input=>input.disabled=true);$('empty-add').disabled=true;$('show-demo').disabled=true;
const logoTokens={square:0,wordmark:0};
function finishZoom(){window.clearTimeout(wheelTimer);const before=zoomBefore;zoomBefore=null;if(before&&changed(before))save(before)}
function say(s,bad=false){$('status').textContent=s;$('status').classList.toggle('error',bad)}
function save(before){if(before){history.push(before);if(history.length>60)history.shift();future.length=0}$('undo').disabled=!history.length;$('redo').disabled=!future.length}
function changed(before){return JSON.stringify(before)!==JSON.stringify(state)}
function area(){return B.measure({w:pageW,h:pageH},state.brand).photoArea}
function sync(){const z=C.size(state);pageW=z.w;pageH=z.h;[canvas,overlay].forEach(c=>{c.width=pageW;c.height=pageH});$('canvas-wrap').style.aspectRatio=pageW+'/'+pageH;$('size-label').textContent=state.ratio+' · '+pageW+' × '+pageH}
function load(src){return new Promise((yes,no)=>{const i=new Image();i.onload=()=>yes(i);i.onerror=()=>no(new Error('圖片讀取失敗'));i.src=src})}
function box(){return C.frameBoxes(state)[selected]}
function draw(){
 if(!ready)return;C.draw(ctx,images,state);ox.clearRect(0,0,pageW,pageH);
 if(!state.slots.length)return;
 const b=box(),scale=pageW/(canvas.getBoundingClientRect().width||540);
 ox.strokeStyle='#0059FF';ox.lineWidth=2*scale;
 if(b.mask?.kind==='polygon'){ox.beginPath();b.mask.points.forEach(([x,y],i)=>ox[i?'lineTo':'moveTo'](b.x+x*b.w,b.y+y*b.h));ox.closePath();ox.stroke()}else ox.strokeRect(b.x,b.y,b.w,b.h);
 ox.fillStyle='#FFFFFF';for(const h of C.flexHandles(state,selected)){ox.beginPath();ox.arc(h.x,h.y,6*scale,0,Math.PI*2);ox.fill();ox.stroke()}
 if(dropTarget>=0&&dropTarget!==selected){const target=C.frameBoxes(state)[dropTarget];if(target){ox.setLineDash([6*scale,4*scale]);ox.strokeRect(target.x,target.y,target.w,target.h);ox.setLineDash([])}}
}
function controls(){
 const has=state.slots.length>0;selected=Math.max(0,Math.min(selected,state.slots.length-1));renderLayouts();$('photo-count').textContent=state.demo?'示範圖：加入你嘅相片時會全部取代':'目前 '+state.slots.length+' / 9 張';$('add-files').disabled=!state.demo&&state.slots.length>=9;
 $('empty-state').hidden=has;$('canvas-tools').hidden=!has;$('selected-label').textContent='相片 '+(selected+1)+' · '+Math.round((state.slots[selected]?.zoom||1)*100)+'%';$('make-hero').disabled=state.slots.length<2;$('layout-name').textContent=state.customCells?'自訂比例 · 框內移圖':'框內移圖 · 圓點改比例';
 ['zoom','zoom-in','zoom-out','center','export-top','export-bottom'].forEach(id=>$(id).disabled=!has);
 const tilted=!!(state.slant.x||state.slant.y);$('slant-toggle').setAttribute('aria-pressed',String(tilted));$('slant-toggle').textContent=tilted?'關閉斜切':'啟用斜切';$('slant-toggle').disabled=state.slots.length<2;
 ['x','y'].forEach(axis=>{$('slant-'+axis).value=Math.round(state.slant[axis]*100);$('slant-'+axis+'-value').value=Math.round(state.slant[axis]*100);$('slant-'+axis).disabled=state.slots.length<2});$('slant-reset').disabled=!tilted;
 sync();$('ratio').value=state.ratio;$('zoom').value=Math.round((state.slots[selected]?.zoom||1)*100);$('zoom-value').value=$('zoom').value+'%';
 $('margin').value=state.margin;$('gap').value=state.gap;$('margin-value').value=state.margin+' px';$('gap-value').value=state.gap+' px';
 $('bg-color').value=state.bg;$('brand-placement').value=state.brand.placement;const range=B.sizeRange(state.brand.placement);$('brand-size').min=range.min;$('brand-size').max=range.max;$('brand-size').value=Math.round((state.brand.placement==='corner'?state.brand.squareSize:state.brand.wordmarkSize)*100);$('brand-padding').value=state.brand.padding;
 $('brand-size').disabled=state.brand.placement==='none';$('brand-padding').disabled=state.brand.placement==='none';
 document.querySelectorAll('.layout').forEach(e=>e.setAttribute('aria-pressed',String(!state.customCells&&e.dataset.layout===state.layout)));
 if(palette)palette.sync();
 $('logo-square-remove').disabled=!state.brand.square;$('logo-wordmark-remove').disabled=!state.brand.wordmark;
 [['square','logo-square-preview'],['wordmark','logo-wordmark-preview']].forEach(([kind,id])=>{const preview=$(id),asset=state.brand[kind];preview.hidden=!asset;if(asset)preview.src=asset.src});
 save();
}
function thumbnail(image){let cached=thumbnailCache.get(image);if(cached)return cached;const c=document.createElement('canvas'),x=c.getContext('2d'),side=96;c.width=side;c.height=side;const scale=Math.max(side/image.width,side/image.height),w=image.width*scale,h=image.height*scale;x.drawImage(image,(side-w)/2,(side-h)/2,w,h);cached=c.toDataURL('image/jpeg',.85);thumbnailCache.set(image,cached);return cached}
function syncPhotoSelection(){finishZoom();document.querySelectorAll('.photo').forEach((e,i)=>e.setAttribute('aria-pressed',String(i===selected)))}
function thumbs(){const out=$('photos');out.replaceChildren();state.slots.forEach((s,i)=>{
 const card=document.createElement('div'),e=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span'),remove=document.createElement('button');card.className='photo-card';e.className='photo';e.setAttribute('aria-pressed',String(i===selected));e.title='按一下選取；雙擊換圖；拖到另一張交換';e.draggable=true;
 e.ondragstart=event=>beginDrag(i,event);e.ondragover=event=>{if(dragSource){event.preventDefault();e.classList.add('drop-target')}};e.ondragleave=()=>e.classList.remove('drop-target');e.ondrop=event=>dropPhoto(i,event);e.ondragend=()=>{dragSource=null;dropTarget=-1;document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));draw()};
 image.src=thumbnail(images[s.photo]);image.alt='相片 '+(i+1)+' 預覽';image.draggable=false;label.textContent='相片 '+(i+1);e.append(image,label);e.onclick=()=>{selected=i;syncPhotoSelection();controls();draw()};e.ondblclick=()=>pickReplacement(i);remove.className='photo-remove';remove.textContent='移除';remove.setAttribute('aria-label','移除相片 '+(i+1));remove.disabled=state.slots.length===1;remove.onclick=()=>{if(state.slots.length===1)return;batchToken++;rememberAnd(()=>{state.slots=state.slots.filter((_,index)=>index!==i);if(selected>i)selected--;reflow()});say('已移除相片；可按復原還原')};card.append(e,remove);out.append(card)
})}
function reflow(){delete state.customCells;state.layout=C.layoutsFor(state.slots.length)[0].id;state.cut={top:.5,bottom:.5,left:.5,right:.5};state.slots.forEach(s=>{delete s.frame;delete s.mask});if(state.slots.length===1)state.slant={x:0,y:0}}
function pickReplacement(index){finishZoom();selected=index;syncPhotoSelection();controls();draw();$('files').click()}
function refresh(){controls();thumbs();draw()}
function settleGesture(){if(gesture)finish({pointerId:gesture.id})}
function rememberAnd(fn){settleGesture();finishZoom();const before=clone(state);fn();refresh();if(changed(before))save(before)}
function coords(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*pageW/r.width,y:(e.clientY-r.top)*pageH/r.height}}
function atPoint(p){const rects=C.frameBoxes(state);for(let i=rects.length-1;i>=0;i--)if(C.hit(rects[i],p))return i;return-1}
function swapPhotos(from,to){if(from<0||to<0||from===to)return;rememberAnd(()=>{[state.slots[from],state.slots[to]]=[state.slots[to],state.slots[from]];selected=to});say('已交換兩張相片；相框比例不變')}
function beginDrag(index,e){settleGesture();finishZoom();dragSource=state.slots[index];if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','collage-photo')}}
function dropPhoto(index,e){e.preventDefault();const from=state.slots.indexOf(dragSource);dragSource=null;dropTarget=-1;swapPhotos(from,index);draw()}
canvas.addEventListener('dragover',e=>{if(!dragSource)return;e.preventDefault();dropTarget=atPoint(coords(e));draw()});
canvas.addEventListener('drop',e=>dropPhoto(atPoint(coords(e)),e));
canvas.addEventListener('dragleave',()=>{dropTarget=-1;draw()});
$('swap-grip').ondragstart=e=>beginDrag(selected,e);$('swap-grip').ondragend=()=>{dragSource=null;dropTarget=-1;draw()};
$('canvas-zoom-in').onclick=()=>$('zoom-in').click();$('canvas-zoom-out').onclick=()=>$('zoom-out').click();$('canvas-center').onclick=()=>$('center').click();
$('empty-add').onclick=()=>$('add-files').click();
$('show-demo').onclick=()=>rememberAnd(()=>{state=C.defaults();state.demo=true;selected=0});
$('make-hero').onclick=()=>{if(state.slots.length<2)return;rememberAnd(()=>{let k=0;const n=state.slots.length-1;state.customCells=state.slots.map((_,i)=>i===selected?[0,0,.65,1]:[.65,k++/n,.35,1/n])});say('已將相片 '+(selected+1)+' 設為最大主相；白色圓點可再調比例')};
canvas.addEventListener('wheel',e=>{if(!ready||gesture)return;const i=atPoint(coords(e));if(i<0)return;e.preventDefault();if(i!==selected){finishZoom();selected=i}zoomBefore??=clone(state);const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?300:1);state.slots[i].zoom=C.clamp(state.slots[i].zoom*Math.exp(-C.clamp(delta,-200,200)*.002),1,3);controls();draw();syncPhotoSelectionOnly();window.clearTimeout(wheelTimer);wheelTimer=window.setTimeout(finishZoom,180)},{passive:false});
function syncPhotoSelectionOnly(){document.querySelectorAll('.photo').forEach((e,i)=>e.setAttribute('aria-pressed',String(i===selected)))}
canvas.addEventListener('dblclick',e=>{if(!ready)return;const p=coords(e),rects=C.frameBoxes(state);for(let i=rects.length-1;i>=0;i--)if(C.hit(rects[i],p)){pickReplacement(i);break}});
$('slant-toggle').onclick=()=>rememberAnd(()=>{state.slant=state.slant.x||state.slant.y?{x:0,y:0}:{x:.08,y:.06}});
$('slant-reset').onclick=()=>rememberAnd(()=>{state.slant={x:0,y:0};state.cut={top:.5,bottom:.5,left:.5,right:.5};state.slots.forEach(s=>{delete s.frame;delete s.mask})});
['x','y'].forEach(axis=>{$('slant-'+axis).oninput=e=>{settleGesture();zoomBefore??=clone(state);state.slant[axis]=Number(e.target.value)/100;controls();draw()};$('slant-'+axis).onchange=finishZoom;$('slant-'+axis).onblur=finishZoom});
canvas.addEventListener('pointerdown',e=>{if(!ready||gesture||e.button!==0||!state.slots.length)return;finishZoom();const p=coords(e),scale=pageW/(canvas.getBoundingClientRect().width||540),handle=!e.shiftKey&&C.flexHandles(state,selected).find(h=>Math.hypot(h.x-p.x,h.y-p.y)<10*scale);const i=handle?selected:atPoint(p);if(i<0)return;selected=i;const b=C.frameBoxes(state)[i],slot=state.slots[i],g=C.geometry(images[slot.photo],b,slot);gesture={id:e.pointerId,index:i,action:handle?'flex':e.shiftKey?'swap':'crop',corner:handle?.corner,start:p,b,slot:{x:slot.x,y:slot.y},g,before:clone(state),moved:false};canvas.setPointerCapture(e.pointerId);refresh()});
canvas.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const p=coords(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(!gesture.moved&&Math.abs(dx)+Math.abs(dy)<2)return;gesture.moved=true;
 const s0=state.slots[gesture.index];
 if(gesture.action==='flex')state.customCells=C.resizeLayout(gesture.before,gesture.index,gesture.corner,p);
 else if(gesture.action==='swap')dropTarget=atPoint(p);
 else{if(gesture.g.overflowX)s0.x=C.clamp(gesture.slot.x-dx/gesture.g.overflowX);if(gesture.g.overflowY)s0.y=C.clamp(gesture.slot.y-dy/gesture.g.overflowY)}
 refresh()});
function finish(e,cancel=false){if(!gesture||gesture.id!==e.pointerId)return;const g=gesture,target=dropTarget;gesture=null;dropTarget=-1;if(cancel){state=g.before;refresh();return}if(g.action==='swap'&&g.moved){swapPhotos(g.index,target);return}if(g.moved&&changed(g.before))save(g.before);draw()}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('lostpointercapture',e=>finish(e,true));
canvas.addEventListener('keydown',e=>{if(!state.slots.length)return;if(e.key==='Escape'){if(gesture){const g=gesture;gesture=null;dropTarget=-1;state=g.before;refresh()}return}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const d=e.shiftKey?.05:.01,dx=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0,dy=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;rememberAnd(()=>{const s=state.slots[selected];s.x=C.clamp(s.x-dx);s.y=C.clamp(s.y-dy)});});
function renderLayouts(){const count=state.slots.length;if(layoutCount===count)return;layoutCount=count;$('layouts').replaceChildren();if(!count)return;C.layoutsFor(count).forEach(l=>{const e=document.createElement('button'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),label=document.createElement('span');e.className='layout';e.dataset.layout=l.id;svg.classList.add('layout-preview');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');l.cells.forEach(([x,y,w,h])=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',String(x*100+3));r.setAttribute('y',String(y*100+3));r.setAttribute('width',String(w*100-6));r.setAttribute('height',String(h*100-6));svg.append(r)});label.textContent=l.name;e.append(svg,label);e.onclick=()=>rememberAnd(()=>{delete state.customCells;state.layout=l.id;state.slots.forEach(s=>{delete s.frame;delete s.mask});if(l.id==='cut-grid')state.slant={x:.08,y:.06}});$('layouts').append(e)})}
let colorStorage;try{colorStorage=window.localStorage}catch{}
palette=CollagePalette.mount({document,storage:colorStorage,getColor:()=>state.bg,applyColor:color=>rememberAnd(()=>state.bg=color),notify:say,prompt:(...args)=>window.prompt(...args)});
[['margin','margin'],['gap','gap']].forEach(([id,k])=>$(id).onchange=e=>rememberAnd(()=>state[k]=Number(e.target.value)));
$('ratio').onchange=e=>{if(!['1:1','4:5'].includes(e.target.value))return;rememberAnd(()=>{const old=C.size(state),oldA=B.measure(old,state.brand).photoArea;state.ratio=e.target.value;const next=C.size(state),newA=B.measure(next,state.brand).photoArea;B.remapFrames(state,oldA,newA)})};
$('zoom').oninput=e=>{zoomBefore??=clone(state);state.slots[selected].zoom=Number(e.target.value)/100;controls();draw()};$('zoom').onchange=finishZoom;$('zoom').onblur=finishZoom;
$('zoom-out').onclick=()=>rememberAnd(()=>state.slots[selected].zoom=C.clamp(state.slots[selected].zoom-.1,1,3));$('zoom-in').onclick=()=>rememberAnd(()=>state.slots[selected].zoom=C.clamp(state.slots[selected].zoom+.1,1,3));
$('center').onclick=()=>rememberAnd(()=>Object.assign(state.slots[selected],{x:.5,y:.5,zoom:1}));
$('undo').onclick=()=>{settleGesture();finishZoom();if(!history.length)return;future.push(clone(state));state=history.pop();refresh();say('已復原')};$('redo').onclick=()=>{settleGesture();finishZoom();if(!future.length)return;history.push(clone(state));state=future.pop();refresh();say('已重做')};$('reset').onclick=()=>rememberAnd(()=>{state=C.defaults();state.slots=[];state.demo=false;selected=0});
async function readFile(file,limit,maxDimension=Infinity){if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw Error('請使用 PNG、JPG 或 WebP');if(file.size>limit)throw Error('圖片檔案太大');const src=await new Promise((yes,no)=>{const r=new FileReader();r.onload=()=>yes(r.result);r.onerror=()=>no(Error('檔案讀取失敗'));r.readAsDataURL(file)});const image=await load(src);if(image.width>maxDimension||image.height>maxDimension)throw Error('標誌尺寸不可超過 4096px');return{src,image,name:file.name,width:image.width,height:image.height}}
function changeBrand(fn){rememberAnd(()=>B.update(state,fn))}
async function uploadLogo(kind,file){const token=++logoTokens[kind];try{const asset=await readFile(file,10*1024*1024,4096);if(token!==logoTokens[kind])return;const id=images.length;images.push(asset.image);changeBrand(brand=>{brand[kind]={id,src:asset.src,width:asset.width,height:asset.height}});say('已上載'+(kind==='square'?'正方形':'全名')+'標誌')}catch(err){if(token===logoTokens[kind])say(err.message,true)}}
['square','wordmark'].forEach(kind=>{$('logo-'+kind).onchange=async e=>{const file=e.target.files[0];e.target.value='';if(file)await uploadLogo(kind,file)}});
$('logo-square-remove').onclick=()=>{logoTokens.square++;changeBrand(brand=>{brand.square=null;if(brand.placement==='corner')brand.placement='none'})};$('logo-wordmark-remove').onclick=()=>{logoTokens.wordmark++;changeBrand(brand=>{brand.wordmark=null;if(['top','bottom'].includes(brand.placement))brand.placement='none'})};
$('brand-placement').onchange=e=>{const p=e.target.value;if(p==='corner'&&!state.brand.square||(['top','bottom'].includes(p)&&!state.brand.wordmark)){say('請先上載相應標誌',true);controls();return}changeBrand(brand=>brand.placement=p)};
$('brand-size').onchange=e=>{const value=Number(e.target.value)/100;changeBrand(brand=>{if(brand.placement==='corner')brand.squareSize=value;else brand.wordmarkSize=value})};
$('brand-padding').onchange=e=>{const value=Number(e.target.value);changeBrand(brand=>brand.padding=value)};
// Capture the slot and invalidate older work before any asynchronous file read.
// This keeps a later selection authoritative, even when an earlier decode finishes last.
$('files').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!state.slots.length||state.demo)return uploadCollection(e,false);batchToken++;const slotIndex=selected,target=state.slots[slotIndex],token=(uploadTokens[slotIndex]||0)+1;uploadTokens[slotIndex]=token;const active=()=>uploadTokens[slotIndex]===token&&state.slots[slotIndex]===target;try{const a=await readFile(f,40*1024*1024);if(!active())return;finishZoom();const before=clone(state),id=images.length;images.push(a.image);Object.assign(target,{photo:id,x:.5,y:.5,zoom:1});refresh();save(before);say('已換入相片')}catch(err){if(active())say(err.message,true)}finally{e.target.value=''}};
async function uploadCollection(e,append){
 append=append&&!state.demo;
 const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
 const token=++batchToken;
 if(files.length+(append?state.slots.length:0)>9){say('最多 9 張；未更改現有作品，請先移除部分相片或減少選取',true);return}
 if(files.reduce((sum,f)=>sum+f.size,0)>120*1024*1024){say('整組相片請保持在 120MB 以內；現有作品未改動',true);return}
 const slotsBefore=state.slots;
 say('正在載入 '+files.length+' 張相片…');
 try{
  const assets=[];
  for(const file of files){assets.push(await readFile(file,40*1024*1024));if(token!==batchToken||state.slots!==slotsBefore)return}
  rememberAnd(()=>{const start=images.length,oldCount=state.slots.length;images.push(...assets.map(a=>a.image));const added=assets.map((_,i)=>({photo:start+i,x:.5,y:.5,zoom:1}));state.slots=append?[...state.slots,...added]:added;state.demo=false;reflow();selected=append?oldCount:0});
  say('已'+(append?'新增':'換入')+' '+assets.length+' 張相片並重新排版；可按復原還原');
 }catch(err){if(token===batchToken&&state.slots===slotsBefore)say(err.message+'；整組未更改',true)}
}
$('batch-files').onchange=e=>uploadCollection(e,false);$('add-files').onchange=e=>uploadCollection(e,true);
async function exportJpg(){if(!ready)return;try{const out=document.createElement('canvas');out.width=pageW;out.height=pageH;C.draw(out.getContext('2d'),images,state);const blob=await new Promise((yes,no)=>out.toBlob(x=>x?yes(x):no(Error('JPG輸出失敗')),'image/jpeg',.96));if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=URL.createObjectURL(blob);const a=$('download-fallback');a.href=downloadUrl;a.download='dotai-social-'+pageW+'x'+pageH+'.jpg';a.hidden=false;a.click();say('JPG 已準備好 · '+pageW+' × '+pageH)}catch(err){say(err.message,true)}}
$('export-top').onclick=exportJpg;$('export-bottom').onclick=exportJpg;
try{images.push(...await Promise.all(photos.map(p=>load(p.src))));ready=true;fileInputs.forEach(input=>input.disabled=false);$('empty-add').disabled=false;$('show-demo').disabled=false;refresh();$('initial-preview').hidden=true;document.body.dataset.ready='true';say('加入你嘅相片開始；示範圖不會自動加入作品') }catch(err){say(err.message,true)}
})();
