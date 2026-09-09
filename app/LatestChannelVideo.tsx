'use client';
import {useEffect,useState} from 'react';
export const youtubeChannelUrl='https://www.youtube.com/c/news24x7india/videos';
type Video={id:string;title:string;publishedAt:string};
export default function LatestChannelVideo(){
  const [video,setVideo]=useState<Video|null>(null);
  const [loading,setLoading]=useState(true);
  const [stale,setStale]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    async function refresh(){
      try{
        const response=await fetch('/api/backend/youtube/latest',{cache:'no-store',signal:controller.signal});
        if(!response.ok)throw new Error('Unavailable');
        const data=await response.json();
        setVideo(data.video);setStale(Boolean(data.stale));
      }catch{if(!controller.signal.aborted)setStale(true)}
      finally{if(!controller.signal.aborted)setLoading(false)}
    }
    void refresh();const timer=setInterval(()=>void refresh(),600000);
    return()=>{controller.abort();clearInterval(timer)};
  },[]);
  return <section className="shell homeChannelVideo" aria-labelledby="channel-video-title"><div className="sectionhead"><div><span>NEWS24x7 INDIA • YOUTUBE</span><h2 id="channel-video-title">हमारे चैनल का नया वीडियो</h2></div><a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">सभी वीडियो देखें ↗</a></div>
    {video?<div className="channelVideoGrid"><iframe key={video.id} src={`https://www.youtube-nocookie.com/embed/${video.id}`} title={video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><div className="channelVideoCopy"><span>वीडियो बुलेटिन</span><h3>{video.title}</h3><p>{new Date(video.publishedAt).toLocaleDateString('hi-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'long',year:'numeric'})}</p>{stale&&<p role="status">नया अपडेट उपलब्ध नहीं है। पिछला प्राप्त वीडियो दिखाया गया है।</p>}<a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">YouTube पर देखें ↗</a></div></div>:<p role="status">{loading?'वीडियो लोड हो रहा है…':'वीडियो अभी लोड नहीं हो सका। ऊपर दिए लिंक से चैनल खोलें।'}</p>}
  </section>;
}
