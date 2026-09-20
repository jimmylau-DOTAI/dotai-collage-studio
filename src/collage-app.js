/* Offline social collage editor: no network requests or runtime dependencies. */
(async function(){
'use strict';
const C=CollageCore,B=CollageBrand,$=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
const canvas=$('canvas'),ctx=canvas.getContext('2d'),overlay=$('edit-overlay'),ox=overlay.getContext('2d');
const photos=JSON.parse($('photo-data').textContent),images=[],history=[],future=[],thumbnailCache=new WeakMap(),uploadTokens=[];
let state=C.defaults(),selected=0,ready=false,gesture=null,downloadUrl=null,zoomBefore=null,palette=null;
state.slots=[];state.demo=false;
let pageW=1080,pageH=1080,holdTimer=null,frameMode=false,frameTool='proportion';
let layoutCount=0,batchToken=0,wheelTimer=null,dragSource=null,dropTarget=-1,exchangeSource=null;
$('photos').before($('batch-upload-ui').content.cloneNode(true));
$('layouts').after($('slant-ui').content.cloneNode(true));
const editorControls=document.createElement('div');editorControls.className='editor-controls';editorControls.append(document.querySelector('.mode-switch'),$('canvas-tools'));editorControls.append($('help-toggle'));$('canvas-wrap').before(editorControls,$('mode-hint'),$('editor-help'));
const fileInputs=[...document.querySelectorAll('input[type=file]')];fileInputs.forEach(input=>input.disabled=true);$('empty-add').disabled=true;$('show-demo').disabled=true;
const logoTokens={square:0,wordmark:0};
function finishZoom(){window.clearTimeout(wheelTimer);const before=zoomBefore;zoomBefore=null;if(before&&changed(before))save(before)}
function say(s,bad=false){$('status').textContent=s;$('status').classList.toggle('error',bad)}
function save(before){if(before){history.push(before);if(history.length>60)history.shift();future.length=0}$('undo').disabled=!history.length;$('redo').disabled=!future.length}
function changed(before){return JSON.stringify(before)!==JSON.stringify(state)}
function area(){return B.measure({w:pageW,h:pageH},state.brand).photoArea}
function sync(){const z=C.size(state);pageW=z.w;pageH=z.h;[canvas,overlay].forEach(c=>{c.width=pageW;c.height=pageH});$('canvas-wrap').style.aspectRatio=pageW+'/'+pageH;$('canvas-wrap').style.setProperty('--ratio',pageW/pageH);$('size-label').textContent=state.ratio+' · '+pageW+' × '+pageH}
function load(src){return new Promise((yes,no)=>{const i=new Image();i.onload=()=>yes(i);i.onerror=()=>no(new Error('圖片讀取失敗'));i.src=src})}
function box(){return C.frameBoxes(state)[selected]}
function setMode(mode){if(gesture||!state.slots.length||(mode==='slant'&&state.slots.length<2))return;finishZoom();exchangeSource=null;frameMode=mode!=='photo';frameTool=mode==='slant'?'slant':'proportion';refresh()}
function completeExchange(index){const from=state.slots.indexOf(exchangeSource);if(from<0){exchangeSource=null;refresh();return}if(index===from){say('請揀另一張相片，或者按取消交換');return}exchangeSource=null;swapPhotos(from,index);refresh()}
function updateHint(){
 let text;
 if(!state.slots.length)text='先加入相片，再揀排版。';
 else if(exchangeSource)text='請點另一張相片交換；可點畫布或相片列表嘅縮圖。';
 else if(gesture?.action==='swap')text='已抓起相片：拖到另一張交換；放回原位或按 Esc 取消。';
 else if(gesture?.moved)text=gesture.action==='slant'?'正在調整分界角度。':gesture.action==='flex'?'正在調整相框比例，其他框會同步改變。':gesture.action==='photo-scale'?(state.slots[selected].zoom>=3?'已到放大上限 300%。':'正在調整相片大小，相框保持不變。'):'正在移動相片焦點。';
 else if(frameMode)text=frameTool==='slant'?'拖菱形端點改分界角度；還原直線可取消傾斜。':'拖橙色圓點改相框比例；點相片內部可調構圖。';
 else text=state.slots[selected]?.zoom>=3?'已到放大上限 300%；拖圖片調焦點，或按縮小。':'拖圖片移焦點；拖藍色角點縮放，或使用旁邊按鈕。';
 if(state.slots.length===1)text+=' 斜切及交換至少需要兩張相片。';
 // Announce only changed instructions, not every pointer movement.
 if($('mode-hint').textContent!==text)$('mode-hint').textContent=text;
}
function showHelp(open){$('editor-help').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));if(!open)$('help-toggle').focus()}
function slantHandles(){if(state.slots.length<2)return[];const a=C.photoArea(state),m=state.margin,w=a.w-2*m,h=a.h-2*m,cells=C.effectiveLayout(state).cells,out=[];for(const axis of ['x','y']){const k=axis==='x'?0:1,knots=[...new Set(cells.flatMap(c=>[c[k],c[k]+c[k+2]]))].filter(v=>v>1e-6&&v<1-1e-6);for(const v of knots)for(const sign of [-1,1]){const factor=Math.sin(Math.PI*v)*sign*(axis==='x'?w:h),offset=state.slant[axis]*factor;out.push({axis,factor,x:a.x+m+(axis==='x'?v*w+offset:sign<0?0:w),y:a.y+m+(axis==='y'?v*h+offset:sign<0?0:h)})}}return out}
function frameHandles(){return frameTool==='slant'?slantHandles():C.flexHandles(state,selected)}
function photoHandles(b){return(b.mask?.points||[[0,0],[1,0],[1,1],[0,1]]).map(([x,y])=>({x:b.x+x*b.w,y:b.y+y*b.h}))}
function edgeAt(p,tolerance){const boxes=C.frameBoxes(state);for(let i=boxes.length-1;i>=0;i--){const points=photoHandles(boxes[i]);for(let j=0;j<points.length;j++){const a=points[j],b=points[(j+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,t=C.clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1));if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<=tolerance)return i}}return-1}
function draw(){
 if(!ready)return;C.draw(ctx,images,state);ox.clearRect(0,0,pageW,pageH);
 if(!state.slots.length)return;
 const b=box(),scale=pageW/(canvas.getBoundingClientRect().width||540);
 // Contextual tools stay outside the artwork in normal document flow.
 ox.strokeStyle=frameMode?'#D16A00':'#0059FF';ox.lineWidth=2*scale;
 if(b.mask?.kind==='polygon'){ox.beginPath();b.mask.points.forEach(([x,y],i)=>ox[i?'lineTo':'moveTo'](b.x+x*b.w,b.y+y*b.h));ox.closePath();ox.stroke()}else ox.strokeRect(b.x,b.y,b.w,b.h);
 ox.fillStyle='#FFFFFF';for(const h of (exchangeSource?[]:frameMode?frameHandles():photoHandles(b))){ox.beginPath();if(frameMode&&frameTool==='slant'){ox.moveTo(h.x,h.y-8*scale);ox.lineTo(h.x+8*scale,h.y);ox.lineTo(h.x,h.y+8*scale);ox.lineTo(h.x-8*scale,h.y);ox.closePath()}else ox.arc(h.x,h.y,6*scale,0,Math.PI*2);ox.fill();ox.stroke()}
 if(dropTarget>=0&&dropTarget!==selected){const target=C.frameBoxes(state)[dropTarget];if(target){ox.setLineDash([6*scale,4*scale]);ox.strokeRect(target.x,target.y,target.w,target.h);ox.setLineDash([])}}
}
function controls(){
 if(state.slots.length<2&&frameTool==='slant')frameTool='proportion';if(exchangeSource&&!state.slots.includes(exchangeSource))exchangeSource=null;const isSlant=frameMode&&frameTool==='slant';$('slant-mode').setAttribute('aria-pressed',String(isSlant));$('slant-mode').disabled=state.slots.length<2;$('slant-mode').title=state.slots.length<2?'至少需要兩張相片':'拖菱形端點改分界角度';$('slant-actions').hidden=!isSlant;document.querySelector('.slant-panel').hidden=true;
 const has=state.slots.length>0;selected=Math.max(0,Math.min(selected,state.slots.length-1));renderLayouts();$('photo-count').textContent=state.demo?'示範圖：加入你嘅相片時會全部取代':'目前 '+state.slots.length+' / 9 張';$('add-files').disabled=!state.demo&&state.slots.length>=9;
 $('empty-state').hidden=has;$('canvas-tools').hidden=!has;$('selected-label').textContent=isSlant?'調整分界角度':frameMode?'相框 '+(selected+1):'相片 '+(selected+1)+' · '+Math.round((state.slots[selected]?.zoom||1)*100)+'%';$('make-hero').disabled=state.slots.length<2;$('layout-name').textContent=frameMode?(frameTool==='slant'?'斜切 · 拖菱形端點改角度':'比例 · 拖圓點改大小'):'調構圖 · 只調整所選相片';canvas.dataset.mode=isSlant?'slant':frameMode?'frame':'crop';$('photo-mode').setAttribute('aria-pressed',String(!frameMode));$('photo-actions').hidden=frameMode;$('frame-actions').hidden=!frameMode||isSlant;$('frame-mode').setAttribute('aria-pressed',String(frameMode&&!isSlant));$('photo-mode').disabled=!has;$('frame-mode').disabled=!has;$('swap-select').disabled=state.slots.length<2;$('swap-select').setAttribute('aria-pressed',String(!!exchangeSource));$('swap-cancel').hidden=!exchangeSource;updateHint();
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
 const card=document.createElement('div'),e=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span'),remove=document.createElement('button');card.className='photo-card';e.className='photo';e.setAttribute('aria-pressed',String(i===selected));e.title='點選調構圖；拖到另一張交換';e.draggable=true;
 e.ondragstart=event=>beginDrag(i,event);e.ondragover=event=>{if(dragSource){event.preventDefault();e.classList.add('drop-target')}};e.ondragleave=()=>e.classList.remove('drop-target');e.ondrop=event=>dropPhoto(i,event);e.ondragend=()=>{dragSource=null;dropTarget=-1;document.querySelectorAll('.drop-target').forEach(n=>n.classList.remove('drop-target'));draw()};
 image.src=thumbnail(images[s.photo]);image.alt='相片 '+(i+1)+' 預覽';image.draggable=false;label.textContent='相片 '+(i+1);e.append(image,label);e.onclick=()=>selectPhoto(i);e.ondblclick=()=>selectPhoto(i);remove.className='photo-remove';remove.textContent='移除';remove.setAttribute('aria-label','移除相片 '+(i+1));remove.disabled=state.slots.length===1;remove.onclick=()=>{if(state.slots.length===1)return;batchToken++;rememberAnd(()=>{state.slots=state.slots.filter((_,index)=>index!==i);if(selected>i)selected--;reflow()});say('已移除相片；可按復原還原')};card.append(e,remove);out.append(card)
})}
function reflow(){delete state.customCells;state.layout=C.layoutsFor(state.slots.length)[0].id;state.cut={top:.5,bottom:.5,left:.5,right:.5};state.slots.forEach(s=>{delete s.frame;delete s.mask});if(state.slots.length===1)state.slant={x:0,y:0}}
function selectPhoto(index){if(gesture)return;if(exchangeSource){completeExchange(index);return}frameMode=false;finishZoom();selected=index;syncPhotoSelection();controls();draw();canvas.focus()}
function refresh(){controls();thumbs();draw()}
document.querySelector('.stage').addEventListener('pointerdown',e=>{if(!ready||gesture||!state.slots.length||e.button!==0)return;if(e.target.matches('.stage,.stage-caption,.stage-top,.stage-top span,#status')){finishZoom();frameMode=true;frameTool='proportion';exchangeSource=null;refresh()}});
function settleGesture(){if(gesture)finish({pointerId:gesture.id})}
function rememberAnd(fn){settleGesture();finishZoom();exchangeSource=null;const before=clone(state);fn();refresh();if(changed(before))save(before)}
function coords(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*pageW/r.width,y:(e.clientY-r.top)*pageH/r.height}}
function atPoint(p){const rects=C.frameBoxes(state);for(let i=rects.length-1;i>=0;i--)if(C.hit(rects[i],p))return i;return-1}
function swapPhotos(from,to){if(from<0||to<0||from===to)return;rememberAnd(()=>{[state.slots[from],state.slots[to]]=[state.slots[to],state.slots[from]];selected=to});say('已交換兩張相片；相框比例不變')}
function beginDrag(index,e){settleGesture();finishZoom();dragSource=state.slots[index];if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain','collage-photo')}}
function dropPhoto(index,e){e.preventDefault();const from=state.slots.indexOf(dragSource);dragSource=null;dropTarget=-1;swapPhotos(from,index);draw()}
canvas.addEventListener('dragover',e=>{if(!dragSource)return;e.preventDefault();dropTarget=atPoint(coords(e));draw()});
canvas.addEventListener('drop',e=>dropPhoto(atPoint(coords(e)),e));
canvas.addEventListener('dragleave',()=>{dropTarget=-1;draw()});
$('frame-mode').onclick=()=>setMode('frame');$('photo-mode').onclick=()=>setMode('photo');$('slant-mode').onclick=()=>setMode('slant');$('frame-reset').onclick=()=>rememberAnd(()=>{delete state.customCells;state.slots.forEach(s=>{delete s.frame;delete s.mask});state.cut={top:.5,bottom:.5,left:.5,right:.5}});
$('canvas-zoom-in').onclick=()=>$('zoom-in').click();$('canvas-zoom-out').onclick=()=>$('zoom-out').click();$('canvas-center').onclick=()=>$('center').click();
$('swap-select').onclick=()=>{if(gesture||state.slots.length<2)return;finishZoom();exchangeSource=state.slots[selected];refresh()};$('swap-cancel').onclick=()=>{exchangeSource=null;refresh();say('已取消交換，作品冇改動')};
$('help-toggle').onclick=()=>showHelp($('editor-help').hidden);$('help-close').onclick=()=>showHelp(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(gesture){finish({pointerId:gesture.id},true);e.preventDefault()}if(exchangeSource){exchangeSource=null;refresh();e.preventDefault()}if(!$('editor-help').hidden){showHelp(false);e.preventDefault()}return}if(e.key==='?'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.target.closest?.('input,textarea,select,[contenteditable]')){e.preventDefault();showHelp($('editor-help').hidden)}});
 $('slant-straight').onclick=()=>$('slant-reset').click();
