/* Offline editor: no network requests, no dependencies. */
(async function () {
  'use strict';
  const C=CollageCore, $=id=>document.getElementById(id), clone=o=>JSON.parse(JSON.stringify(o));
  const canvas=$('canvas'), ctx=canvas.getContext('2d'),overlay=$('edit-overlay'),overlayCtx=overlay.getContext('2d');
  const photos=JSON.parse($('photo-data').textContent), images=[];
  const logos={};
  let state=C.defaults(), selected=0, hideSelection=false, ready=false, pointer=null, dragSource=null,mode='crop',activeVertex=0;
  let pageW=1080,pageH=1080;
  function syncSize(){const s=C.size(state);pageW=s.w;pageH=s.h;for(const c of [canvas,overlay])if(c.width!==pageW||c.height!==pageH){c.width=pageW;c.height=pageH;}$('canvas-wrap').style.aspectRatio=`${pageW}/${pageH}`;$('canvas-wrap').style.setProperty('--ratio',pageW/pageH);}
  const history=[], future=[]; let downloadUrl=null, statusTimer=null;
  function say(text,error=false) { clearTimeout(statusTimer); $('status').textContent=text; $('status').classList.toggle('error',error); }
  function remember() { history.push(clone(state)); if(history.length>60)history.shift();future.length=0; }
  function updateHistory(){ $('undo').disabled=!history.length; $('redo').disabled=!future.length; }
  function save(){updateHistory();}
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();const timer=setTimeout(()=>reject(new Error('相片載入超時（20 秒）')),20000);im.onload=()=>{clearTimeout(timer);resolve(im);};im.onerror=()=>{clearTimeout(timer);reject(new Error('相片載入失敗'));};im.src=src;});}
  function selectionBox(){
    const b=C.frameBoxes(state)[selected], el=$('selection');
    el.style.left=`${b.x/pageW*100}%`;el.style.top=`${b.y/pageH*100}%`;el.style.width=`${b.w/pageW*100}%`;el.style.height=`${b.h/pageH*100}%`;
    el.style.transform=`rotate(${b.angle}deg)`;el.style.borderRadius=b.shape==='circle'?'50%':'0';
    el.classList.toggle('on',ready&&!hideSelection&&mode==='crop');$('selection-label').textContent=`相片 ${selected+1}`;
    overlayCtx.clearRect(0,0,pageW,pageH);if(!ready||hideSelection||mode==='crop')return;
    const scale=pageW/(canvas.getBoundingClientRect().width||540),r=8*scale;
    overlayCtx.strokeStyle='#2563eb';overlayCtx.fillStyle='#FFFFFF';overlayCtx.lineWidth=2*scale;
    if(mode==='cut'&&state.layout==='cut-grid'){
      const p=C.cutHandles(state);overlayCtx.beginPath();overlayCtx.moveTo(p[0].x,p[0].y);overlayCtx.lineTo(p[1].x,p[1].y);overlayCtx.moveTo(p[2].x,p[2].y);overlayCtx.lineTo(p[3].x,p[3].y);overlayCtx.stroke();p.forEach(v=>{overlayCtx.beginPath();overlayCtx.arc(v.x,v.y,r,0,Math.PI*2);overlayCtx.fill();overlayCtx.stroke();});
    }else if(mode==='frame'){
      overlayCtx.strokeRect(b.x,b.y,b.w,b.h);overlayCtx.fillRect(b.x+b.w-r,b.y+b.h-r,r*2,r*2);overlayCtx.strokeRect(b.x+b.w-r,b.y+b.h-r,r*2,r*2);
    }else if(b.mask&&b.mask.kind==='polygon'){
      overlayCtx.beginPath();b.mask.points.forEach(([x,y],i)=>overlayCtx[i?'lineTo':'moveTo'](b.x+x*b.w,b.y+y*b.h));overlayCtx.closePath();overlayCtx.stroke();
      b.mask.points.forEach(([x,y],i)=>{overlayCtx.fillStyle=i===activeVertex?'#2563eb':'#FFFFFF';overlayCtx.beginPath();overlayCtx.arc(b.x+x*b.w,b.y+y*b.h,r,0,Math.PI*2);overlayCtx.fill();overlayCtx.stroke();});
    }
  }
  function draw(){if(ready) C.draw(ctx,images,state,logos);selectionBox();}
  function controls(){
    syncSize();if(mode==='cut'&&state.layout!=='cut-grid')mode='crop';
    const s=state.slots[selected];
    for(const key of ['margin','gap','radius']){$(key).value=state[key];$(key+'-value').value=state[key]+' px';}
    $('zoom').value=Math.round(s.zoom*100);$('zoom-value').value=Math.round(s.zoom*100)+'%';
    $('pan-x').value=Math.round(s.x*100);$('pan-x-value').value=Math.round(s.x*100)+'%';
    $('pan-y').value=Math.round(s.y*100);$('pan-y-value').value=Math.round(s.y*100)+'%';
    $('selected-title').textContent=`調整相片 ${selected+1}`;
    $('layout-name').textContent=C.layouts.find(l=>l.id===state.layout).name;
    document.querySelectorAll('.layout').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===state.layout)));
    document.querySelectorAll('.swatch').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color.toLowerCase()===state.bg.toLowerCase())));
    $('bg-color').value=state.bg;
    $('edit-mode').value=mode;
    $('ratio').value=state.ratio;$('size-label').textContent=`${state.ratio} · ${pageW} × ${pageH}`;
    $('cut-controls').hidden=state.layout!=='cut-grid';for(const key of ['top','bottom','left','right']){$('cut-'+key).value=Math.round(state.cut[key]*100);$('cut-'+key+'-value').value=Math.round(state.cut[key]*100)+'%';}
    $('frame-w').max=pageW;$('frame-h').max=pageH;$('frame-x').max=pageW-80;$('frame-y').max=pageH-80;
    const b=C.frameBoxes(state)[selected];for(const k of ['x','y','w','h'])$('frame-'+k).value=Math.round(b[k]);
    const points=s.mask&&s.mask.kind==='polygon'?s.mask.points:[];activeVertex=Math.min(activeVertex,Math.max(0,points.length-1));
    $('vertex').innerHTML=points.map((_,i)=>`<option value="${i}">頂點 ${i+1}</option>`).join('');$('vertex').value=String(activeVertex);$('vertex').disabled=!points.length;
    $('point-x').disabled=$('point-y').disabled=!points.length;
    for(const [id,k]of [['point-x',0],['point-y',1]]){$(id).value=points.length?Math.round(points[activeVertex][k]*100):50;$(id+'-value').value=$(id).value+'%';}
    $('move-prev').disabled=selected===0;$('move-next').disabled=selected===3;updateHistory();
  }
  function thumbs(){
    const container=$('photos');container.replaceChildren();
    state.slots.forEach((s,i)=>{
      const b=document.createElement('button');b.className='photo';b.draggable=true;b.dataset.slot=i;b.setAttribute('aria-pressed',String(i===selected));b.setAttribute('aria-label',`選取相片 ${i+1}：${photos[s.photo].name}`);
      const img=document.createElement('img');img.src=photos[s.photo].src;img.alt='';img.draggable=false;
      const meta=document.createElement('span');meta.className='meta';meta.textContent=`相片 ${i+1}`;const small=document.createElement('small');small.textContent=photos[s.photo].name;meta.append(small);
      const grip=document.createElement('span');grip.className='grip';grip.textContent='⠿';b.append(img,meta,grip);
      b.onclick=()=>select(i);
      b.ondragstart=e=>{dragSource=i;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(i));};
      b.ondragover=e=>{if(dragSource!==null){e.preventDefault();b.classList.add('over');}};
      b.ondragleave=()=>b.classList.remove('over');
      b.ondrop=e=>{e.preventDefault();b.classList.remove('over');if(dragSource!==null&&dragSource!==i)swap(dragSource,i);dragSource=null;};
      b.ondragend=()=>{dragSource=null;document.querySelectorAll('.over').forEach(el=>el.classList.remove('over'));};
      container.append(b);
    });
  }
  function refresh(){controls();thumbs();draw();save();}
  function select(i){selected=i;controls();document.querySelectorAll('.photo').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));draw();}
  function swap(a,b){remember();for(const key of ['photo','x','y','zoom'])[state.slots[a][key],state.slots[b][key]]=[state.slots[b][key],state.slots[a][key]];selected=b;refresh();say('已交換相片；相框形狀及位置保持不變');}
  C.layouts.forEach(l=>{
    const b=document.createElement('button');b.className='layout';b.dataset.layout=l.id;b.title=l.note;b.setAttribute('aria-pressed','false');
    const iconState=C.defaults();iconState.layout=l.id;
    const rects=C.frameBoxes(iconState).map((r,i)=>r.mask?`<polygon points="${r.mask.points.map(([x,y])=>`${(r.x+x*r.w)/10.8},${(r.y+y*r.h)/10.8}`).join(' ')}" fill="currentColor" stroke="white" stroke-width="2"/>`:`<rect x="${r.x/10.8}" y="${r.y/10.8}" width="${r.w/10.8}" height="${r.h/10.8}" rx="2" fill="${l.overlap&&i>0?'white':'currentColor'}" stroke="${l.overlap&&i>0?'currentColor':'white'}" stroke-width="2"/>`).join('');
    b.innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true">${rects}</svg><span>${l.name}</span>`;
    b.onclick=()=>{remember();state.layout=l.id;state.slots.forEach(s=>{delete s.frame;delete s.mask;delete s.maskPreset;});mode=l.id==='cut-grid'?'cut':'crop';hideSelection=false;refresh();say('已套用版式；相框仍可移位及改大小，做錯可復原');};$('layouts').append(b);
  });
  $('ratio').addEventListener('change',e=>{if(!['1:1','3:4'].includes(e.target.value))return;remember();const old=C.size(state);state.ratio=e.target.value;const next=C.size(state);state.slots.forEach(s=>{if(s.frame){s.frame.x*=next.w/old.w;s.frame.w*=next.w/old.w;s.frame.y*=next.h/old.h;s.frame.h*=next.h/old.h;}});refresh();say('已切換尺寸；原相按比例裁切，唔會拉闊變形');});
  function relinkCuts(){state.slots.forEach(s=>{delete s.frame;delete s.mask;delete s.maskPreset;});}
  for(const key of ['top','bottom','left','right']){let started=false;$('cut-'+key).addEventListener('input',e=>{if(!started){remember();started=true;relinkCuts();}state.cut[key]=C.clamp(Number(e.target.value)/100,.15,.85);mode='cut';hideSelection=false;controls();draw();save();});$('cut-'+key).addEventListener('change',()=>{started=false;});$('cut-'+key).addEventListener('blur',()=>{started=false;});}
  $('cut-straight').onclick=()=>{remember();relinkCuts();state.cut={top:.5,bottom:.5,left:.5,right:.5};mode='cut';refresh();};
  [['#0B63F6','IG 品牌藍'],['#FFFFFF','純白'],['#F5F8FF','柔霧淺藍'],['#00345C','深海藍']].forEach(([color,name])=>{
    const b=document.createElement('button');b.className='swatch';b.dataset.color=color;b.style.setProperty('--swatch',color);b.textContent=name;b.title=`${name} ${color}`;b.setAttribute('aria-label',name);b.onclick=()=>{if(state.bg.toLowerCase()===color.toLowerCase())return;remember();state.bg=color;refresh();say(`已套用${name}背景；可以復原`);};$('swatches').append(b);
  });
  const colorWrap=document.createElement('label');colorWrap.className='color-wrap';colorWrap.title='自選底色';colorWrap.innerHTML='<span>自選顏色</span><input id="bg-color" type="color" aria-label="自選底色">';$('swatches').append(colorWrap);
  $('bg-color').addEventListener('change',e=>{if(state.bg.toLowerCase()===e.target.value.toLowerCase())return;remember();state.bg=e.target.value;refresh();say('已套用自選背景色；可以復原');});
  function setMask(name){remember();const s=state.slots[selected];s.mask=C.presetMask(name);s.maskPreset=name;activeVertex=0;mode=name==='circle'?'frame':'shape';hideSelection=false;refresh();say(name==='circle'?'拖相框移位，拉右下角調整圓形／橢圓大小':'拖藍色頂點改形狀；換「移相框」可移動整個形狀');}
  for(const name of ['rect','triangle','diagonal','diamond','hexagon','circle'])$('shape-'+name).onclick=()=>setMask(name);
  $('edit-mode').addEventListener('change',e=>{mode=e.target.value;hideSelection=false;if(mode==='cut'&&state.layout!=='cut-grid'){remember();state.layout='cut-grid';relinkCuts();}if(mode==='shape'&&!state.slots[selected].mask){const b=C.frameBoxes(state)[selected];if(b.mask){remember();state.slots[selected].mask=clone(b.mask);refresh();}else setMask(b.shape==='diagonal'?'diagonal':'rect');}else refresh();});
  $('shape-reset').onclick=()=>setMask(state.slots[selected].maskPreset||'rect');
  $('frame-reset').onclick=()=>{remember();delete state.slots[selected].frame;refresh();say('相框已返回版式位置；形狀保持不變');};
  function setPoint(index,x,y){const mask=state.slots[selected].mask;if(!mask||mask.kind!=='polygon')return false;const points=clone(mask.points);points[index]=[C.clamp(x),C.clamp(y)];if(!C.validPolygon(points))return false;mask.points=points;return true;}
  $('vertex').addEventListener('change',e=>{activeVertex=Number(e.target.value);controls();draw();});
  for(const [id,k]of [['point-x',0],['point-y',1]]){let started=false;$(id).addEventListener('input',e=>{const p=state.slots[selected].mask?.points?.[activeVertex];if(!p)return;if(!started){remember();started=true;}const next=p.slice();next[k]=Number(e.target.value)/100;if(!setPoint(activeVertex,...next))say('頂點不能交叉或令形狀摺埋');controls();draw();save();});$(id).addEventListener('change',()=>{started=false;});$(id).addEventListener('blur',()=>{started=false;});}
  for(const key of ['x','y','w','h'])$('frame-'+key).addEventListener('change',e=>{const n=Number(e.target.value);if(!Number.isFinite(n)){controls();return;}remember();const b=C.frameBoxes(state)[selected],f={x:b.x,y:b.y,w:b.w,h:b.h};f[key]=n;f.w=C.clamp(f.w,80,pageW);f.h=C.clamp(f.h,80,pageH);f.x=C.clamp(f.x,0,pageW-f.w);f.y=C.clamp(f.y,0,pageH-f.h);state.slots[selected].frame=f;refresh();});
  const ranges=[['margin','margin'],['gap','gap'],['radius','radius'],['zoom','zoom'],['pan-x','x'],['pan-y','y']];
  for(const [id,key] of ranges){
    const el=$(id);let started=false;
    el.addEventListener('input',()=>{if(!started){remember();started=true;}if(['x','y','zoom'].includes(key))state.slots[selected][key]=Number(el.value)/100;else state[key]=Number(el.value);controls();draw();});
    el.addEventListener('change',()=>{started=false;save();});el.addEventListener('blur',()=>{started=false;save();});
  }
  const coords=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*pageW/r.width,y:(e.clientY-r.top)*pageH/r.height};};
  canvas.addEventListener('pointerdown',e=>{
    if(!ready || e.button!==0 || pointer)return;
    const p=coords(e),rects=C.frameBoxes(state),current=rects[selected],threshold=18*pageW/(canvas.getBoundingClientRect().width||540);
    if(mode==='cut'&&state.layout==='cut-grid'){const h=C.cutHandles(state).find(h=>Math.hypot(p.x-h.x,p.y-h.y)<threshold);if(!h)return;pointer={id:e.pointerId,p,box:{angle:0,x:0,y:0,w:pageW,h:pageH},action:'cut',key:h.key,moved:false};canvas.setPointerCapture(e.pointerId);return;}
    let action='crop',vertex=-1,i=-1;
    if(mode==='shape'&&current.mask?.kind==='polygon'){vertex=current.mask.points.findIndex(([x,y])=>Math.hypot(p.x-current.x-x*current.w,p.y-current.y-y*current.h)<threshold);if(vertex>=0){i=selected;action='vertex';activeVertex=vertex;}}
    if(i<0&&mode==='frame'&&Math.hypot(p.x-current.x-current.w,p.y-current.y-current.h)<threshold){i=selected;action='resize';}
    if(i<0){for(let k=rects.length-1;k>=0;k--)if(C.hit(rects[k],p)){i=k;break;}action=mode==='frame'?'move':'crop';}
    if(i<0)return;select(i);canvas.focus({preventScroll:true});
    if(mode==='shape'&&action!=='vertex')return;
    const g=C.geometry(images[state.slots[i].photo],rects[i],state.slots[i]);
    pointer={id:e.pointerId,p:C.localPoint(rects[i],p),box:rects[i],x:state.slots[i].x,y:state.slots[i].y,g,moved:false,action,vertex};canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove',e=>{
    if(!pointer||pointer.id!==e.pointerId)return;const p=C.localPoint(pointer.box,coords(e)),dx=p.x-pointer.p.x,dy=p.y-pointer.p.y;
    if(!pointer.moved&&Math.abs(dx)+Math.abs(dy)<2)return;
    if(!pointer.moved){remember();pointer.moved=true;if(pointer.action==='cut')relinkCuts();}
    if(pointer.action==='cut'){const horizontal=['top','bottom'].includes(pointer.key);state.cut[pointer.key]=C.clamp(((horizontal?p.x:p.y)-state.margin)/((horizontal?pageW:pageH)-2*state.margin),.15,.85);controls();draw();return;}
    const s=state.slots[selected],b=pointer.box;
    if(pointer.action==='vertex'){if(!setPoint(pointer.vertex,(p.x-b.x)/b.w,(p.y-b.y)/b.h))say('頂點不能交叉或令形狀摺埋');}
    else if(pointer.action==='move')s.frame={x:C.clamp(b.x+dx,0,pageW-b.w),y:C.clamp(b.y+dy,0,pageH-b.h),w:b.w,h:b.h};
    else if(pointer.action==='resize')s.frame={x:b.x,y:b.y,w:C.clamp(b.w+dx,80,pageW-b.x),h:C.clamp(b.h+dy,80,pageH-b.y)};
    else {if(pointer.g.overflowX>.01)s.x=C.clamp(pointer.x-dx/pointer.g.overflowX);if(pointer.g.overflowY>.01)s.y=C.clamp(pointer.y-dy/pointer.g.overflowY);}controls();draw();
  });
  function endPointer(e){if(pointer&&pointer.id===e.pointerId){pointer=null;canvas.classList.remove('dragging');save();}}
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);
  canvas.addEventListener('keydown',e=>{
    if(!ready)return;const s=state.slots[selected],amount=e.shiftKey?.05:.01;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();remember();const dx=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,dy=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
      if(mode==='frame'){const b=C.frameBoxes(state)[selected],step=e.shiftKey?10:1;s.frame={x:C.clamp(b.x+dx*step,0,pageW-b.w),y:C.clamp(b.y+dy*step,0,pageH-b.h),w:b.w,h:b.h};}
      else if(mode==='shape'&&s.mask?.kind==='polygon'){const p=s.mask.points[activeVertex];setPoint(activeVertex,p[0]+dx*amount,p[1]+dy*amount);}
      else {s.x=C.clamp(s.x-dx*amount);s.y=C.clamp(s.y-dy*amount);}refresh();}
  });
  $('move-prev').onclick=()=>{if(selected>0)swap(selected,selected-1);};$('move-next').onclick=()=>{if(selected<3)swap(selected,selected+1);};
  $('center').onclick=()=>{remember();Object.assign(state.slots[selected],{x:.5,y:.5,zoom:1});refresh();};
  $('preview').onclick=()=>{hideSelection=!hideSelection;$('preview').setAttribute('aria-pressed',String(hideSelection));$('preview').textContent=hideSelection?'顯示選框，繼續調整':'隱藏選框，睇完整效果';draw();};
  $('undo').onclick=()=>{if(!history.length)return;future.push(clone(state));state=history.pop();refresh();say('已復原');};
  $('redo').onclick=()=>{if(!future.length)return;history.push(clone(state));state=future.pop();refresh();say('已重做');};
  $('reset').onclick=()=>{remember();state=C.defaults();selected=0;mode='crop';refresh();say('已還原 DotAI 品牌藍預設；可按復原返回');};
  $('files').addEventListener('change',async e=>{
    const files=[...e.target.files];if(!files.length)return;
    const chosen=files.slice(0,4),start=selected;const loaded=[];
    try{
      for(const file of chosen){
        if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('請使用 JPG、PNG 或 WebP 相片。');
        if(file.size>40*1024*1024)throw new Error('每張相片請小於 40 MB。');
        const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('讀取檔案失敗'));r.readAsDataURL(file);});
        loaded.push({src,image:await loadImage(src),name:file.name});
      }
      remember();loaded.forEach((p,j)=>{const id=photos.length;photos.push({src:p.src,name:p.name});images.push(p.image);Object.assign(state.slots[(start+j)%4],{photo:id,x:.5,y:.5,zoom:1});});refresh();say(`已換入 ${loaded.length} 張相片${files.length>4?'（只取首 4 張）':''}`);
    }catch(err){say(err.message,true);}finally{e.target.value='';}
  });
  async function exportJpg(){
    if(!ready)return; $('export-top').disabled=true;$('export-bottom').disabled=true;say('正在準備 JPG…');
    try{
      // Render independently; selection is a DOM overlay and never enters the export.
      const out=document.createElement('canvas');out.width=pageW;out.height=pageH;C.draw(out.getContext('2d'),images,state,logos);
      const blob=await new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('JPG 輸出失敗')),'image/jpeg',.96));
      if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=URL.createObjectURL(blob);
      const a=$('download-fallback');a.href=downloadUrl;a.download=`dotai-collage-${state.layout}-${pageW}x${pageH}.jpg`;a.hidden=false;a.textContent='再下載 JPG（或右鍵另存）';a.click();
      say(`JPG 已準備好 · ${pageW} × ${pageH} · ${(blob.size/1024/1024).toFixed(1)} MB`);
    }catch(err){say('未能下載：'+err.message,true);}finally{$('export-top').disabled=false;$('export-bottom').disabled=false;}
  }
  $('export-top').onclick=exportJpg;$('export-bottom').onclick=exportJpg;
  window.addEventListener('beforeunload',e=>{if(history.length){e.preventDefault();e.returnValue='';}});
  say('啟動階段 2/3：正在解碼四張示範圖…');
  try{images.push(...await Promise.all(photos.map(p=>loadImage(p.src))));say('啟動階段 3/3：正在繪製拼圖…');ready=true;refresh();$('initial-preview').hidden=true;$('export-top').disabled=false;$('export-bottom').disabled=false;say('四張圖片已就位 · DotAI 配色 · 可自訂形狀');}
  catch(err){say('啟動失敗：'+err.message+'。目前保留靜態預覽。',true);}
})();
