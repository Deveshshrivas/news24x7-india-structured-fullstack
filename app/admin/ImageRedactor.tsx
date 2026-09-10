'use client';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import './image-redactor.css';
type Rect={x:number;y:number;w:number;h:number};
export default function ImageRedactor({file,onApply,onCancel}:{file:File;onApply:(file:File)=>void;onCancel:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),bitmap=useRef<ImageBitmap|null>(null),start=useRef<{x:number;y:number}|null>(null);
 const [regions,setRegions]=useState<Rect[]>([]),[draft,setDraft]=useState<Rect|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let cancelled=false;createImageBitmap(file).then(image=>{if(cancelled){image.close();return}bitmap.current=image;const c=canvas.current!;const scale=Math.min(1,1920/Math.max(image.width,image.height));c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale);setReady(true)}).catch(()=>setError('Image could not be opened.'));return()=>{cancelled=true;bitmap.current?.close();bitmap.current=null}},[file]);
 function render(showDraft=true){
  const c=canvas.current,source=bitmap.current;if(!c||!source)return;
  const ctx=c.getContext('2d')!;ctx.drawImage(source,0,0,c.width,c.height);
  for(const r of regions){
   // Pixelate only the selected region; no unredacted image is uploaded on Apply.
   const tiny=document.createElement('canvas');tiny.width=Math.max(1,Math.ceil(r.w/24));tiny.height=Math.max(1,Math.ceil(r.h/24));
   tiny.getContext('2d')!.drawImage(c,r.x,r.y,r.w,r.h,0,0,tiny.width,tiny.height);
   ctx.imageSmoothingEnabled=false;ctx.drawImage(tiny,0,0,tiny.width,tiny.height,r.x,r.y,r.w,r.h);ctx.imageSmoothingEnabled=true;
  }
  if(showDraft&&draft){ctx.strokeStyle='#ff233b';ctx.lineWidth=3;ctx.strokeRect(draft.x,draft.y,draft.w,draft.h)}
 }
 useEffect(()=>{render()},[ready,regions,draft]);
 function point(e:PointerEvent<HTMLCanvasElement>){const c=e.currentTarget,r=c.getBoundingClientRect();return {x:Math.max(0,Math.min(c.width,(e.clientX-r.left)*c.width/r.width)),y:Math.max(0,Math.min(c.height,(e.clientY-r.top)*c.height/r.height))}}
 function rect(e:PointerEvent<HTMLCanvasElement>){const p=point(e),s=start.current!;return {x:Math.min(p.x,s.x),y:Math.min(p.y,s.y),w:Math.abs(p.x-s.x),h:Math.abs(p.y-s.y)}}
 async function apply(){setBusy(true);try{render(false);const blob=await new Promise<Blob|null>(resolve=>canvas.current!.toBlob(resolve,'image/jpeg',.92));if(!blob||blob.size>8*1024*1024)throw Error('Edited image is too large. Select a smaller image.');onApply(new File([blob],file.name.replace(/\.[^.]+$/,'')+'-redacted.jpg',{type:'image/jpeg'}))}catch(e){setError(e instanceof Error?e.message:'Could not save edits')}finally{setBusy(false)}}
 return <section className="imageRedactor" aria-label="Blur sensitive areas"><h3>Blur faces / number plates</h3><p>Drag rectangles over sensitive areas. Add multiple areas, then apply. Pixelation is baked into the uploaded image. Review carefully: masking does not guarantee anonymity.</p><canvas ref={canvas} aria-label="Draw rectangles to pixelate" onPointerDown={e=>{if(!ready||busy||!e.isPrimary||e.button!==0)return;start.current=point(e);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(start.current)setDraft(rect(e))}} onPointerUp={e=>{if(!start.current)return;const r=rect(e);start.current=null;setDraft(null);if(r.w>=4&&r.h>=4)setRegions(current=>[...current,r]);e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>{start.current=null;setDraft(null)}}/>
 <p role="status">{regions.length} areas selected. {error}</p><div><button type="button" disabled={busy||!regions.length} onClick={()=>setRegions(r=>r.slice(0,-1))}>Undo area</button><button type="button" disabled={!ready||busy} onClick={()=>{const c=canvas.current!;setRegions([{x:0,y:0,w:c.width,h:c.height}])}}>Pixelate entire photo</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button><button type="button" disabled={!ready||busy||!regions.length||!!draft} onClick={apply}>{busy?'Applying…':'Apply blur'}</button></div></section>;
}