$('empty-add').onclick=()=>$('add-files').click();
$('show-demo').onclick=()=>rememberAnd(()=>{state=C.defaults();state.demo=true;selected=0});
$('make-hero').onclick=()=>{if(state.slots.length<2)return;rememberAnd(()=>{let k=0;const n=state.slots.length-1;state.customCells=state.slots.map((_,i)=>i===selected?[0,0,.65,1]:[.65,k++/n,.35,1/n])});say('已將相片 '+(selected+1)+' 設為最大主相；白色圓點可再調比例')};
canvas.addEventListener('wheel',e=>{if(!ready||gesture)return;const i=atPoint(coords(e));if(i<0)return;e.preventDefault();if(i!==selected){finishZoom();selected=i}zoomBefore??=clone(state);const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?300:1);state.slots[i].zoom=C.clamp(state.slots[i].zoom*Math.exp(-C.clamp(delta,-200,200)*.002),1,3);controls();draw();syncPhotoSelectionOnly();window.clearTimeout(wheelTimer);wheelTimer=window.setTimeout(finishZoom,180)},{passive:false});
function syncPhotoSelectionOnly(){document.querySelectorAll('.photo').forEach((e,i)=>e.setAttribute('aria-pressed',String(i===selected)))}
canvas.addEventListener('dblclick',e=>{if(!ready)return;const p=coords(e),rects=C.frameBoxes(state);for(let i=rects.length-1;i>=0;i--)if(C.hit(rects[i],p)){selectPhoto(i);break}});
$('slant-toggle').onclick=()=>rememberAnd(()=>{state.slant=state.slant.x||state.slant.y?{x:0,y:0}:{x:.08,y:.06}});
$('slant-reset').onclick=()=>rememberAnd(()=>{state.slant={x:0,y:0};state.cut={top:.5,bottom:.5,left:.5,right:.5};state.slots.forEach(s=>{delete s.frame;delete s.mask})});
['x','y'].forEach(axis=>{$('slant-'+axis).oninput=e=>{settleGesture();zoomBefore??=clone(state);state.slant[axis]=Number(e.target.value)/100;controls();draw()};$('slant-'+axis).onchange=finishZoom;$('slant-'+axis).onblur=finishZoom});
canvas.addEventListener('pointerdown',e=>{if(!ready||gesture||e.button!==0||!state.slots.length)return;if(exchangeSource){const target=atPoint(coords(e));if(target>=0)completeExchange(target);return}finishZoom();const p=coords(e),scale=pageW/(canvas.getBoundingClientRect().width||540),handle=frameMode&&!e.shiftKey&&frameHandles().find(h=>Math.hypot(h.x-p.x,h.y-p.y)<10*scale);const ph=!frameMode&&!e.shiftKey&&photoHandles(box()).find(h=>Math.hypot(h.x-p.x,h.y-p.y)<10*scale),edge=!handle&&!ph&&!e.shiftKey?edgeAt(p,5*scale):-1;const i=handle||ph?selected:edge>=0?edge:atPoint(p);if(i<0){frameMode=true;frameTool='proportion';refresh();return}if(!handle){frameMode=edge>=0;frameTool='proportion'}selected=i;const b=C.frameBoxes(state)[i],slot=state.slots[i],g=C.geometry(images[slot.photo],b,slot);gesture={id:e.pointerId,index:i,action:handle?(frameTool==='slant'?'slant':'flex'):ph?'photo-scale':edge>=0?'frame-select':e.shiftKey?'swap':'crop',corner:handle?.corner,slantHandle:handle,start:p,b,slot:{x:slot.x,y:slot.y,zoom:slot.zoom},g,before:clone(state),moved:false};canvas.setPointerCapture(e.pointerId);window.clearTimeout(holdTimer);if(gesture.action==='crop'&&state.slots.length>1)holdTimer=window.setTimeout(()=>{if(!gesture||gesture.moved)return;gesture.action='swap';updateHint();canvas.style.cursor='grabbing';say('已抓起相片：拖去另一張交換，放開取消');draw()},450);refresh()});
canvas.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const p=coords(e),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(!gesture.moved&&Math.abs(dx)+Math.abs(dy)<2)return;gesture.moved=true;window.clearTimeout(holdTimer);
 const s0=state.slots[gesture.index];
 if(gesture.action==='slant'){const h=gesture.slantHandle;state.slant[h.axis]=C.clamp(gesture.before.slant[h.axis]+(h.axis==='x'?dx:dy)/h.factor,-.12,.12)}else if(gesture.action==='flex')state.customCells=C.resizeLayout(gesture.before,gesture.index,gesture.corner,p);
 else if(gesture.action==='photo-scale'){const cx=gesture.b.x+gesture.b.w/2,cy=gesture.b.y+gesture.b.h/2,start=Math.hypot(gesture.start.x-cx,gesture.start.y-cy);s0.zoom=C.clamp(gesture.slot.zoom*Math.hypot(p.x-cx,p.y-cy)/Math.max(1,start),1,3)}else if(gesture.action==='frame-select')return;else if(gesture.action==='swap')dropTarget=atPoint(p);
 else{if(gesture.g.overflowX)s0.x=C.clamp(gesture.slot.x-dx/gesture.g.overflowX);if(gesture.g.overflowY)s0.y=C.clamp(gesture.slot.y-dy/gesture.g.overflowY)}
 refresh()});
