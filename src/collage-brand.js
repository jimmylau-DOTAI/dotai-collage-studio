(function(root){
  'use strict';
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const full=size=>({x:0,y:0,w:size.w,h:size.h});
  function measure(size,brand){
    const area=full(size);
    if(!brand||brand.placement==='none')return {photoArea:area,band:null,logo:null};
    const corner=brand.placement==='corner';
    const asset=corner?brand.square:brand.wordmark;
    if(!asset||!asset.width||!asset.height)throw new Error('請先上載有效標誌');
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
    for(const slot of state.slots)if(slot.frame){const f=slot.frame;slot.frame={x:after.x+(f.x-before.x)*after.w/before.w,y:after.y+(f.y-before.y)*after.h/before.h,w:f.w*after.w/before.w,h:f.h*after.h/before.h};}
  }
  root.CollageBrand={measure,remapFrames};
})(typeof globalThis!=='undefined'?globalThis:this);
