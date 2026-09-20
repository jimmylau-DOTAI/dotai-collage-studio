/* User-owned logo library. Only the explicit save button writes logo data to storage. */
(function(root){
 'use strict';
 const KEY='dotai-collage-brand-kit-v1',MAX=8,HEX=/^#[0-9a-f]{6}$/i;
 const tones={any:'任何底色',light:'適合淺底',dark:'適合深底'};
 const positions=[['tl','左上'],['tr','右上'],['bl','左下'],['br','右下'],['top','頂部色帶'],['bottom','底部色帶']];
 function mount({document:doc,images,getState,change,readFile,load,storage,notify}){
  const $=id=>doc.getElementById(id),host=doc.createElement('div');host.className='brand-studio';
  // Retain legacy controls for old-state compatibility, not as a second user interface.
  doc.querySelector('#brand-section > details').hidden=true;
  host.innerHTML=`<h2>我的標誌</h2><p class="small-note">加入深色、淺色或長形版本，點選其中一款放入作品。所有標誌保留原比例及原色。</p>
   <label class="replace-label">＋ 加入標誌<input id="brand-files" class="file-input" type="file" multiple accept="image/png,image/jpeg,image/webp"></label>
   <p id="logo-count" class="small-note"></p><div id="brand-library" class="logo-library" aria-label="標誌資料庫"></div>
   <div id="brand-options" hidden>
    <div class="brand-active-row"><span id="logo-active-name"></span></div>
    <div class="brand-quick-actions"><button id="logo-hide" class="secondary">暫不顯示</button><button id="logo-remove" class="secondary">刪除標誌</button></div>
    <label class="range-label" for="logo-size">標誌大小 <output id="logo-size-value"></output></label><input id="logo-size" type="range" min="4" max="50" value="16">
    <p class="small-note">亦可點畫布上嘅標誌，再拖角點調大細；刪錯可按復原。</p>
    <h3>放喺邊？</h3><div id="brand-positions" class="brand-positions" role="group" aria-label="標誌位置"></div>
    <label class="brand-field">底板<select id="logo-surface"><option value="none">直接放圖上</option><option value="badge">小底牌</option><option value="band">全闊色帶</option></select></label>
    <div id="logo-backing-controls"><label class="brand-field">底板顏色<select id="logo-color-mode"><option value="match">跟作品底色</option><option value="custom">獨立選色</option></select></label><label class="color-wrap">自選底板色<input id="logo-color" type="color" value="#FFFFFF"></label></div>
    <details class="brand-adjustments"><summary>邊距及版本</summary>
     <label class="range-label" for="logo-padding">邊距 <output id="logo-padding-value"></output></label><input id="logo-padding" type="range" min="0" max="64" value="24">
     <button id="logo-flush" class="secondary full">貼齊畫布邊</button><p id="logo-edge-note" class="small-note"></p>
     <label class="check-row"><input id="logo-trim" type="checkbox">忽略透明留白</label><p class="small-note">只略過透明像素；白底圖片唔會自動去底，原檔不變。</p>
     <label class="brand-field">版本用途<select id="logo-tone"><option value="any">任何底色</option><option value="light">適合淺底</option><option value="dark">適合深底</option></select></label>
     <div class="brand-secondary"><button id="logo-rename" class="secondary">改名</button></div>
    </details>
   </div>
   <details class="brand-kit"><summary>儲存我的品牌</summary><p class="small-note">只存呢個瀏覽器，唔係雲端同步。包括標誌、擺位及底色；已命名色卡會另外自動保存。不會儲存活動相片。</p>
    <label class="brand-field">品牌名稱<input id="kit-name" type="text" maxlength="40" value="我的品牌"></label>
    <button id="kit-save" class="secondary full">儲存我的品牌到本機</button><button id="kit-load" class="secondary full">載入已儲存品牌</button>
    <button id="kit-forget" class="text-action">刪除本機品牌紀錄</button><p id="kit-status" class="small-note" role="status"></p>
   </details>`;
  $('brand-section').append(host);
  let fingerprint='',token=0,busy=false;
  const brand=()=>getState().brand,library=()=>brand().library||[],active=()=>library().find(a=>a.id===brand().activeId);
  const tell=(text,bad=false)=>{notify(text,bad);$('kit-status').textContent=text};
  function mutate(fn){change(b=>{b.library??=[];fn(b)})}
  function choosePosition(p){mutate(b=>{b.placement=['top','bottom'].includes(p)?p:'corner';if(b.placement==='corner'){b.anchor=p;if(b.surface==='band')b.surface='none'}else b.surface='band'})}
  for(const [p,label] of positions){const b=doc.createElement('button'),preview=doc.createElement('span'),text=doc.createElement('span');b.type='button';b.className='brand-position';b.dataset.logoPosition=p;preview.className='position-mini '+p;preview.setAttribute('aria-hidden','true');text.textContent=label;b.append(preview,text);b.onclick=()=>choosePosition(p);$('brand-positions').append(b)}
  function sync(){
   const b=brand(),list=library(),a=active();
   const next=list.map(a=>[a.id,a.name,a.tone].join(':')).join('|');
   if(next!==fingerprint){fingerprint=next;$('brand-library').replaceChildren();for(const item of list){const button=doc.createElement('button'),img=doc.createElement('img'),name=doc.createElement('span'),tone=doc.createElement('small');button.className='logo-asset';button.dataset.assetId=item.id;img.src=item.src;img.alt='';name.textContent=item.name;tone.textContent=tones[item.tone]||tones.any;button.append(img,name,tone);button.onclick=()=>mutate(b=>{b.activeId=item.id;if(b.placement==='none')b.placement='corner'});$('brand-library').append(button)}}
   $('logo-count').textContent=list.length?`${list.length} / ${MAX} 個標誌 · 每張作品選用一款`:'未加入標誌；你的品牌由你設定。';
   $('brand-files').disabled=busy||list.length>=MAX;$('brand-options').hidden=!a;
   for(const button of $('brand-library').children)button.setAttribute('aria-pressed',String(Number(button.dataset.assetId)===b.activeId));
   if(a){
    $('logo-active-name').textContent=a.name;$('logo-hide').textContent=b.placement==='none'?'顯示標誌':'暫不顯示';
    const band=['top','bottom'].includes(b.placement),surface=band?'band':b.surface==='badge'?'badge':'none';
    for(const button of $('brand-positions').children)button.setAttribute('aria-pressed',String(button.dataset.logoPosition===(band?b.placement:b.placement==='corner'?(b.anchor||'tl'):'')));
    $('logo-surface').value=surface;$('logo-surface').disabled=b.placement==='none';
    $('logo-backing-controls').hidden=surface==='none';$('logo-color-mode').value=b.backdropMode==='custom'?'custom':'match';
    $('logo-color').value=b.backdropMode==='custom'&&HEX.test(b.backdropColor)?b.backdropColor:getState().bg;$('logo-color').disabled=b.backdropMode!=='custom';
    $('logo-size').value=Math.round((b.size||.16)*100);$('logo-size-value').textContent=$('logo-size').value+'%';$('logo-padding').value=b.padding??24;$('logo-padding-value').textContent=$('logo-padding').value+' px';
    $('logo-edge-note').textContent=band?'色帶已延伸至左右邊界；邊距調整標誌上下留白。':surface==='badge'?'貼邊以底牌外邊計；標誌保留底牌內側留白。':'邊距為 0 時，標誌貼齊所選角落。';
    $('logo-trim').checked=!!b.trim;$('logo-tone').value=a.tone||'any';
   }
   try{$('kit-load').disabled=!storage?.getItem(KEY);$('kit-forget').disabled=$('kit-load').disabled}catch{$('kit-load').disabled=true;$('kit-forget').disabled=true}
  }
  function bounds(image){const c=doc.createElement('canvas');c.width=image.width;c.height=image.height;const x=c.getContext('2d');x.drawImage(image,0,0);const pixels=x.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=-1,bottom=-1;for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++)if(pixels[(y*c.width+xx)*4+3]>0){left=Math.min(left,xx);top=Math.min(top,y);right=Math.max(right,xx);bottom=Math.max(bottom,y)}if(right<0)throw Error('標誌完全透明，請揀另一個檔案');return{x:left,y:top,w:right-left+1,h:bottom-top+1}}
  async function prepared(asset){
   // Bound storage and decoded memory without stretching; original files stay untouched.
   const scale=Math.min(1,1024/Math.max(asset.width,asset.height)),c=doc.createElement('canvas');c.width=Math.max(1,Math.round(asset.width*scale));c.height=Math.max(1,Math.round(asset.height*scale));c.getContext('2d').drawImage(asset.image,0,0,c.width,c.height);
   const src=c.toDataURL('image/png'),image=await load(src);return{src,image,width:image.width,height:image.height,bounds:bounds(image),name:asset.name.slice(0,80),tone:'any'};
  }
  $('brand-files').onchange=async e=>{
   const files=[...e.target.files];e.target.value='';if(!files.length)return;
   if(files.length+library().length>MAX){tell('最多 8 個標誌；未改動現有標誌',true);return}
   if(files.reduce((n,f)=>n+f.size,0)>40*1024*1024){tell('每批標誌請保持 40 MB 以內',true);return}
   const current=++token,before=getState().brand;busy=true;sync();tell('正在讀取標誌…');
   try{const assets=[];for(const file of files){assets.push(await prepared(await readFile(file,10*1024*1024,4096)));if(current!==token||before!==brand())return}
    mutate(b=>{for(const {image,...a} of assets){const id=images.length;images.push(image);b.library.push({...a,id})}if(b.activeId==null){b.activeId=b.library[0].id;b.placement='corner';b.anchor='tl';b.size=.16;b.surface='none';b.backdropMode='match';b.trim=false}});
    tell('已加入標誌；點縮圖選用，原比例同顏色保持不變。');
   }catch(err){if(current===token)tell(err.message+'；現有標誌未改動',true)}finally{if(current===token){busy=false;sync()}}
  };
  $('logo-hide').onclick=()=>mutate(b=>{if(b.placement==='none')b.placement=['corner','top','bottom'].includes(b.lastPlacement)?b.lastPlacement:'corner';else{b.lastPlacement=b.placement;b.placement='none'}});
  $('logo-surface').onchange=e=>mutate(b=>{b.surface=e.target.value;if(b.surface==='band'){if(!['top','bottom'].includes(b.placement))b.placement='bottom'}else if(['top','bottom'].includes(b.placement)){b.anchor=b.placement==='top'?'tl':'bl';b.placement='corner'}});
  $('logo-color-mode').onchange=e=>mutate(b=>{b.backdropMode=e.target.value;b.backdropColor??=getState().bg});
  $('logo-color').onchange=e=>{if(HEX.test(e.target.value))mutate(b=>{b.backdropColor=e.target.value;b.backdropMode='custom'})};
  $('logo-size').onchange=e=>mutate(b=>{b.size=Number(e.target.value)/100});$('logo-padding').onchange=e=>mutate(b=>{b.padding=Number(e.target.value)});
  $('logo-flush').onclick=()=>mutate(b=>{b.padding=0});$('logo-trim').onchange=e=>mutate(b=>{b.trim=e.target.checked});
  $('logo-tone').onchange=e=>mutate(b=>{b.library.find(a=>a.id===b.activeId).tone=e.target.value});
  $('logo-rename').onclick=()=>{const name=doc.defaultView.prompt('標誌名稱',active().name);if(name?.trim())mutate(b=>{b.library.find(a=>a.id===b.activeId).name=name.trim().slice(0,80)})};
  $('logo-remove').onclick=()=>{token++;busy=false;mutate(b=>{b.library=b.library.filter(a=>a.id!==b.activeId);b.activeId=b.library[0]?.id??null;if(b.activeId==null)b.placement='none'});tell('已移除標誌；可按復原還原，已儲存品牌紀錄未改動。')};
  $('kit-save').onclick=()=>{
   try{if(!storage)throw Error('此環境不支援儲存');if(!library().length)throw Error('請先加入標誌');
    const b=brand(),settings={};for(const key of ['placement','lastPlacement','anchor','surface','size','padding','trim','backdropMode','backdropColor'])if(b[key]!==undefined)settings[key]=b[key];
    const kit={version:1,name:$('kit-name').value.trim().slice(0,40)||'我的品牌',bg:getState().bg,selected:library().findIndex(a=>a.id===b.activeId),settings,logos:library().map(({src,name,tone})=>({src,name,tone}))};
    const encoded=JSON.stringify(kit);if(encoded.length>2000000)throw Error('品牌檔案太大，請減少標誌數量或使用較小圖片');
    storage.setItem(KEY,encoded);tell('已儲存「'+kit.name+'」到本機；下次開啟會載入，活動相片不會保存。');sync();
   }catch(err){tell('未能儲存品牌：'+err.message+'。原有紀錄不變。',true)}
  };
  async function restore(initial=false){
   const current=++token,before=brand();busy=true;sync();
   try{
    const raw=storage?.getItem(KEY);if(!raw)return;if(raw.length>2000000)throw Error('品牌紀錄過大');const kit=JSON.parse(raw);
    if(kit.version!==1||!Array.isArray(kit.logos)||!kit.logos.length||kit.logos.length>MAX||!HEX.test(kit.bg))throw Error('品牌紀錄格式不正確');
    const assets=[];for(const a of kit.logos){if(typeof a.src!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(a.src))throw Error('標誌資料格式不正確');const image=await load(a.src);if(image.width>1024||image.height>1024)throw Error('已儲存標誌尺寸過大');assets.push({src:a.src,image,width:image.width,height:image.height,bounds:bounds(image),name:String(a.name||'標誌').slice(0,80),tone:tones[a.tone]?a.tone:'any'});if(current!==token||before!==brand())return}
    const s=kit.settings||{},settings={placement:['none','corner','top','bottom'].includes(s.placement)?s.placement:'corner',anchor:['tl','tr','bl','br'].includes(s.anchor)?s.anchor:'tl',surface:['none','badge','band'].includes(s.surface)?s.surface:'none',size:Math.max(.04,Math.min(.5,Number(s.size)||.16)),padding:Math.max(0,Math.min(64,Number(s.padding)||0)),trim:s.trim===true,backdropMode:s.backdropMode==='custom'?'custom':'match',backdropColor:HEX.test(s.backdropColor)?s.backdropColor:'#FFFFFF'};
    settings.lastPlacement=['corner','top','bottom'].includes(s.lastPlacement)?s.lastPlacement:'corner';
    change(b=>{b.library=assets.map(({image,...a})=>{const id=images.length;images.push(image);return{...a,id}});Object.assign(b,settings);b.activeId=b.library[Number.isInteger(kit.selected)&&kit.selected>=0&&kit.selected<b.library.length?kit.selected:0].id},kit.bg,initial);
    $('kit-name').value=String(kit.name||'我的品牌').slice(0,40);tell('已載入本機品牌；活動相片及構圖未改動。');
   }catch(err){tell('未能載入品牌：'+err.message+'。目前作品不變。',true)}finally{if(current===token){busy=false;sync()}}
  }
  $('kit-load').onclick=()=>restore();$('kit-forget').onclick=()=>{if(!doc.defaultView.confirm('刪除本機已儲存品牌？目前作品及已儲存色卡會保留。'))return;try{storage.removeItem(KEY);tell('已刪除本機品牌紀錄；目前標誌仍可重新儲存。');sync()}catch{tell('未能刪除本機品牌紀錄',true)}};
  sync();return{sync,restore};
 }
 root.CollageBrandStudio={mount};
})(typeof globalThis!=='undefined'?globalThis:this);
