(function(root){
  'use strict';
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const full=size=>({x:0,y:0,w:size.w,h:size.h});
  const sizeForState=state=>({w:1080,h:state&&state.ratio==='4:5'?1350:1080});
  const placements=new Set(['none','corner','top','bottom']);
  const validAsset=asset=>asset&&Number.isFinite(Number(asset.width))&&Number(asset.width)>0&&Number.isFinite(Number(asset.height))&&Number(asset.height)>0;
  const cloneValue=value=>Array.isArray(value)?value.map(cloneValue):(value&&typeof value==='object'?Object.keys(value).reduce((out,key)=>(out[key]=cloneValue(value[key]),out),{}):value);
  function sizeRange(placement){
    return placement==='corner'?{min:6,max:24}:{min:12,max:40};
  }
  function measure(size,brand){
    if(!size||!Number.isFinite(Number(size.w))||!Number.isFinite(Number(size.h))||Number(size.w)<=0||Number(size.h)<=0)throw new Error('畫布尺寸無效');
    const area=full(size);
    if(!brand||brand.placement==='none')return {photoArea:area,band:null,logo:null};
    if(!placements.has(brand.placement))throw new Error('標誌位置無效');
    const corner=brand.placement==='corner';
    const asset=corner?brand.square:brand.wordmark;
    if(!validAsset(asset))throw new Error('請先上載有效標誌');
    const padding=clamp(Number(brand.padding)||24,12,64);
    const share=corner?clamp(Number(brand.squareSize)||.12,.06,.24):clamp(Number(brand.wordmarkSize)||.24,.12,.4);
    const maxHeight=corner?size.h-padding*2:size.h*.2-padding*2;
    const scale=Math.max(0,Math.min(size.w*share/asset.width,(size.w-padding*2)/asset.width,maxHeight/asset.height));
    const w=asset.width*scale,h=asset.height*scale;
    if(corner)return {photoArea:area,band:null,logo:{x:padding,y:padding,w,h,assetId:asset.id}};
    const bandHeight=h+padding*2,top=brand.placement==='top';
    return {photoArea:{x:0,y:top?bandHeight:0,w:size.w,h:size.h-bandHeight},band:{x:0,y:top?0:size.h-bandHeight,w:size.w,h:bandHeight},logo:{x:(size.w-w)/2,y:top?padding:size.h-bandHeight+padding,w,h,assetId:asset.id}};
  }
  function remapFrames(state,before,after){
    if(!state||!Array.isArray(state.slots)||!before||!after||before.w<=0||before.h<=0||after.w<=0||after.h<=0)return state;
    const sx=after.w/before.w,sy=after.h/before.h;
    for(const slot of state.slots)if(slot.frame){
      const f=slot.frame;
      if(![f.x,f.y,f.w,f.h].every(Number.isFinite)||f.w<0||f.h<0)throw new Error('手動相框幾何無效');
      const w=Math.min(f.w*sx,after.w),h=Math.min(f.h*sy,after.h);
      slot.frame={x:clamp(after.x+(f.x-before.x)*sx,after.x,after.x+after.w-w),y:clamp(after.y+(f.y-before.y)*sy,after.y,after.y+after.h-h),w,h};
    }
    return state;
  }
  function update(state,mutate){
    if(!state||!state.brand||typeof mutate!=='function')throw new Error('品牌更新需要有效狀態及 mutate 函式');
    const brandBefore=cloneValue(state.brand);
    const framesBefore=Array.isArray(state.slots)?state.slots.map(slot=>slot&&slot.frame?{...slot.frame}:undefined):null;
    const before=measure(sizeForState(state),state.brand).photoArea;
    try{
      const draft=cloneValue(state.brand);
      mutate(draft);
      const after=measure(sizeForState(state),draft).photoArea;
      remapFrames(state,before,after);
      state.brand=draft;
      return state;
    }catch(error){
      state.brand=brandBefore;
      if(framesBefore&&Array.isArray(state.slots))state.slots.forEach((slot,i)=>{if(slot){if(framesBefore[i])slot.frame={...framesBefore[i]};else delete slot.frame;}});
      throw error;
    }
  }
  root.CollageBrand={measure,remapFrames,sizeRange,update};
})(typeof globalThis!=='undefined'?globalThis:this);
