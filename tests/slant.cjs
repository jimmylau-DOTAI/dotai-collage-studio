const assert=require('node:assert/strict');
require('../src/collage-brand.js');require('../src/collage-core.js');
const C=globalThis.CollageCore;
let cases=0;
for(let n=2;n<=9;n++)for(const layout of C.layoutsFor(n))for(const ratio of ['1:1','4:5'])for(const [x,y] of [[-.12,-.12],[-.12,.12],[.12,-.12],[.12,.12]]){
 const s=C.defaults();Object.assign(s,{ratio,layout:layout.id,slant:{x,y},slots:Array.from({length:n},(_,photo)=>({photo,x:.5,y:.5,zoom:3}))});
 const frames=C.frameBoxes(s),size=C.size(s);assert.equal(frames.length,n);
 let area=0;
 for(const b of frames){
  assert(b.mask?.points,'Every chosen layout converts into clipped polygon frames');
  const p=b.mask.points.map(([x,y])=>[b.x+x*b.w,b.y+y*b.h]);
  assert(p.every(([x,y])=>x>=18-1e-7&&y>=18-1e-7&&x<=1062+1e-7&&y<=size.h-18+1e-7));
  let signed=0;for(let i=0;i<p.length;i++){const a=p[i],z=p[(i+1)%p.length];signed+=a[0]*z[1]-a[1]*z[0]}assert(signed>0,'No inverted/collapsed frame');area+=signed/2;
 }
 if(!layout.id.startsWith('inset-'))assert(Math.abs(area-1044*(size.h-36))<1e-5,'Shared frame areas must exactly fill the inner canvas');
 for(let row=0;row<11;row++)for(let col=0;col<11;col++){
  const p={x:18+(col+.371)*1044/11,y:18+(row+.613)*(size.h-36)/11};
  const count=frames.filter(b=>C.hit(b,p)).length;assert(count<=1,'Slanted frames must never overlap');
  if(!layout.id.startsWith('inset-'))assert.equal(count,1,'No holes along shared edges');
 }
 cases++;
}
console.log(`PASS: ${cases} slanted layout/ratio/extreme combinations retain bounds, shared coverage and no overlaps.`);
