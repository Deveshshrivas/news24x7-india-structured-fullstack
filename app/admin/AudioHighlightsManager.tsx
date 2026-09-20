"use client";
import {FormEvent,useEffect,useRef,useState,useCallback} from "react";
import {readApiResponse} from '../api-response';
type Item={id:string;title:string;filename:string;size:number;active:number;position:number;audioUrl:string};
export default function AudioHighlightsManager({notify, language}:{notify:(x:string)=>void; language: "hi" | "en"}){
 const text = useCallback((hi: string, en: string) => language === "en" ? en : hi, [language]);
 const[items,setItems]=useState<Item[]>([]);const[uploading,setUploading]=useState(false);const[error,setError]=useState("");const preview=useRef<HTMLAudioElement|null>(null); const [playingId, setPlayingId] = useState<string | null>(null);
 async function load(){try{const d=await readApiResponse(await fetch("/api/backend/audio?admin=true",{cache:"no-store"}));setItems(d.items??[])}catch(e){setError(e instanceof Error?e.message:'Unable to load audio')}}
 useEffect(()=>{load();return()=>preview.current?.pause()},[]);
 async function add(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError('');const form=e.currentTarget,data=new FormData(form),file=data.get('audio');
  if(!(file instanceof File)||!file.size||!(/\.(mp3|wav|ogg|aac|m4a|wma|flac|webm)$/i.test(file.name))){setError(text('कृपया एक ऑडियो फ़ाइल चुनें (MP3, WAV, OGG, AAC, M4A, FLAC)', 'Please select an audio file (MP3, WAV, OGG, AAC, M4A, FLAC)'));return}
  if(file.size>25*1024*1024){setError(text('ऑडियो 25 MB या उससे छोटा होना चाहिए।', 'Audio must be 25 MB or smaller.'));return}
  setUploading(true);
  try{await readApiResponse(await fetch('/api/backend/audio',{method:'POST',body:data}));form.reset();await load();notify(text('ऑडियो न्यूज़ अपलोड हुई', 'Audio news uploaded'))}
  catch(e){setError(e instanceof Error?e.message:'Upload failed. Please retry.')}
  finally{setUploading(false)}
 }
 async function patch(data:object){try{await readApiResponse(await fetch(`/api/backend/audio/${(data as {id:string}).id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(data)}));await load()}catch(e){setError(e instanceof Error?e.message:'Update failed')}}
 
   function play(x:Item){
     if (playingId === x.id && preview.current) {
       preview.current.pause();
       setPlayingId(null);
       return;
     }
     if (preview.current) {
       preview.current.pause();
     }
     const a = new Audio(`/api/backend${x.audioUrl}`);
     preview.current = a;
     
     a.onended = () => {
       setPlayingId(null);
     };

     setPlayingId(x.id);
     a.play().catch(() => {
       setPlayingId(null);
       setError(text('ऑडियो नहीं चलाया जा सका', 'Audio could not be played.'));
     });
   }

 async function remove(x:Item){if(!confirm(text(`“${x.title}” हटाएँ?`, `Remove “${x.title}”?`)))return;try{await readApiResponse(await fetch(`/api/backend/audio/${x.id}`,{method:'DELETE'}));await load();notify(text('ऑडियो हटाई गई', 'Audio removed'))}catch(e){setError(e instanceof Error?e.message:'Delete failed')}}
 return <section className="workspace"><div className="workspaceHead"><div><h2>{text("न्यूज़ ऑडियो लाइब्रेरी", "News Audio Library")}</h2><p>{text("जितनी चाहें ऑडियो रखें; क्रम में पहली 10 सक्रिय खबरें होमपेज पर चलेंगी", "Keep as many audio files as you want; the top 10 active news in order will play on the homepage")}</p></div><span className="liveCount">{text(`${items.filter(x=>x.active).length} सक्रिय / ${items.length} कुल`, `${items.filter(x=>x.active).length} active / ${items.length} total`)}</span></div><div className="audioSettings"><strong>{text("ऑडियो अपलोड पर कोई संख्या सीमा नहीं", "No limit on audio uploads")}</strong><span>{text("हर फाइल अधिकतम 25 MB • MP3, WAV, OGG, AAC, M4A, FLAC • होमपेज प्लेलिस्ट: पहली 10 सक्रिय", "Each file max 25 MB • MP3, WAV, OGG, AAC, M4A, FLAC • Homepage playlist: top 10 active")}</span></div><form className="audioAddForm mp3Upload" onSubmit={add}><input required name="title" placeholder={text("न्यूज़ का शीर्षक", "News title")}/><label className="audioFile">{text("ऑडियो चुनें", "Select Audio")}<input required name="audio" type="file" accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a,.wma,.flac,.webm"/></label><button className="primary" disabled={uploading}>{uploading?text("अपलोड हो रहा है…", "Uploading..."):text("＋ ऑडियो अपलोड करें", "＋ Upload Audio")}</button>{error&&<p className="uploadError">{error}</p>}</form><div className="audioAdminList">{!items.length&&<div className="audioEmpty"><b>{text("अभी कोई ऑडियो नहीं है", "No audio files yet")}</b><span>{text("ऊपर से पहली न्यूज़ ऑडियो अपलोड करें।", "Upload your first news audio from above.")}</span></div>}{items.map((x,i)=><article className={x.active?"":"disabledHighlight"} key={x.id}><b>{i+1}</b><div><span>{(x.size/1024/1024).toFixed(1)} MB • {x.filename}{x.active&&i<10?text(" • होमपेज टॉप 10", " • Homepage Top 10"):""}</span><h3>{x.title}</h3></div><div><button onClick={()=>play(x)}>{playingId === x.id ? "⏸ " + text("रोकें", "Pause") : "▶ " + text("सुनें", "Listen")}</button><button onClick={()=>patch({id:x.id,active:!x.active})}>{x.active?text("निष्क्रिय करें", "Deactivate"):text("सक्रिय करें", "Activate")}</button><button disabled={i===0} onClick={()=>patch({id:x.id,direction:"up"})}>↑</button><button disabled={i===items.length-1} onClick={()=>patch({id:x.id,direction:"down"})}>↓</button><button onClick={()=>remove(x)}>{text("हटाएँ", "Remove")}</button></div></article>)}</div></section>
}
