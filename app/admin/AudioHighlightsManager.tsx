"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {readApiResponse} from '../api-response';
type Item={id:string;title:string;filename:string;size:number;active:number;position:number;audioUrl:string};
export default function AudioHighlightsManager({notify}:{notify:(x:string)=>void}){
 const[items,setItems]=useState<Item[]>([]);const[uploading,setUploading]=useState(false);const[error,setError]=useState("");const preview=useRef<HTMLAudioElement|null>(null);
 async function load(){try{const d=await readApiResponse(await fetch("/api/backend/audio?admin=true",{cache:"no-store"}));setItems(d.items??[])}catch(e){setError(e instanceof Error?e.message:'Unable to load audio')}}
 useEffect(()=>{load();return()=>preview.current?.pause()},[]);
 async function add(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');const form=e.currentTarget,data=new FormData(form),file=data.get('audio');
  if(!(file instanceof File)||!file.size||!file.name.toLowerCase().endsWith('.mp3')){setError('Please select an MP3 file.');return}
  if(file.size>25*1024*1024){setError('MP3 must be 25 MB or smaller.');return}
  setUploading(true);
  try{await readApiResponse(await fetch('/api/backend/audio',{method:'POST',body:data}));form.reset();await load();notify('MP3 न्यूज़ अपलोड हुई')}
  catch(e){setError(e instanceof Error?e.message:'Upload failed. Please retry.')}
  finally{setUploading(false)}
 }
 async function patch(data:object){try{await readApiResponse(await fetch(`/api/backend/audio/${(data as {id:string}).id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(data)}));await load()}catch(e){setError(e instanceof Error?e.message:'Update failed')}}
 function play(x:Item){preview.current?.pause();const a=new Audio(`/api/backend${x.audioUrl}`);preview.current=a;a.play().catch(()=>setError('Audio could not be played.'))}
 async function remove(x:Item){if(!confirm(`“${x.title}” हटाएँ?`))return;try{await readApiResponse(await fetch(`/api/backend/audio/${x.id}`,{method:'DELETE'}));await load();notify('MP3 हटाई गई')}catch(e){setError(e instanceof Error?e.message:'Delete failed')}}
 return <section className="workspace"><div className="workspaceHead"><div><h2>न्यूज़ MP3 लाइब्रेरी</h2><p>जितनी चाहें MP3 रखें; क्रम में पहली 10 सक्रिय खबरें होमपेज पर चलेंगी</p></div><span className="liveCount">{items.filter(x=>x.active).length} सक्रिय / {items.length} कुल</span></div><div className="audioSettings"><strong>MP3 अपलोड पर कोई संख्या सीमा नहीं</strong><span>हर फाइल अधिकतम 25 MB • केवल MP3 • होमपेज प्लेलिस्ट: पहली 10 सक्रिय</span></div><form className="audioAddForm mp3Upload" onSubmit={add}><input required name="title" placeholder="न्यूज़ का शीर्षक"/><label className="audioFile">MP3 चुनें<input required name="audio" type="file" accept="audio/mpeg,.mp3"/></label><button className="primary" disabled={uploading}>{uploading?"अपलोड हो रहा है…":"＋ MP3 अपलोड करें"}</button>{error&&<p className="uploadError">{error}</p>}</form><div className="audioAdminList">{!items.length&&<div className="audioEmpty"><b>अभी कोई MP3 नहीं है</b><span>ऊपर से पहली न्यूज़ ऑडियो अपलोड करें।</span></div>}{items.map((x,i)=><article className={x.active?"":"disabledHighlight"} key={x.id}><b>{i+1}</b><div><span>{(x.size/1024/1024).toFixed(1)} MB • {x.filename}{x.active&&i<10?" • होमपेज टॉप 10":""}</span><h3>{x.title}</h3></div><div><button onClick={()=>play(x)}>▶ सुनें</button><button onClick={()=>patch({id:x.id,active:!x.active})}>{x.active?"निष्क्रिय करें":"सक्रिय करें"}</button><button disabled={i===0} onClick={()=>patch({id:x.id,direction:"up"})}>↑</button><button disabled={i===items.length-1} onClick={()=>patch({id:x.id,direction:"down"})}>↓</button><button onClick={()=>remove(x)}>हटाएँ</button></div></article>)}</div></section>
}
