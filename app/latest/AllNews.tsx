"use client";
import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {FormEvent, useEffect, useState} from "react";
import {demoNews} from "../demo-news";

type Article={id:string;title:string;slug:string;excerpt:string;category:string;imageUrl?:string;author:string;publishedAt?:string};

export default function AllNews(){
  const params=useSearchParams();
  const router=useRouter();
  const initialQuery=params.get("q")||"";
  const[items,setItems]=useState<Article[]>([]);
  const[categories,setCategories]=useState<string[]>([]);
  const[category,setCategory]=useState(params.get("category")||"");
  const[query,setQuery]=useState(initialQuery);
  const[search,setSearch]=useState(initialQuery);
  const[page,setPage]=useState(1);
  const[pages,setPages]=useState(1);
  const[total,setTotal]=useState(0);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    let active=true;
    const p=new URLSearchParams({page:String(page),limit:"12"});
    if(category)p.set("category",category);
    if(search)p.set("q",search);
    const fallback=()=>{
      const q=search.toLocaleLowerCase("hi");
      const filtered=demoNews.filter(x=>(!category||x.category===category)&&(!q||`${x.title} ${x.slug} ${x.excerpt} ${x.category}`.toLocaleLowerCase("hi").includes(q)));
      setItems(filtered.slice((page-1)*12,page*12));
      setCategories([...new Set(demoNews.map(x=>x.category))]);
      setPages(Math.max(1,Math.ceil(filtered.length/12)));
      setTotal(filtered.length);
    };
    async function load(){
      setLoading(true);
      try{
        const response=await fetch(`/api/backend/articles?${p}`);
        if(!response.ok)throw Error();
        const data=await response.json();
        if(!active)return;
        if(!data.items?.length){fallback();return;}
        setItems(data.items);setCategories(data.categories??[]);setPages(data.pages??1);setTotal(data.total??0);
      }catch{if(active)fallback();}
      finally{if(active)setLoading(false);}
    }
    void load();
    return()=>{active=false;};
  },[page,category,search]);

  function updateUrl(nextSearch:string,nextCategory=category){
    const p=new URLSearchParams();if(nextSearch)p.set("q",nextSearch);if(nextCategory)p.set("category",nextCategory);
    router.replace(p.size?`/latest?${p}`:"/latest",{scroll:false});
  }
  function submit(e:FormEvent){e.preventDefault();const value=query.trim();setPage(1);setSearch(value);updateUrl(value);}
  function changeCategory(value:string){setCategory(value);setPage(1);updateUrl(search,value);}

  return <section className="allNews"><div className="allNewsTitle"><span>पूरा न्यूज़ संग्रह</span><h1>सभी समाचार</h1><p>{total} प्रकाशित खबरें उपलब्ध हैं</p></div><form className="newsFilters" onSubmit={submit}><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="समाचार खोजें" placeholder="शीर्षक, न्यूज़ स्लग या विषय खोजें…"/><button>खोजें</button><select value={category} onChange={e=>changeCategory(e.target.value)} aria-label="श्रेणी चुनें"><option value="">सभी श्रेणियाँ</option>{categories.map(x=><option key={x}>{x}</option>)}</select></form>{loading?<div className="newsLoading">खबरें लोड हो रही हैं…</div>:!items.length?<div className="newsLoading">कोई खबर नहीं मिली।</div>:<div className="allNewsGrid">{items.map(x=><Link href={`/news/${x.slug}`} key={x.id} className="newsArchiveCard">{x.imageUrl?<img src={x.imageUrl} alt={x.title}/>:<div className="newsPlaceholder">NEWS<br/><b>24×7</b></div>}<div><span>{x.category}</span><h2>{x.title}</h2><p>{x.excerpt}</p><small>{x.author}{x.publishedAt?` • ${new Date(x.publishedAt).toLocaleDateString("hi-IN")}`:""}</small></div></Link>)}</div>}<nav className="newsPagination" aria-label="पृष्ठ बदलें"><button disabled={page===1} onClick={()=>setPage(x=>x-1)}>← पिछला</button><b>पृष्ठ {page} / {pages}</b><button disabled={page>=pages} onClick={()=>setPage(x=>x+1)}>अगला →</button></nav></section>;
}
