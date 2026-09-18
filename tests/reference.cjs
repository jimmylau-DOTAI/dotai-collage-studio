const assert=require('node:assert/strict');require('../src/collage-core.js');const C=globalThis.CollageCore;
let s=C.defaults();assert.deepEqual(C.size(s),{w:1080,h:1080});s.ratio='4:3';assert.deepEqual(C.size(s),{w:1440,h:1080});
assert(C.layouts.length>=24,'Reference library covers distinct four-photo structures');
for(const ratio of ['1:1','4:3'])for(const l of C.layouts){s=C.defaults();s.ratio=ratio;s.layout=l.id;const {w,h}=C.size(s);const b=C.frameBoxes(s);assert.equal(b.length,4);for(const r of b)assert(r.x>=0&&r.y>=0&&r.w>0&&r.h>0&&r.x+r.w<=w+.01&&r.y+r.h<=h+.01);}
s=C.defaults();s.layout='cut-grid';s.gap=0;const cut=C.frameBoxes(s);let covered=0;
for(let x=50;x<1040;x+=41)for(let y=50;y<1040;y+=43){const hits=cut.filter(b=>C.hit(b,{x,y})).length;assert.equal(hits,1,'Shared diagonal boundaries partition without holes or overlapping photos');covered++;}
const before=JSON.stringify(cut);s.cut.top=.25;assert.notEqual(JSON.stringify(C.frameBoxes(s)),before);assert.equal(C.cutHandles(s).length,4);
console.log('PASS: two requested ratios; all reference templates contain four frames; shared slanted cuts partition canvas; adjustable boundaries.');
