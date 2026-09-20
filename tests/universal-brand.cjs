const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
require('../src/collage-brand.js');require('../src/collage-core.js');
const B=globalThis.CollageBrand,C=globalThis.CollageCore;
const asset={id:0,width:400,height:200,bounds:{x:100,y:50,w:200,h:100}};
const base={placement:'corner',library:[asset],activeId:0,size:.2,padding:0,anchor:'tl',surface:'none',trim:false};
// A logo must reach all four canvas edges and retain its own aspect ratio.
for(const [anchor,x,y] of [['tl',0,0],['tr',864,0],['bl',0,1242],['br',864,1242]]){
 const m=B.measure({w:1080,h:1350},{...base,anchor});
 assert.equal(m.logo.x,x);assert.equal(m.logo.y,y);assert.equal(m.logo.w,216);assert.equal(m.logo.h,108);
}
const trimmed=B.measure({w:1080,h:1350},{...base,trim:true});assert.deepEqual(trimmed.logo.source,{x:100,y:50,w:200,h:100});
const logo=createCanvas(400,200),lc=logo.getContext('2d');lc.fillStyle='#FF0000';lc.fillRect(100,50,200,100);
const state=C.defaults();state.slots=[];state.bg='#123456';state.brand={...base,trim:true};
const canvas=createCanvas(1080,1080),ctx=canvas.getContext('2d'),rgb=(x,y)=>[...ctx.getImageData(x,y,1,1).data].slice(0,3);
C.draw(ctx,[logo],state);const edge=rgb(0,0);assert(edge[0]>200&&edge[1]<20&&edge[2]<20,'Trimmed painted pixels meet the actual canvas corner (allow filtered edge)');assert.deepEqual(rgb(2,2),[255,0,0]);
state.brand={...base,placement:'bottom',surface:'band',padding:12};C.draw(ctx,[logo],state);assert.deepEqual(rgb(1,1079),[18,52,86],'Band follows artwork background');
state.brand.backdropColor='#ABCDEF';state.brand.backdropMode='custom';C.draw(ctx,[logo],state);assert.deepEqual(rgb(1,1079),[171,205,239],'Custom band color is rendered');
state.brand={...base,anchor:'br',surface:'badge',backdropMode:'custom',backdropColor:'#FFFFFF'};C.draw(ctx,[logo],state);assert.deepEqual(rgb(1079,1079),[255,255,255],'Badge itself reaches corner');
const badge=B.measure(C.size(state),state.brand);assert.equal(badge.photoArea.h,1080);assert.equal(badge.band,null);
console.log('PASS: universal logo aspect ratios, four flush corners, non-destructive trim and backing pixels');
