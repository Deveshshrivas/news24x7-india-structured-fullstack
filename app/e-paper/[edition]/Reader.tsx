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

  const dateStr = paperDate(paper.date);
  const weekday = new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',weekday:'long'}).format(new Date(`${paper.date}T00:00:00+05:30`));

  return <main className="paperReader dailyPaper">
    {/* Top toolbar */}
    <header className="readerToolbar">
      <Link href="/e-paper">← सभी संस्करण</Link>
      <b>{dateStr}</b>
      <button disabled={printing} onClick={print}>{printing?'तैयार हो रहा है…':'PDF सहेजें / प्रिंट'}</button>
    </header>
    <p className="paperHelp">PDF के लिए प्रिंट विंडो में &quot;Save as PDF&quot; चुनें। सभी खबरों के सारांश शामिल हैं; पूरी खबर के लिए शीर्षक खोलें।</p>

    {/* Newspaper pages */}
    <section>{pages.map((stories,index)=>{
      const isFirst = index === 0;
      const lead = isFirst ? stories[0] : null;
      const rest = isFirst ? stories.slice(1) : stories;

      return <div className={`newspaperPage ${page===index?'currentSheet':''}`} key={index}>
        {/* Newspaper Masthead */}
        <div className="newsMasthead">
          <div className="mastheadTop">
            <span className="mastheadEdition">दैनिक संस्करण</span>
            <span className="mastheadDate">{weekday}, {dateStr}</span>
          </div>
          <div className="mastheadLogo">
            <BrandLogo/>
          </div>
          <div className="mastheadMeta">
            <span>पृष्ठ {index+1} / {pages.length}</span>
            <span>•</span>
            <span>कुल {paper.items.length} खबरें</span>
            <span>•</span>
            <span>दैनिक समाचार संकलन</span>
          </div>
        </div>

        {/* Lead story (only on first page) */}
        {lead && <div className="newsLead">
          <small className="newsCat">{lead.category}</small>
          <h1><Link href={`/news/${encodeURIComponent(lead.slug)}`}>{lead.title}</Link></h1>
          <div className="newsLeadContent">
            {lead.imageUrl && <img src={lead.imageUrl} alt="" loading={index===0?"eager":"lazy"}/>}
            <div>
              <p className="newsExcerpt">{lead.excerpt}</p>
              <div className="newsByline">
                <small>{lead.author}</small>
                <Link href={`/news/${encodeURIComponent(lead.slug)}`}>पूरी खबर पढ़ें →</Link>
              </div>
            </div>
          </div>
        </div>}

        {/* Other stories in columns */}
        {rest.length > 0 && <div className="newsColumns">
          {rest.map(story=><article key={story.id} className="newsStory">
            <small className="newsCat">{story.category}</small>
            <h2><Link href={`/news/${encodeURIComponent(story.slug)}`}>{story.title}</Link></h2>
            {story.imageUrl && <img src={story.imageUrl} alt="" loading="lazy"/>}
            <p className="newsExcerpt">{story.excerpt}</p>
            <div className="newsByline">
              <small>{story.author}</small>
              <Link href={`/news/${encodeURIComponent(story.slug)}`}>पूरी खबर पढ़ें →</Link>
            </div>
          </article>)}
        </div>}
      </div>;
    })}</section>

    {/* Page navigation */}
    <nav className="readerNav">
      <button disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ पिछला पृष्ठ</button>
      <span aria-live="polite">पृष्ठ {page+1} / {pages.length}</span>
      <button disabled={page===pages.length-1} onClick={()=>setPage(p=>p+1)}>अगला पृष्ठ ›</button>
    </nav>
  </main>;
}
