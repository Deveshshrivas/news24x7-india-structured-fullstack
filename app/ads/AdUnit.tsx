'use client';
import {useEffect,useRef} from 'react';

export default function AdUnit({client,slot,placement}:{client:string;slot:string;placement:string}){
 const element=useRef<HTMLModElement>(null);
 
 useEffect(()=>{
  if(!element.current) return;
  const ins = element.current;
  
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && ins.offsetWidth > 0 && !ins.dataset.requested) {
      ins.dataset.requested = 'true';
      observer.disconnect();
      try {
        const w = window as any;
        (w.adsbygoogle = w.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }, { rootMargin: '200px' });
  
  observer.observe(ins);
  return () => observer.disconnect();
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
