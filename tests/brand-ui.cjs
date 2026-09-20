const assert=require('node:assert/strict');
const sharp=require('sharp');
const {openEditor}=require('./helpers/editor-harness.cjs');

(async()=>{
  const app=await openEditor();
  try{
    const {window,el,change,upload,file,pointer,picture,download}=app;
    const C=window.CollageCore,B=window.CollageBrand;
    let current;
    const originalDraw=C.draw;
    C.draw=function(ctx,images,state,...rest){current=JSON.parse(JSON.stringify(state));return originalDraw(ctx,images,state,...rest);};
    await upload('logo-wordmark',file('wordmark.png','#00AA00',600,100));
    await upload('logo-square',file('square.png','#AA0000',100,100));
    assert(!el('logo-wordmark-preview').hidden&&!el('logo-square-preview').hidden);
    const b=C.frameBoxes(current)[0];
    pointer('pointerdown',b.x+20,b.y+20);pointer('pointermove',b.x+100,b.y+60);pointer('pointerup',b.x+100,b.y+60);
    assert(current.slots[0].frame,'Move control must create a manual frame');
    const initialFrame=JSON.parse(JSON.stringify(current.slots[0].frame));
    const checkFrames=()=>{
      const area=B.measure(C.size(current),current.brand).photoArea;
      for(const box of C.frameBoxes(current)){
        assert(box.x>=area.x-.001&&box.y>=area.y-.001);
        assert(box.x+box.w<=area.x+area.w+.001&&box.y+box.h<=area.y+area.h+.001);
      }
    };
    change('brand-placement','top');checkFrames();
    assert.deepEqual([el('brand-size').min,el('brand-size').max],['12','40']);
    const oldFrame=JSON.parse(JSON.stringify(current.slots[0].frame));
    change('brand-size','40');change('brand-padding','64');checkFrames();
    assert.notDeepEqual(current.slots[0].frame,oldFrame,'Changing band dimensions must remap a manual frame');
    change('brand-placement','bottom');checkFrames();
    change('brand-placement','none');checkFrames();
    for(const key of ['x','y','w','h'])assert(Math.abs(current.slots[0].frame[key]-initialFrame[key])<.001,'Brand round trip retains '+key);
    change('brand-placement','corner');
    assert.deepEqual([el('brand-size').min,el('brand-size').max],['6','24']);
    change('brand-placement','top');
    const beforeRemoval=JSON.parse(JSON.stringify(current));
    el('logo-wordmark-remove').click();checkFrames();assert.equal(current.brand.placement,'none');
    el('undo').click();assert.deepEqual(current,beforeRemoval,'Removing active logo is fully undoable');
    for(const ratio of ['1:1','4:5']){
      change('ratio',ratio);checkFrames();
      const geometry=B.measure(C.size(current),current.brand),logo=geometry.logo;
      const x=Math.floor(logo.x+logo.w/2),y=Math.floor(logo.y+logo.h/2);
      assert.deepEqual([...picture().getContext('2d').getImageData(x,y,1,1).data],[0,170,0,255]);
      const jpg=await download(),meta=await sharp(jpg).metadata();
      assert.deepEqual([meta.width,meta.height],[1080,ratio==='1:1'?1080:1350]);
      const raw=await sharp(jpg).removeAlpha().raw().toBuffer();
      const offset=(y*1080+x)*3;
      [0,170,0].forEach((value,index)=>assert(Math.abs(raw[offset+index]-value)<=12,'Exported logo matches preview'));
      assert(raw[0]>245&&raw[1]>245&&raw[2]>245,'Exported brand band is white');
    }
    app.change('bg-color','#123456');app.prompts.push('我的底色');el('save-color').click();
    assert(window.localStorage.getItem('dotai-collage-saved-colors-v1').includes('#123456'));
    assert(!el('swatches').textContent.includes('IG 藍'));
    assert.equal(app.errors.length,0);
    console.log('PASS: actual logo uploads, manual-frame remap, size ranges, removal undo, palette wiring and both exported JPEG logo pixels.');
  }finally{app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
