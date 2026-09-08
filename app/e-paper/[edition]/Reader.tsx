'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {useState} from 'react';
import BrandLogo from '../../BrandLogo';
import {paperDate,type Paper} from '../data';
export default function Reader({paper}:{paper:Paper}){
  const [page,setPage]=useState(0);
  const [printing,setPrinting]=useState(false);
  const pages=Array.from({length:Math.ceil(paper.items.length/4)},(_,i)=>paper.items.slice(i*4,i*4+4));
  async function print(){
    setPrinting(true);
    try{
      await document.fonts.ready;
      await Promise.race([Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('.dailyPaper img')).map(img=>img.decode().catch(()=>{}))),new Promise(resolve=>setTimeout(resolve,5000))]);
      window.print();
    }finally{setPrinting(false)}
  }
  return <main className="paperReader dailyPaper"><header><Link href="/e-paper">← सभी संस्करण</Link><b>{paperDate(paper.date)}</b><button disabled={printing} onClick={print}>{printing?'तैयार हो रहा है…':'PDF सहेजें / प्रिंट'}</button></header>
    <p className="paperHelp">PDF के लिए प्रिंट विंडो में “Save as PDF” चुनें। सभी खबरों के सारांश शामिल हैं; पूरी खबर के लिए शीर्षक खोलें।</p>
    <section>{pages.map((stories,index)=><div className={`paperPage dailySheet ${page===index?'currentSheet':''}`} key={index}>
      <div className="paperMast"><BrandLogo/><small>{paperDate(paper.date)} • दैनिक समाचार संकलन • {index+1} / {pages.length}</small></div>
      <div className="dailyStories">{stories.map(story=><article key={story.id}><small>{story.category}</small><h2><Link href={`/news/${encodeURIComponent(story.slug)}`}>{story.title}</Link></h2>{story.imageUrl&&<img src={story.imageUrl} alt=""/>}<p>{story.excerpt}</p><small>{story.author}</small><p><Link href={`/news/${encodeURIComponent(story.slug)}`}>पूरी खबर पढ़ें →</Link></p></article>)}</div>
    </div>)}<nav><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ पिछला</button><span aria-live="polite">पृष्ठ {page+1} / {pages.length}</span><button disabled={page===pages.length-1} onClick={()=>setPage(p=>p+1)}>अगला ›</button></nav></section>
  </main>;
}
