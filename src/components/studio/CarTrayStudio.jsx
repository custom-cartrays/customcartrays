'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';

const PRICE=5000;
const TOOLS=[['Upload','▣'],['AI Expand','✦'],['Add Text','T'],['Templates','▤'],['Elements','○'],['Background','▧']];
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

function TrayReference(){
 return <svg viewBox="0 0 1700 1150" className="absolute inset-0 w-full h-full pointer-events-none z-30" aria-label="Car tray reference overlay">
  {/* Reference geometry derived from the approved visual. Replace path with manufacturing CAD export before production sign-off. */}
  <path d="M92 1135 Q28 1125 28 1038 L28 118 Q28 16 120 16 L476 16 Q505 16 505 50 L505 136 Q505 181 462 181 Q426 181 381 151 Q347 130 315 151 Q280 174 280 225 L280 282 Q280 354 353 354 Q486 307 850 307 Q1214 307 1347 354 Q1420 354 1420 282 L1420 225 Q1420 174 1385 151 Q1353 130 1319 151 Q1274 181 1238 181 Q1195 181 1195 136 L1195 50 Q1195 16 1224 16 L1580 16 Q1672 16 1672 118 L1672 1038 Q1672 1125 1608 1135 Q850 1150 92 1135 Z" fill="rgba(236,225,207,.28)" stroke="#171717" strokeWidth="5" vectorEffect="non-scaling-stroke"/>
  <rect x="58" y="374" width="1584" height="758" fill="none" stroke="#555" strokeWidth="4" strokeDasharray="18 14" vectorEffect="non-scaling-stroke"/>
 </svg>;
}

