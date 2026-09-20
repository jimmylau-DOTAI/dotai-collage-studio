// Unit check: social canvas geometry and exported pixels, without a browser.
const assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
require('../src/collage-brand.js');
require('../src/collage-core.js');
const C=globalThis.CollageCore,B=globalThis.CollageBrand;

const state=C.defaults();
const square={id:4,width:200,height:200};
const wordmark={id:5,width:600,height:100};
state.brand={...state.brand,square,wordmark,placement:'corner'};
let brand=B.measure(C.size(state),state.brand);
assert.deepEqual(brand.photoArea,{x:0,y:0,w:1080,h:1080});
assert.equal(Math.round(brand.logo.w),130);
assert.equal(Math.round(brand.logo.x),24);
state.brand.placement='top';brand=B.measure(C.size(state),state.brand);
assert(brand.band.h>48&&brand.band.h<120,'Wordmark has a compact white band');
assert.equal(brand.photoArea.y,brand.band.h);
assert.equal(brand.photoArea.h+brand.band.h,1080);

const before=JSON.parse(JSON.stringify(state));
before.slots[0].frame={x:40,y:brand.photoArea.y+20,w:300,h:300};
const portrait={x:0,y:100,w:1080,h:1340};
B.remapFrames(before,brand.photoArea,portrait);
assert.equal(before.slots[0].frame.y,portrait.y+20*portrait.h/brand.photoArea.h);
assert.equal(before.slots[0].frame.w,300);

const images=Array.from({length:6},(_,i)=>{const c=createCanvas(1200,900),x=c.getContext('2d');x.fillStyle=['#ed6a5a','#f4f1bb','#9bc1bc','#5ca4a9','#00345c','#111111'][i];x.fillRect(0,0,1200,900);return c});
const canvas=createCanvas(1080,1080);C.draw(canvas.getContext('2d'),images,state);
const top=[...canvas.getContext('2d').getImageData(1,1,1,1).data];
assert.deepEqual(top.slice(0,3),[255,255,255],'Top logo band reaches exported artwork');
const photo=[...canvas.getContext('2d').getImageData(300,brand.band.h+150,1,1).data];
assert.notDeepEqual(photo.slice(0,3),[255,255,255],'Photos start below the band');
console.log('PASS: local square and wordmark logo geometry, top band, frame remap, and exported brand pixels.');
