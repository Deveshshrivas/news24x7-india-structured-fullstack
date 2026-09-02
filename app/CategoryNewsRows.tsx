"use client";
/* eslint-disable @next/next/no-img-element -- vinext currently fails to render next/image in this Cloudflare runtime */

import Link from "next/link";
import {useEffect,useState} from "react";
import {demoNews} from "./demo-news";

type Story={slug:string;category:string;title:string;excerpt:string;image:string;time:string};
type ApiStory={id:string;slug:string;category:string;title:string;excerpt:string;imageUrl?:string;publishedAt?:string;href?:string};

const primaryCategories=["देश-दुनिया","मध्य प्रदेश","राजनीति","अपराध","कारोबार","शिक्षा","खेल","मनोरंजन","लाइफस्टाइल"];
const showcaseCategories=primaryCategories;

export default function CategoryNewsRows({fallback}:{fallback:Story[]}){
  const[rows,setRows]=useState<Record<string,ApiStory[]>>({});

  useEffect(()=>{
    let cancelled=false;
    Promise.all(showcaseCategories.map(async category=>{
      try{
        const response=await fetch(`/api/backend/articles?category=${encodeURIComponent(category)}&limit=7`);
        if(!response.ok)throw Error();
        const data=await response.json();
        return[category,data.items??[]] as const;
      }catch{
        return[category,[]] as const;
      }
    })).then(result=>{if(!cancelled)setRows(Object.fromEntries(result))});
    return()=>{cancelled=true};
  },[]);

  const itemsFor=(category:string):ApiStory[]=>{
    const remote=rows[category]??[];
    const local=demoNews.filter(item=>item.category===category);
    const pageFallback=fallback.filter(item=>item.category===category||(category==="देश-दुनिया"&&item.category==="देश")).map((item,index)=>({id:`fallback-${category}-${index}`,slug:item.slug,category,title:item.title,excerpt:item.excerpt,imageUrl:item.image}));
    const combined=[...remote,...local,...pageFallback]
      .filter((item,index,items)=>items.findIndex(candidate=>candidate.slug===item.slug)===index);
    const supplementalTitles=["आज की चार महत्वपूर्ण खबरें","नया अपडेट और प्रमुख घटनाक्रम","विशेषज्ञों की राय और विस्तृत विश्लेषण","दिनभर की बड़ी खबरों पर एक नजर"];
    const supplemental:ApiStory[]=supplementalTitles.map((title,index)=>({id:`supplemental-${category}-${index}`,slug:"",category,title:`${category}: ${title}`,excerpt:"",href:`/latest?category=${encodeURIComponent(category)}`}));
    return [...combined,...supplemental].slice(0,7);
  };
  const storyHref=(item:ApiStory)=>item.href??`/news/${item.slug}`;
  return <>
    <section className="categoryShowcase">
      <div className="shell">
        <div className="categoryRowsIntro"><span>श्रेणीवार समाचार</span><h2>देश और प्रदेश की हर खबर</h2></div>
      </div>
    </section>
    <div className="categoryFeatureCollection">
      {primaryCategories.map((category,index)=>{
        const items=itemsFor(category);
        const lead=items[0];
        const imageStories=items.slice(1,3);
        const headlines=items.slice(3,7);
        if(!lead)return null;
        return <section id={`category-${index}`} className={`entertainmentShowcase categoryFeatureShowcase featureTone${index%2}`} key={category}>
          <div className="shell">
            <div className="entertainmentHead"><h2><i/>{category}</h2><Link href={`/latest?category=${encodeURIComponent(category)}`}>और भी <b>›</b></Link></div>
            <div className="categoryPanelContent">
              <Link className="entertainmentLead categoryPanelLead" href={storyHref(lead)}>{lead.imageUrl&&<img src={lead.imageUrl} alt={lead.title} loading="lazy" decoding="async"/>}<div><span>{category}</span><h3>{lead.title}</h3></div></Link>
              <div className="categoryPanelSubstories">{imageStories.map(item=><Link href={storyHref(item)} key={item.id}><div>{item.imageUrl?<img src={item.imageUrl} alt={item.title} loading="lazy" decoding="async"/>:<span>NEWS24×7</span>}</div><h3>{item.title}</h3></Link>)}</div>
              <div className="categoryPanelHeadlines">{headlines.map((item,headlineIndex)=><Link href={storyHref(item)} key={item.id}><span className="headlineNumber">{String(headlineIndex+1).padStart(2,"0")}</span><span>{item.title}</span><b>›</b></Link>)}</div>
            </div>
          </div>
        </section>;
      })}
    </div>
  </>;
}