export default function CarTrayStudio(){
 const router=useRouter(); const {addItem}=useCart(); const fileRef=useRef(null);
 const [image,setImage]=useState(''); const [sourceSize,setSourceSize]=useState(null); const [prompt,setPrompt]=useState('');
 const [loading,setLoading]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
 const [scale,setScale]=useState(100); const [x,setX]=useState(50); const [y,setY]=useState(66); const [rot,setRot]=useState(0); const [view,setView]=useState('editor');
 const resetTransform=()=>{setScale(100);setX(50);setY(66);setRot(0)};
 const setNewImage=src=>{setImage(src);resetTransform();const im=new Image();im.onload=()=>setSourceSize({w:im.naturalWidth,h:im.naturalHeight});im.src=src};
 const readFile=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setNewImage(r.result);r.readAsDataURL(f)};
 const generate=async()=>{if(!prompt.trim())return;setLoading(true);setError('');try{const r=await fetch('/api/ai/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});const d=await r.json();if(!r.ok)throw new Error(d.error||'AI generation failed');setNewImage(d.imageUrl)}catch(e){setError(e.message)}finally{setLoading(false)}};
 const renderData=async(width,height,quality=.92)=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);const img=new Image();img.crossOrigin='anonymous';await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=image});const designW=width*(16.5/17),designH=height*(7.625/11.5);const base=Math.min(designW/img.naturalWidth,designH/img.naturalHeight);const s=base*(scale/100);const w=img.naturalWidth*s,h=img.naturalHeight*s;ctx.save();ctx.translate(width*x/100,height*y/100);ctx.rotate(rot*Math.PI/180);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();return c.toDataURL('image/jpeg',quality)};
 const add=async()=>{if(!image)return;setSaving(true);setError('');try{const previewDataUrl=await renderData(990,690,.88);const printDataUrl=await renderData(4950,3300,.95);const r=await fetch('/api/designs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({previewDataUrl,printDataUrl,metadata:{scale,x,y,rotation:rot,fit:'contain',designArea:'16.5x7.625',physicalTray:'17x11.5',studioVersion:2}})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save design');addItem({designId:d.designId,previewUrl:d.previewUrl,productName:'Custom Car Tray',price:PRICE});router.push('/cart')}catch(e){setError(e.message)}finally{setSaving(false)}};
 const nudge=(dx,dy)=>{setX(v=>clamp(v+dx,0,100));setY(v=>clamp(v+dy,0,100))};
 return <div className="min-h-screen bg-[#f5f4f1] text-neutral-950">
  <header className="h-16 bg-white border-b border-neutral-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50">
   <button onClick={()=>router.push('/')} className="font-black tracking-tight text-left leading-none">CUSTOM<br/><span className="tracking-normal">CAR TRAYS</span></button>
   <div className="hidden md:flex items-center gap-8 text-sm"><b>● 1&nbsp; Design Your Tray</b><span className="text-neutral-400">○ 2&nbsp; Review</span><span className="text-neutral-400">○ 3&nbsp; Add to Cart</span></div>
   <button onClick={add} disabled={!image||saving} className="rounded-xl bg-neutral-950 text-white px-5 py-3 font-bold disabled:opacity-35">{saving?'Saving…':'Continue →'}</button>
  </header>
  <main className="grid xl:grid-cols-[96px_minmax(0,1fr)_290px] min-h-[calc(100vh-4rem)]">
   <aside className="bg-white border-r border-neutral-200 p-2 flex xl:flex-col gap-1 overflow-x-auto xl:overflow-visible">
    {TOOLS.map(([label,icon],i)=><button key={label} onClick={()=>i===0&&fileRef.current?.click()} disabled={i>1} title={i>1?'Coming in Studio V2':label} className={`min-w-[76px] xl:min-w-0 rounded-xl px-2 py-3 text-xs flex flex-col items-center gap-1 ${i===0?'bg-neutral-100 font-bold':i>1?'opacity-35':'hover:bg-neutral-100'}`}><span className="text-2xl">{icon}</span>{label}</button>)}
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={readFile}/>
    <div className="hidden xl:block border-t my-2"/><button onClick={resetTransform} className="min-w-[76px] rounded-xl p-3 text-xs">↶ Reset</button>
   </aside>
   <section className="min-w-0 flex flex-col">
    <div className="px-4 pt-4 flex items-center justify-between text-xs text-neutral-500"><span>EDITOR VIEW</span><b>17″ × 11.5″ actual size</b></div>
    <div className="flex-1 p-3 md:p-6 flex items-center justify-center">
     <div className="relative w-full max-w-[980px] aspect-[17/11.5] bg-white shadow-sm overflow-hidden select-none">
      <div className="absolute left-[3.4%] right-[3.4%] top-[32.5%] bottom-[1.6%] z-0 bg-neutral-100 flex items-center justify-center overflow-hidden">
       {image?<img src={image} alt="Customer artwork" className="max-w-full max-h-full object-contain absolute" style={{width:`${scale}%`,height:`${scale}%`,left:`${x}%`,top:`${(y-32.5)/(66)*100}%`,transform:`translate(-50%,-50%) rotate(${rot}deg)`,objectFit:'contain'}}/>:<div className="text-center text-neutral-400 px-6"><div className="text-4xl mb-2">▣</div><b>Your photo starts here</b><p className="text-sm mt-1">Upload a photo. We center the whole image; AI Expand will fill the rest.</p></div>}
      </div>
      {view==='editor'&&<TrayReference/>}
     </div>
    </div>
    <div className="bg-white border-t border-neutral-200 p-3 flex gap-3 overflow-x-auto">
     {[['editor','Editor View'],['product','Product Preview'],['car','In-Car Preview'],['print','Print File']].map(([id,label])=><button key={id} onClick={()=>setView(id)} disabled={id==='car'} className={`min-w-[130px] rounded-xl border p-3 text-sm ${view===id?'border-neutral-950 font-bold':'border-neutral-200'} ${id==='car'?'opacity-35':''}`}>{label}{id==='print'&&<span className="block text-[10px] text-neutral-400">No guides</span>}</button>)}
     <div className="ml-auto min-w-[190px] rounded-xl bg-emerald-50 p-3 text-xs"><b>{sourceSize?`${sourceSize.w} × ${sourceSize.h}px`:'Image quality'}</b><span className="block text-neutral-500 mt-1">DPI check comes after placement math.</span></div>
    </div>
   </section>
   <aside className="bg-white border-l border-neutral-200 p-5 space-y-5">
    <div><div className="flex gap-5 border-b text-sm"><b className="pb-3 border-b-2 border-neutral-950">Image</b><span className="text-neutral-400">Adjust</span><span className="text-neutral-400">Effects</span></div></div>
    {!image?<><button onClick={()=>fileRef.current?.click()} className="w-full rounded-xl bg-neutral-950 text-white py-3 font-bold">Upload Image</button><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Or describe a design…" className="w-full h-24 border rounded-xl p-3 text-sm"/><button onClick={generate} disabled={loading||!prompt.trim()} className="w-full rounded-xl border py-3 font-bold disabled:opacity-35">{loading?'Generating…':'✦ Generate with AI'}</button></>:<>
     <button disabled className="w-full rounded-xl bg-neutral-950 text-white py-3 font-bold opacity-55">✦ AI Expand Background · next checkpoint</button>
     <label className="block text-sm">Scale <b className="float-right">{scale}%</b><input className="w-full mt-2" type="range" min="20" max="180" value={scale} onChange={e=>setScale(+e.target.value)}/></label>
     <label className="block text-sm">Rotate <b className="float-right">{rot}°</b><input className="w-full mt-2" type="range" min="-180" max="180" value={rot} onChange={e=>setRot(+e.target.value)}/></label>
     <div><p className="text-sm mb-2">Position</p><div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto"><span/><button onClick={()=>nudge(0,-2)} className="border rounded-lg p-2">↑</button><span/><button onClick={()=>nudge(-2,0)} className="border rounded-lg p-2">←</button><button onClick={()=>nudge(0,2)} className="border rounded-lg p-2">↓</button><button onClick={()=>nudge(2,0)} className="border rounded-lg p-2">→</button></div></div>
     <button onClick={()=>{setImage('');setSourceSize(null);resetTransform()}} className="text-sm text-red-600">Remove image</button>
    </>}
    {error&&<p className="text-red-600 text-sm">⚠ {error}</p>}
    <div className="border-t pt-4 text-xs text-neutral-500"><b className="text-neutral-900">Design area</b><br/>16.5″ × 7.625″<br/><span>Guides are editor-only and never print.</span></div>
   </aside>
  </main>
 </div>;
}
