'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {SeoArticleSummary} from './seo-data';
export default function PopularSlideshow({articles}:{articles:SeoArticleSummary[]}){
 const [index,setIndex]=useState(0);
 const count=articles.length;
 useEffect(()=>{
  if(count<2)return;
  const timer=setInterval(()=>{if(document.visibilityState==='visible')setIndex(i=>(i+1)%count)},8000);
  return()=>clearInterval(timer);
 },[count]);
 if(!count)return <p className="shell">अभी समाचार उपलब्ध नहीं हैं।</p>;
 const current=articles[index%count];
 // using real img tags instead of background
 return <section className="shell popularShow" aria-label="लोकप्रिय समाचार स्लाइडशो" aria-roledescription="carousel">
  <div className="leadgrid">
   <Link className="hero" href={`/news/${current.slug}`} style={{position:'relative',overflow:'hidden'}}>
    <img src={current.imageUrl||'/icon.png'} alt={current.title} fetchPriority="high" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',zIndex:-2}}/>
    <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'linear-gradient(0deg,rgba(0,0,0,.93),rgba(0,0,0,.08))',zIndex:-1}}/>
    <div style={{position:'relative',zIndex:1}}><span className="tag">{current.category}</span><h1>{current.title}</h1><p>{current.excerpt}</p><small>{current.author||'NEWS24x7 INDIA'}</small></div></Link>
   <div className="sidelead">{Array.from({length:Math.min(2,count-1)},(_,offset)=>articles[(index+offset+1)%count]).map(a=><Link key={a.id} className="overlaycard" href={`/news/${a.slug}`} style={{position:'relative',overflow:'hidden'}}>
    <img src={a.imageUrl||'/icon.png'} alt={a.title} loading="lazy" decoding="async" style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',zIndex:-2}}/>
    <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'linear-gradient(0deg,rgba(0,0,0,.93),rgba(0,0,0,.08))',zIndex:-1}}/>
    <div style={{position:'relative',zIndex:1}}><span className="tag">{a.category}</span><h2>{a.title}</h2><small>लोकप्रिय समाचार</small></div></Link>)}</div>
  </div>
 </section>;
}
