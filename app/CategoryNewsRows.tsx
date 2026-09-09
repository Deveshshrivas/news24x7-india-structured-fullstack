"use client";
/* eslint-disable @next/next/no-img-element -- vinext currently fails to render next/image in this Cloudflare runtime */

import Link from "next/link";
import {useEffect,useState} from "react";

type ApiStory={id:string;slug:string;category:string;title:string;excerpt:string;imageUrl?:string};
type CategoryRow={category:{id:string;name:string};articles:ApiStory[]};

export default function CategoryNewsRows(){
  const[rows,setRows]=useState<CategoryRow[]>([]);
  const[query,setQuery]=useState('');
  const[visible,setVisible]=useState(6);
  const[status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/backend/categories/news',{cache:'no-store',signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error('Unavailable');return response.json();})
      .then(data=>{setRows(data.items??[]);setStatus('ready');})
      .catch(()=>{if(!controller.signal.aborted)setStatus('error');});
    return()=>controller.abort();
  },[]);
  const storyHref=(item:ApiStory)=>`/news/${encodeURIComponent(item.slug)}`;
  const filtered=rows.filter(row=>row.category.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <>
    <section className="categoryShowcase"><div className="shell"><div className="categoryRowsIntro"><div><span>अपनी पसंद की खबरें</span><h2>श्रेणीवार समाचार</h2></div><label className="categoryFinder"><span>श्रेणी खोजें</span><input type="search" placeholder="शहर या श्रेणी का नाम…" value={query} onChange={event=>{setQuery(event.target.value);setVisible(6)}}/></label></div></div></section>
    <div className="categoryFeatureCollection">
      {status==='loading'&&<p role="status">समाचार लोड हो रहे हैं…</p>}
      {status==='error'&&<p role="alert">समाचार लोड नहीं हो सके। कृपया पेज दोबारा खोलें।</p>}
      {status==='ready'&&rows.length===0&&<p>अभी कोई प्रकाशित समाचार उपलब्ध नहीं है।</p>}
      {status==='ready'&&rows.length>0&&filtered.length===0&&<p role="status">इस नाम की श्रेणी नहीं मिली।</p>}
      {filtered.slice(0,visible).map((row,index)=>{
        const category=row.category.name;
        const [lead,...rest]=row.articles;
        if(!lead)return null;
        return <section id={`category-${index}`} className={`entertainmentShowcase categoryFeatureShowcase featureTone${index%2}`} key={row.category.id}>
          <div className="shell">
            <div className="entertainmentHead"><h2><i/>{category}</h2><Link href={`/latest?category=${encodeURIComponent(category)}`}>और भी <b>›</b></Link></div>
            <div className="categoryPanelContent">
              <Link className="entertainmentLead categoryPanelLead" href={storyHref(lead)}>{lead.imageUrl&&<img src={lead.imageUrl} alt={lead.title} loading="lazy" decoding="async"/>}<div><span>{category}</span><h3>{lead.title}</h3></div></Link>
              <div className="categoryPanelSubstories">{rest.slice(0,2).map(item=><Link href={storyHref(item)} key={item.id}><div>{item.imageUrl?<img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"/>:<span>NEWS24×7</span>}</div><h3>{item.title}</h3></Link>)}</div>
              <div className="categoryPanelHeadlines">{rest.slice(2,6).map((item,headlineIndex)=><Link href={storyHref(item)} key={item.id}><span className="headlineNumber">{String(headlineIndex+1).padStart(2,"0")}</span><span>{item.title}</span><b>›</b></Link>)}</div>
            </div>
          </div>
        </section>;
      })}
    </div>
    {filtered.length>visible&&<div className="categoryLoadMore"><button onClick={()=>setVisible(count=>count+6)}>और श्रेणियाँ देखें <span>({filtered.length-visible}) ↓</span></button></div>}
  </>;
}