function finish(e,cancel=false){if(!gesture||gesture.id!==e.pointerId)return;window.clearTimeout(holdTimer);canvas.style.cursor='';const g=gesture,target=dropTarget;gesture=null;dropTarget=-1;if(cancel){state=g.before;refresh();return}if(g.action==='swap'){if(g.moved)swapPhotos(g.index,target);updateHint();draw();say(target>=0&&target!==g.index?'已交換相片；可復原':'已返回調構圖');return}if(g.moved&&changed(g.before))save(g.before);updateHint();draw()}
canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',e=>finish(e,true));canvas.addEventListener('lostpointercapture',e=>finish(e,true));
canvas.addEventListener('keydown',e=>{if(!state.slots.length)return;if(e.key==='Escape'){if(gesture){window.clearTimeout(holdTimer);canvas.style.cursor='';const g=gesture;gesture=null;dropTarget=-1;state=g.before;refresh()}return}if(frameMode||exchangeSource||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const d=e.shiftKey?.05:.01,dx=e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0,dy=e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0;rememberAnd(()=>{const s=state.slots[selected];s.x=C.clamp(s.x-dx);s.y=C.clamp(s.y-dy)});});
function renderLayouts(){const count=state.slots.length,key=count+':'+state.ratio;if(layoutCount===key)return;layoutCount=key;$('layouts').replaceChildren();if(!count){filterLayouts();return;}C.layoutsFor(count).forEach(l=>{const e=document.createElement('button'),svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),label=document.createElement('span');e.className='layout';e.dataset.layout=l.id;svg.classList.add('layout-preview');const previewH=state.ratio==='4:5'?125:100;svg.setAttribute('viewBox','0 0 100 '+previewH);svg.style.aspectRatio='100 / '+previewH;svg.setAttribute('aria-hidden','true');e.dataset.category=layoutCategory(l);l.cells.forEach(([x,y,w,h],index)=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',String(x*100+2));r.setAttribute('y',String(y*previewH+2));r.setAttribute('width',String(w*100-4));r.setAttribute('height',String(h*previewH-4));r.setAttribute('fill',['#9BBBE9','#D3E0F1','#426BA6','#B4CBE8'][index%4]);svg.append(r)});if(l.id==='cut-grid'){const pts=[[[0,0],[.42,0],[.5,.5],[0,.42]],[[.42,0],[1,0],[1,.58],[.5,.5]],[[0,.42],[.5,.5],[.58,1],[0,1]],[[.5,.5],[1,.58],[1,1],[.58,1]]];svg.replaceChildren();pts.forEach((points,i)=>{const shape=document.createElementNS('http://www.w3.org/2000/svg','polygon');shape.setAttribute('points',points.map(([x,y])=>[x*100,y*previewH].join(',')).join(' '));shape.setAttribute('fill',['#9BBBE9','#D3E0F1','#426BA6','#B4CBE8'][i]);shape.setAttribute('stroke','white');shape.setAttribute('stroke-width','3');svg.append(shape)})}label.textContent=l.name;e.append(svg,label);e.onclick=()=>rememberAnd(()=>{delete state.customCells;state.layout=l.id;state.slots.forEach(s=>{delete s.frame;delete s.mask});state.slant=l.id==='cut-grid'?{x:.08,y:.06}:{x:0,y:0};state.cut={top:.5,bottom:.5,left:.5,right:.5}});$('layouts').append(e)});filterLayouts()}
function layoutCategory(l){if(l.id==='cut-grid')return'slant';if(l.cells.length>1&&(l.cells.every(c=>c[2]===1)||l.cells.every(c=>c[3]===1)))return'strips';const areas=l.cells.map(c=>c[2]*c[3]);if(Math.max(...areas)-Math.min(...areas)<.001)return'balanced';return Math.max(...areas)>2*Math.min(...areas)?'hero':'mixed'}
function filterLayouts(){const nodes=[...document.querySelectorAll('.layout')],filter=$('layout-filter').value;nodes.forEach(n=>n.hidden=filter!=='all'&&n.dataset.category!==filter);const visible=nodes.filter(n=>!n.hidden).length;$('layout-count').textContent=state.slots.length?(visible?state.slots.length+' 張相片 / '+visible+' 款排版':'呢個分類暫時冇適合排版，請揀其他分類'):'加入相片後顯示適用排版'}
$('layout-filter').onchange=filterLayouts;
document.body.dataset.mobilePanel='canvas';for(const name of ['canvas','layout','photo','brand'])$('mobile-'+name).onclick=()=>{if(gesture)return;finishZoom();document.body.dataset.mobilePanel=name;for(const other of ['canvas','layout','photo','brand'])$('mobile-'+other).setAttribute('aria-pressed',String(name===other))};
let colorStorage;try{colorStorage=window.localStorage}catch{}
palette=CollagePalette.mount({document,storage:colorStorage,getColor:()=>state.bg,applyColor:color=>rememberAnd(()=>state.bg=color),notify:say,prompt:(...args)=>window.prompt(...args)});
[['margin','margin'],['gap','gap']].forEach(([id,k])=>$(id).onchange=e=>rememberAnd(()=>state[k]=Number(e.target.value)));
$('ratio').onchange=e=>{if(!['1:1','4:5'].includes(e.target.value))return;rememberAnd(()=>{const old=C.size(state),oldA=B.measure(old,state.brand).photoArea;state.ratio=e.target.value;const next=C.size(state),newA=B.measure(next,state.brand).photoArea;B.remapFrames(state,oldA,newA)})};
$('zoom').oninput=e=>{zoomBefore??=clone(state);state.slots[selected].zoom=Number(e.target.value)/100;controls();draw()};$('zoom').onchange=finishZoom;$('zoom').onblur=finishZoom;
$('zoom-out').onclick=()=>rememberAnd(()=>state.slots[selected].zoom=C.clamp(state.slots[selected].zoom-.1,1,3));$('zoom-in').onclick=()=>rememberAnd(()=>state.slots[selected].zoom=C.clamp(state.slots[selected].zoom+.1,1,3));
$('center').onclick=()=>rememberAnd(()=>Object.assign(state.slots[selected],{x:.5,y:.5,zoom:1}));
$('undo').onclick=()=>{settleGesture();finishZoom();if(!history.length)return;future.push(clone(state));state=history.pop();refresh();say('已復原')};$('redo').onclick=()=>{settleGesture();finishZoom();if(!future.length)return;history.push(clone(state));state=future.pop();refresh();say('已重做')};$('reset').onclick=()=>rememberAnd(()=>{state=C.defaults();state.slots=[];state.demo=false;selected=0});
$('undo').textContent='↶ 復原 ⌘Z';$('redo').textContent='↷ 重做 ⇧⌘Z';
document.addEventListener('keydown',e=>{if(!(e.metaKey||e.ctrlKey)||e.altKey||e.key.toLowerCase()!=='z')return;const t=e.target;if(t.isContentEditable||t.closest?.('[contenteditable="true"],textarea,input:not([type=range]):not([type=button])'))return;e.preventDefault();(e.shiftKey?$('redo'):$('undo')).onclick()});
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
const icons=JSON.parse($('icon-data').textContent);for(const [id,name,label] of [['photo-mode','photo','相片'],['frame-mode','frame','相框'],['slant-mode','brand-sketch','斜切'],['help-toggle','help',''],['swap-select','arrows-exchange','交換'],['canvas-zoom-out','minus',''],['canvas-zoom-in','plus',''],['canvas-center','focus-centered',''],['frame-reset','rotate-2',''],['make-hero','layout-dashboard',''],['slant-straight','frame','還原直線'],['undo','arrow-back-up','復原'],['redo','arrow-forward-up','重做'],['export-top','download','下載 JPG'],['export-bottom','download','下載 JPG'],['mobile-canvas','frame','畫布'],['mobile-layout','layout-grid','排版'],['mobile-photo','photo','相片'],['mobile-brand','brand-sketch','品牌']]){const holder=document.createElement('template');holder.innerHTML=icons[name];const svg=holder.content.firstElementChild;svg.classList.add('ui-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');$(id).replaceChildren(svg,document.createTextNode(label))}
$('undo').title='復原（⌘Z / Ctrl Z）';$('redo').title='重做（⇧⌘Z / Ctrl Shift Z）';
try{images.push(...await Promise.all(photos.map(p=>load(p.src))));ready=true;fileInputs.forEach(input=>input.disabled=false);$('empty-add').disabled=false;$('show-demo').disabled=false;refresh();$('initial-preview').hidden=true;document.body.dataset.ready='true';say('加入你嘅相片開始；示範圖不會自動加入作品') }catch(err){say(err.message,true)}
})();
