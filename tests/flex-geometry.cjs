const assert=require('node:assert/strict');
require('../src/collage-brand.js');require('../src/collage-core.js');
const C=globalThis.CollageCore;let cases=0;
for(const layout of C.layoutsFor(4))for(const ratio of ['1:1','4:5'])for(const index of [0,1,2,3])for(const tilted of [false,true]){
 const s=C.defaults();Object.assign(s,{layout:layout.id,ratio,slant:tilted?{x:.12,y:-.12}:{x:0,y:0}});
 for(const handle of C.flexHandles(s,index)){
  for(const p of [{x:900,y:220},{x:-500,y:2200}]){
   const moved=JSON.parse(JSON.stringify(s));moved.customCells=C.resizeLayout(s,index,handle.corner,p);const cells=moved.customCells;
   let total=0;
   for(const [x,y,w,h] of cells){assert([x,y,w,h].every(Number.isFinite));assert(x>=-1e-6&&y>=-1e-6&&x+w<=1.000001&&y+h<=1.000001&&w>0&&h>0);total+=w*h}
   if(!layout.id.startsWith('inset-'))assert(Math.abs(total-1)<1e-6,'A divider drag preserves full coverage');
   for(let i=0;i<cells.length;i++)for(let j=i+1;j<cells.length;j++){const [x,y,w,h]=cells[i],[a,b,c,d]=cells[j];assert(Math.min(x+w,a+c)-Math.max(x,a)<1e-6||Math.min(y+h,b+d)-Math.max(y,b)<1e-6,'No neighbouring frame is covered')}
   const boxes=C.frameBoxes(moved);assert(boxes.every(b=>b.w>0&&b.h>0));
   const tight=JSON.parse(JSON.stringify(moved));tight.slant={x:0,y:0};tight.margin=64;tight.gap=48;tight.brand={...tight.brand,placement:'top',wordmark:{id:9,width:100,height:900},padding:64};
   assert(C.frameBoxes(tight).every(b=>b.w>=8&&b.h>=8),'Changing margins/gutters/logo after resizing must not collapse a frame');
   for(let row=0;row<9;row++)for(let col=0;col<9;col++){const point={x:18+(col+.371)*1044/9,y:18+(row+.613)*(C.size(s).h-36)/9};assert(boxes.filter(b=>C.hit(b,point)).length<=1,'Slanted flexible masks do not overlap')}
   cases++;
  }
 }
}
console.log(`PASS: ${cases} flexible shared-corner drags preserve coverage, positive frames and non-overlap, including slant.`);
