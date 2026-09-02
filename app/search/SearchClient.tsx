"use client";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {FormEvent, useEffect, useState} from "react";
import {demoNews, DemoArticle} from "../demo-news";

type Result=Pick<DemoArticle,"id"|"slug"|"category"|"title"|"excerpt">;

export default function SearchClient(){
  const params=useSearchParams();
  const router=useRouter();
  const initial=params.get("q")||"";
  const[q,setQ]=useState(initial);
  const[search,setSearch]=useState(initial);
  const[results,setResults]=useState<Result[]>([]);
  const[loading,setLoading]=useState(false);

  useEffect(()=>{
    const term=search.trim();
    let active=true;
    async function load(){
      if(!term){setResults([]);return;}
      setLoading(true);
      try{
        const response=await fetch(`/api/backend/articles?limit=50&q=${encodeURIComponent(term)}`);
        if(!response.ok)throw Error();
        const data=await response.json();
        if(active)setResults(data.items??[]);
      }catch{
        const normalized=term.toLocaleLowerCase("hi");
        if(active)setResults(demoNews.filter(x=>`${x.title} ${x.slug} ${x.excerpt} ${x.category}`.toLocaleLowerCase("hi").includes(normalized)));
      }finally{if(active)setLoading(false);}
    }
    void load();
    return()=>{active=false;};
  },[search]);

  function submit(event:FormEvent){event.preventDefault();const term=q.trim();setSearch(term);router.replace(term?`/search?q=${encodeURIComponent(term)}`:"/search",{scroll:false});}

  return <section className="searchPage"><span>समाचार खोजें</span><h1>आप क्या पढ़ना चाहते हैं?</h1><form className="searchInput" onSubmit={submit}><input autoFocus value={q} onChange={event=>setQ(event.target.value)} aria-label="समाचार खोजें" placeholder="शीर्षक, न्यूज़ स्लग, शहर या विषय…"/><button>खोजें</button></form>{search.trim()&&<div className="searchResults"><p>{loading?"खोज रहे हैं…":`${results.length} परिणाम मिले`}</p>{results.map((article,index)=><Link href={`/news/${article.slug}`} key={article.id}><b>{String(index+1).padStart(2,"0")}</b><div><small>{article.category}</small><h2>{article.title}</h2></div></Link>)}</div>}</section>;
}
