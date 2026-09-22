'use client';
import {useEffect,useRef,useState} from 'react';
type AdWindow=Window&{adsbygoogle?:object[]};
let loader:Promise<void>|undefined;
function load(client:string){
 return loader??=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';
  script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  script.onload=()=>resolve();script.onerror=()=>{loader=undefined;script.remove();reject(Error('Ad service unavailable'))};document.head.append(script);
 });
}
export default function AdUnit({client,slot,placement}:{client:string;slot:string;placement:string}){
 const element=useRef<HTMLModElement>(null),requested=useRef(false);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  const observer=new IntersectionObserver(entries=>{
   if(!entries.some(e=>e.isIntersecting)||requested.current)return;
   requested.current=true;observer.disconnect();
   void load(client).then(()=>{if(!cancelled&&element.current&&element.current.getBoundingClientRect().width>0&&!element.current.dataset.requested){element.current.dataset.requested='true';const w=window as AdWindow;(w.adsbygoogle??=[]).push({})}}).catch(()=>{if(!cancelled)setFailed(true)});
  },{rootMargin:'200px'});
  if(element.current)observer.observe(element.current);
  return()=>{cancelled=true;observer.disconnect();requested.current=false};
 },[client,slot]);
 if(failed)return null;
 return <aside className={`siteAd siteAd-${placement}`} aria-label="Advertisement"><span>Advertisement · विज्ञापन</span><ins ref={element} className="adsbygoogle" style={{display:'block', overflow: 'hidden'}} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true"/></aside>;
}
