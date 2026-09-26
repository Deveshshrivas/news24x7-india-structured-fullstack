'use client';
import {useEffect,useRef} from 'react';

export default function AdUnit({client,slot,placement}:{client:string;slot:string;placement:string}){
 const element=useRef<HTMLModElement>(null);
 
 useEffect(()=>{
  try {
   if (element.current && !element.current.dataset.requested) {
    element.current.dataset.requested = 'true';
    const w = window as any;
    (w.adsbygoogle = w.adsbygoogle || []).push({});
   }
  } catch (e) {
   console.error("AdSense error:", e);
  }
 }, [client, slot]);

 return (
  <aside className={`siteAd siteAd-${placement}`} aria-label="Advertisement">
   <span>Advertisement · विज्ञापन</span>
   <ins 
    ref={element} 
    className="adsbygoogle" 
    style={{display:'block', overflow: 'hidden'}} 
    data-ad-client={client} 
    data-ad-slot={slot} 
    data-ad-format="auto" 
    data-full-width-responsive="true"
   />
  </aside>
 );
}
