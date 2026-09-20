(function (root) {
  'use strict';
  const W = 1080, H = 1080;
  const size=s=>({w:1080,h:s.ratio==='4:5'?1350:1080});
  const layouts = [
    { id: 'grid', name: '經典四格', note: '四張相平均呈現', cells: [[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]] },
    { id: 'story', name: '故事四格', note: '主角、細節、現場', cells: [[0,0,1,.36],[0,.36,.5,.32],[.5,.36,.5,.32],[0,.68,1,.32]] },
    { id: 'hero', name: '上大下三', note: '突出一張主相', cells: [[0,0,1,.62],[0,.62,1/3,.38],[1/3,.62,1/3,.38],[2/3,.62,1/3,.38]] },
    { id: 'side', name: '左大右三', note: '人物配現場細節', cells: [[0,0,.6,1],[.6,0,.4,1/3],[.6,1/3,.4,1/3],[.6,2/3,.4,1/3]] },
    { id: 'bands', name: '橫幅四連', note: '適合橫向示範圖', cells: [[0,0,1,.25],[0,.25,1,.25],[0,.5,1,.25],[0,.75,1,.25]] },
    { id: 'editorial', name: '錯落拼貼', note: '大小交錯、有節奏', cells: [[0,0,.5,.6],[.5,0,.5,.4],[0,.6,.5,.4],[.5,.4,.5,.6]] },
    { id: 'spotlight', name: '雜誌焦點', note: '大主相配三個現場切面', creative:true, cells:[[0,0,1,.56],[0,.56,.56,.44],[.56,.56,.44,.22],[.56,.78,.44,.22]] },
    { id: 'circles', name: '圓窗視角', note: '四個圓形窗口，聚焦人物與互動', creative:true, treatment:'circle', cells:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]] },
    { id: 'diagonal', name: '斜切節奏', note: '斜切橫幅，形成連續視線', creative:true, treatment:'diagonal', cells:[[0,0,1,.25],[0,.25,1,.25],[0,.5,1,.25],[0,.75,1,.25]] },
    { id: 'gallery', name: '留白藝廊', note: '不對稱留白，突出主講與現場', creative:true, cells:[[0,0,.68,.46],[.71,.04,.29,.35],[.05,.50,.35,.46],[.44,.50,.56,.42]] }
  ];
  // Distinct four-photo structures transcribed from the supplied screenshots.
  // Repeated ratio variants are represented by the ratio selector, not duplicates.
  layouts.splice(0,layouts.length,...[
    ['grid','經典四格',[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]],
    ['rows','橫排四連',[[0,0,1,.25],[0,.25,1,.25],[0,.5,1,.25],[0,.75,1,.25]]],
    ['columns','直排四連',[[0,0,.25,1],[.25,0,.25,1],[.5,0,.25,1],[.75,0,.25,1]]],
    ['top3','上大下三',[[0,0,1,.62],[0,.62,1/3,.38],[1/3,.62,1/3,.38],[2/3,.62,1/3,.38]]],
    ['bottom3','上三下大',[[0,0,1/3,.38],[1/3,0,1/3,.38],[2/3,0,1/3,.38],[0,.38,1,.62]]],
    ['left3','左大右三',[[0,0,.62,1],[.62,0,.38,1/3],[.62,1/3,.38,1/3],[.62,2/3,.38,1/3]]],
    ['right3','左三右大',[[0,0,.38,1/3],[0,1/3,.38,1/3],[0,2/3,.38,1/3],[.38,0,.62,1]]],
    ['top-small','上細下闊',[[0,0,.5,.3],[.5,0,.5,.3],[0,.3,.5,.7],[.5,.3,.5,.7]]],
    ['bottom-small','上闊下細',[[0,0,.5,.7],[.5,0,.5,.7],[0,.7,.5,.3],[.5,.7,.5,.3]]],
    ['left-small','左窄右闊',[[0,0,.3,.5],[0,.5,.3,.5],[.3,0,.7,.5],[.3,.5,.7,.5]]],
    ['right-small','左闊右窄',[[0,0,.7,.5],[0,.5,.7,.5],[.7,0,.3,.5],[.7,.5,.3,.5]]],
    ['stagger-columns','左右錯層',[[0,0,.5,.65],[0,.65,.5,.35],[.5,0,.5,.35],[.5,.35,.5,.65]]],
    ['stagger-rows','上下錯層',[[0,0,.65,.5],[.65,0,.35,.5],[0,.5,.35,.5],[.35,.5,.65,.5]]],
    ['focus-tl','左上主相',[[0,0,.65,.65],[.65,0,.35,.65],[0,.65,.65,.35],[.65,.65,.35,.35]]],
    ['focus-br','右下主相',[[0,0,.35,.35],[.35,0,.65,.35],[0,.35,.35,.65],[.35,.35,.65,.65]]],
    ['t-top','上橫下分',[[0,0,1,.4],[0,.4,.5,.6],[.5,.4,.5,.3],[.5,.7,.5,.3]]],
    ['t-bottom','上分下橫',[[0,0,.5,.6],[.5,0,.5,.3],[.5,.3,.5,.3],[0,.6,1,.4]]],
    ['t-left','左直右分',[[0,0,.4,1],[.4,0,.6,.5],[.4,.5,.3,.5],[.7,.5,.3,.5]]],
    ['t-right','左分右直',[[0,0,.6,.5],[0,.5,.3,.5],[.3,.5,.3,.5],[.6,0,.4,1]]],
    ['middle-row','中段雙相',[[0,0,1,.25],[0,.25,.5,.5],[.5,.25,.5,.5],[0,.75,1,.25]]],
    ['middle-col','中柱雙相',[[0,0,.25,1],[.25,0,.5,.5],[.25,.5,.5,.5],[.75,0,.25,1]]],
    ['inset-top','上方三小窗',[[.08,.05,.24,.22],[.38,.05,.24,.22],[.68,.05,.24,.22],[0,.34,1,.66]]],
    ['inset-bottom','下方三小窗',[[0,0,1,.66],[.08,.73,.24,.22],[.38,.73,.24,.22],[.68,.73,.24,.22]]],
    ['inset-left','左側三小窗',[[.05,.08,.22,.24],[.05,.38,.22,.24],[.05,.68,.22,.24],[.34,0,.66,1]]],
    ['inset-right','右側三小窗',[[0,0,.66,1],[.73,.08,.22,.24],[.73,.38,.22,.24],[.73,.68,.22,.24]]],
    ['float-row','橫向畫中畫',[[0,0,1,1],[.06,.38,.26,.24],[.37,.38,.26,.24],[.68,.38,.26,.24]],true],
    ['float-col','直向畫中畫',[[0,0,1,1],[.38,.06,.24,.26],[.38,.37,.24,.26],[.38,.68,.24,.26]],true],
    ['float-center','中央畫中畫',[[0,0,1,1/3],[0,1/3,1,1/3],[0,2/3,1,1/3],[.3,.25,.4,.5]],true],
    ['cut-grid','可調斜切四格',[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]]
  ].map(([id,name,cells,overlap])=>({id,name,cells,overlap:!!overlap,note:id==='cut-grid'?'拖四個端點，共用分界同步改變':'四張原相・可選背景配色'})));
  const clamp = (v, lo=0, hi=1) => Math.min(hi, Math.max(lo,v));
  const layoutCache=new Map();
  // All user-facing structures are non-overlapping. Legacy layouts stay readable.
  function layoutsFor(count){
    if(!Number.isInteger(count)||count<1||count>9)throw new Error('請選擇 1–9 張相片');
    if(count===4)return layouts.filter(l=>!l.overlap);
    if(layoutCache.has(count))return layoutCache.get(count);
    const make=(kind,name,cells)=>({id:`${kind}-${count}`,name,cells,overlap:false});
    if(count===1)return[make('single','單張全圖',[[0,0,1,1]])];
    const rows=Array.from({length:count},(_,i)=>[0,i/count,1,1/count]);
    const columns=rows.map(([x,y,w,h])=>[y,x,h,w]);
    const rowCount=Math.ceil(Math.sqrt(count)),cells=[];
    let remaining=count;
    for(let row=0;row<rowCount;row++){
      const cols=Math.ceil(remaining/(rowCount-row));remaining-=cols;
      for(let col=0;col<cols;col++)cells.push([col/cols,row/rowCount,1/cols,1/rowCount]);
    }
    const tail=layoutsFor(count-1)[0].cells;
    const choices=[make('auto','平均排版',cells),make('rows','橫向分格',rows),make('cols','直向分格',columns)];
    for(const share of [.4,.55,.7]){
      const hero=[[0,0,1,share],...tail.map(([x,y,w,h])=>[x,share+y*(1-share),w,h*(1-share)])];
      const percent=Math.round(share*100);
      choices.push(make(`hero${percent}`,`上主相 ${percent}%`,hero),
        make(`bottom${percent}`,`下主相 ${percent}%`,hero.map(([x,y,w,h])=>[x,1-y-h,w,h])),
        make(`left${percent}`,`左主相 ${percent}%`,hero.map(([x,y,w,h])=>[y,x,h,w])),
        make(`right${percent}`,`右主相 ${percent}%`,hero.map(([x,y,w,h])=>[1-y-h,x,h,w])));
    }
    choices.push(make('transpose','交錯分格',cells.map(([x,y,w,h])=>[y,x,h,w])),make('reverse','反向分格',cells.map(([x,y,w,h])=>[x,1-y-h,w,h])));
    const seen=new Set(),unique=choices.filter(l=>{const key=l.cells.map(c=>c.map(n=>n.toFixed(5)).join(',')).sort().join(';');if(seen.has(key))return false;seen.add(key);return true});
    layoutCache.set(count,unique);return unique;
  }
  function layoutById(id){return layouts.find(l=>l.id===id)||Array.from({length:9},(_,i)=>layoutsFor(i+1)).flat().find(l=>l.id===id)||layouts[0]}
  function presetMask(name){
    const shapes={rect:[[0,0],[1,0],[1,1],[0,1]],triangle:[[.5,0],[1,1],[0,1]],diagonal:[[.15,0],[1,0],[.85,1],[0,1]],diamond:[[.5,0],[1,.5],[.5,1],[0,.5]],hexagon:[[.25,0],[.75,0],[1,.5],[.75,1],[.25,1],[0,.5]]};
    return name==='circle'?{kind:'circle'}:{kind:'polygon',points:(shapes[name]||shapes.rect).map(p=>p.slice())};
  }
  function insidePolygon(points,x,y){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
  function validPolygon(p){
    if(!Array.isArray(p)||p.length<3||p.some(v=>v.length!==2||v.some(n=>!Number.isFinite(n)||n<0||n>1)))return false;
    let area=0;const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];area+=a[0]*b[1]-b[0]*a[1];if(Math.hypot(a[0]-b[0],a[1]-b[1])<.025)return false;
      for(let j=i+2;j<p.length;j++){if(i===0&&j===p.length-1)continue;const c=p[j],d=p[(j+1)%p.length];if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0)return false;}
    }return Math.abs(area)>.05;
  }
  function photoArea(state){return root.CollageBrand?root.CollageBrand.measure(size(state),state.brand).photoArea:{x:0,y:0,...size(state)};}
  function cutHandles(state){const a=photoArea(state),m=state.margin,c=state.cut;return [{key:'top',x:a.x+m+c.top*(a.w-2*m),y:a.y+m},{key:'bottom',x:a.x+m+c.bottom*(a.w-2*m),y:a.y+a.h-m},{key:'left',x:a.x+m,y:a.y+m+c.left*(a.h-2*m)},{key:'right',x:a.x+a.w-m,y:a.y+m+c.right*(a.h-2*m)}];}
  function cutBoxes(state){
    const a=photoArea(state),m=state.margin,c=state.cut,dx=c.bottom-c.top,dy=c.right-c.left,x=(c.top+dx*c.left)/(1-dx*dy),y=c.left+dy*x;
    const polygons=[[[0,0],[c.top,0],[x,y],[0,c.left]],[[c.top,0],[1,0],[1,c.right],[x,y]],[[0,c.left],[x,y],[c.bottom,1],[0,1]],[[x,y],[1,c.right],[1,1],[c.bottom,1]]];
    return polygons.map(p=>{const xs=p.map(v=>v[0]),ys=p.map(v=>v[1]),x0=Math.min(...xs),y0=Math.min(...ys),bw=Math.max(...xs)-x0,bh=Math.max(...ys)-y0;return {x:a.x+m+x0*(a.w-2*m),y:a.y+m+y0*(a.h-2*m),w:bw*(a.w-2*m),h:bh*(a.h-2*m),angle:0,shape:'polygon',cut:true,mask:{kind:'polygon',points:p.map(([px,py])=>[(px-x0)/bw,(py-y0)/bh])}};});
  }
  function slantedBoxes(state,layout){
    const a=photoArea(state),m=state.margin,w=a.w-2*m,h=a.h-2*m;
    const sx=clamp(Number(state.slant?.x)||0,-.12,.12),sy=clamp(Number(state.slant?.y)||0,-.12,.12);
    // Shared edge knots make T junctions deform together, without cracks/overlap.
    const xs=[...new Set(layout.cells.flatMap(([x,y,w,h])=>[x,x+w]))].sort((a,b)=>a-b);
    const ys=[...new Set(layout.cells.flatMap(([x,y,w,h])=>[y,y+h]))].sort((a,b)=>a-b);
    const warp=([x,y])=>[a.x+m+(x+sx*Math.sin(Math.PI*x)*(2*y-1))*w,a.y+m+(y+sy*Math.sin(Math.PI*y)*(2*x-1))*h];
    return layout.cells.map(([x,y,cw,ch])=>{
      const xx=xs.filter(v=>v>=x-1e-8&&v<=x+cw+1e-8),yy=ys.filter(v=>v>=y-1e-8&&v<=y+ch+1e-8);
      const perimeter=[...xx.map(v=>[v,y]),...yy.slice(1).map(v=>[x+cw,v]),...xx.slice(0,-1).reverse().map(v=>[v,y+ch]),...yy.slice(1,-1).reverse().map(v=>[x,v])];
      const pts=perimeter.map(warp),px=pts.map(p=>p[0]),py=pts.map(p=>p[1]),bx=Math.min(...px),by=Math.min(...py),bw=Math.max(...px)-bx,bh=Math.max(...py)-by;
      return{x:bx,y:by,w:bw,h:bh,angle:0,shape:'polygon',cut:true,mask:{kind:'polygon',points:pts.map(([x,y])=>[(x-bx)/bw,(y-by)/bh])}};
    });
  }
  function frameBoxes(state){const available=layoutsFor(state.slots.length),layout=layouts.find(l=>l.id===state.layout&&l.cells.length===state.slots.length)||available.find(l=>l.id===state.layout)||available[0];if(state.slots.length>1&&(state.slant?.x||state.slant?.y))return slantedBoxes(state,layout);const base=layout.id==='cut-grid'?cutBoxes(state):boxes(layout.id,state.margin,state.gap,photoArea(state));return base.map((b,i)=>{const s=state.slots[i];if(s.frame)b={...b,...s.frame,angle:0};if(s.mask)b={...b,mask:s.mask};return b;});}
  function boxes(layoutId, margin=16, gap=12,dimensions={x:0,y:0,w:W,h:H}) {
    const {x:ox=0,y:oy=0,w:W,h:H}=dimensions;
    const layout = layoutById(layoutId);
    // A half-gap only on internal edges keeps the outside border uniform.
    return layout.cells.map(([x,y,w,h],i) => {
      const b={
      x: ox + margin + x*(W-2*margin) + (x>0 ? gap/2 : 0),
      y: oy + margin + y*(H-2*margin) + (y>0 ? gap/2 : 0),
      w: w*(W-2*margin) - (x>0 ? gap/2 : 0) - (x+w<.99999 ? gap/2 : 0),
      h: h*(H-2*margin) - (y>0 ? gap/2 : 0) - (y+h<.99999 ? gap/2 : 0),
      shape:layout.treatment||'rect',angle:0
      };
      if(b.shape==='polaroid'){b.x+=34;b.y+=30;b.w-=68;b.h-=82;b.angle=[-4,3,3,-3][i];}
      if(b.shape==='film'){b.x+=38;b.w-=76;}
      if(b.shape==='circle'){const d=Math.min(b.w,b.h)-16;b.x+=(b.w-d)/2;b.y+=(b.h-d)/2;b.w=b.h=d;}
      return b;
    });
  }
  function localPoint(b,p){const a=-(b.angle||0)*Math.PI/180,cx=b.x+b.w/2,cy=b.y+b.h/2;return {x:cx+(p.x-cx)*Math.cos(a)-(p.y-cy)*Math.sin(a),y:cy+(p.x-cx)*Math.sin(a)+(p.y-cy)*Math.cos(a)};}
  function hit(b,p){p=localPoint(b,p);const x=(p.x-b.x)/b.w,y=(p.y-b.y)/b.h;if(x<0||x>1||y<0||y>1)return false;if(b.mask&&b.mask.kind==='polygon')return insidePolygon(b.mask.points,x,y);if(b.shape==='circle')return (x-.5)**2+(y-.5)**2<=.25;if(b.shape==='diagonal')return x>=.1*(1-y)&&x<=1-.1*y;return true;}
  function logoVariant(bg){const n=parseInt(bg.slice(1),16),rgb=[n>>16,(n>>8)&255,n&255].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]>.179?'black':'white';}
  function geometry(image, box, slot) {
    const iw=image.naturalWidth || image.width, ih=image.naturalHeight || image.height;
    const scale=Math.max(box.w/iw,box.h/ih)*clamp(slot.zoom,1,3);
    const w=iw*scale, h=ih*scale;
    return { x:box.x+(box.w-w)*slot.x, y:box.y+(box.h-h)*slot.y, w,h, overflowX:Math.max(0,w-box.w), overflowY:Math.max(0,h-box.h) };
  }
  function rounded(ctx,b,r) {
    r=Math.min(r,b.w/2,b.h/2);
    ctx.beginPath(); ctx.moveTo(b.x+r,b.y);
    ctx.arcTo(b.x+b.w,b.y,b.x+b.w,b.y+b.h,r);
    ctx.arcTo(b.x+b.w,b.y+b.h,b.x,b.y+b.h,r);
    ctx.arcTo(b.x,b.y+b.h,b.x,b.y,r);
    ctx.arcTo(b.x,b.y,b.x+b.w,b.y,r); ctx.closePath();
  }
  function draw(ctx, images, state,logos={}) {
    const {w:W,h:H}=size(state);
    ctx.save(); ctx.clearRect(0,0,W,H); ctx.fillStyle=state.bg; ctx.fillRect(0,0,W,H);
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    const rects=frameBoxes(state);
    rects.forEach((b,i)=>{
      const slot=state.slots[i], image=images[slot.photo];
      ctx.save();
      if(b.angle){ctx.translate(b.x+b.w/2,b.y+b.h/2);ctx.rotate(b.angle*Math.PI/180);ctx.translate(-b.x-b.w/2,-b.y-b.h/2);}
      if(b.shape==='polaroid'){ctx.fillStyle='#FFFFFF';ctx.fillRect(b.x-12,b.y-12,b.w+24,b.h+44);}
      if(b.shape==='film'){ctx.fillStyle=logoVariant(state.bg)==='white'?'#FFFFFF':'#0B63F6';for(let y=b.y+8;y<b.y+b.h-8;y+=34){ctx.fillRect(b.x-26,y,12,17);ctx.fillRect(b.x+b.w+14,y,12,17);}}
      if(b.mask&&b.mask.kind==='polygon'){ctx.beginPath();b.mask.points.forEach(([x,y],k)=>{const fn=k?'lineTo':'moveTo';ctx[fn](b.x+x*b.w,b.y+y*b.h);});ctx.closePath();}
      else if(b.shape==='circle'){ctx.beginPath();ctx.ellipse(b.x+b.w/2,b.y+b.h/2,b.w/2,b.h/2,0,0,Math.PI*2);}
      else if(b.shape==='diagonal'){ctx.beginPath();ctx.moveTo(b.x+b.w*.1,b.y);ctx.lineTo(b.x+b.w,b.y);ctx.lineTo(b.x+b.w*.9,b.y+b.h);ctx.lineTo(b.x,b.y+b.h);ctx.closePath();}
      else rounded(ctx,b,state.radius);
      ctx.clip();
      if (image) { const g=geometry(image,b,slot); ctx.drawImage(image,g.x,g.y,g.w,g.h); }
      if(layoutById(state.layout).overlap&&i>0&&state.gap){ctx.strokeStyle=state.bg;ctx.lineWidth=state.gap*2;ctx.stroke();}
      ctx.restore();
    });
    // Paint shared gutters after every photo. Stroking inside each clipped image
    // leaves coloured antialias seams when the neighbouring image is drawn later.
    if(state.gap){
      ctx.save();ctx.strokeStyle=state.bg;ctx.lineWidth=state.gap;ctx.lineJoin='round';
      for(const b of rects)if(b.cut&&b.mask?.kind==='polygon'){
        ctx.beginPath();b.mask.points.forEach(([x,y],i)=>ctx[i?'lineTo':'moveTo'](b.x+x*b.w,b.y+y*b.h));ctx.closePath();ctx.stroke();
      }
      ctx.restore();
    }
    const brand=root.CollageBrand&&root.CollageBrand.measure({w:W,h:H},state.brand);
    if(brand?.band){ctx.fillStyle='#FFFFFF';ctx.fillRect(brand.band.x,brand.band.y,brand.band.w,brand.band.h);}
    if(brand?.logo){const logo=images[brand.logo.assetId];if(!logo)throw new Error('已選標誌未能讀取');ctx.drawImage(logo,brand.logo.x,brand.logo.y,brand.logo.w,brand.logo.h);}
    ctx.restore(); return rects;
  }
  function defaults() {
    return { layout:'grid', ratio:'1:1',slant:{x:0,y:0},cut:{top:.5,bottom:.5,left:.5,right:.5},margin:18, gap:12, radius:0, bg:'#FFFFFF', brand:{placement:'none',square:null,wordmark:null,squareSize:.12,wordmarkSize:.24,padding:24}, slots:[
      {photo:0,x:.52,y:.53,zoom:1}, {photo:1,x:.63,y:.52,zoom:1},
      {photo:2,x:.52,y:.5,zoom:1}, {photo:3,x:.72,y:.56,zoom:1}
    ] };
  }
  root.CollageCore={W,H,layouts,layoutsFor,clamp,boxes,geometry,draw,defaults,localPoint,hit,logoVariant,presetMask,validPolygon,frameBoxes,size,cutHandles,photoArea};
})(typeof globalThis!=='undefined' ? globalThis : this);
