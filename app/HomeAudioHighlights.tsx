"use client";
import {PointerEvent,useEffect,useRef,useState} from "react";

type Story={title:string};
type Track={id:string;title:string;audioUrl:string};
type Point={x:number;y:number};

export default function HomeAudioHighlights({stories:_fallback}:{stories:Story[]}){
 const[tracks,setTracks]=useState<Track[]>([]);
 const[playing,setPlaying]=useState(false);
 const[loading,setLoading]=useState(false);
 const[index,setIndex]=useState(0);
 const[pos,setPos]=useState<Point>({x:20,y:520});
 const audio=useRef<HTMLAudioElement|null>(null);
 const drag=useRef({active:false,moved:false,pointerId:-1,startX:0,startY:0,dx:0,dy:0,position:{x:0,y:0}});

 useEffect(()=>{
   const initial={x:Math.max(8,window.innerWidth-92),y:Math.max(24,window.innerHeight-185)};
   let savedPosition=initial;
   try{
     const raw=localStorage.getItem("news-audio-widget-position");
     if(raw){const saved=JSON.parse(raw);if(Number.isFinite(saved.x)&&Number.isFinite(saved.y))savedPosition=saved}
   }catch{}
   setPos(clamp(savedPosition));
   const resize=()=>setPos(current=>clamp(current));
   window.addEventListener("resize",resize);
   return()=>{window.removeEventListener("resize",resize);audio.current?.pause()};
 },[]);

 function clamp(p:Point){return{x:Math.max(8,Math.min(window.innerWidth-80,p.x)),y:Math.max(24,Math.min(window.innerHeight-175,p.y))}}
 function down(e:PointerEvent){
   if(!e.isPrimary||e.button!==0||drag.current.active)return;
   drag.current={active:true,moved:false,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,dx:e.clientX-pos.x,dy:e.clientY-pos.y,position:pos};
   e.currentTarget.setPointerCapture(e.pointerId);
 }
 function move(e:PointerEvent){
   const current=drag.current;
   if(!current.active||current.pointerId!==e.pointerId)return;
   if(Math.hypot(e.clientX-current.startX,e.clientY-current.startY)>6)current.moved=true;
   if(!current.moved)return;
   current.position=clamp({x:e.clientX-current.dx,y:e.clientY-current.dy});
   setPos(current.position);
 }
 function up(e:PointerEvent){
   if(!drag.current.active||drag.current.pointerId!==e.pointerId)return;
   drag.current.active=false;
   if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
   if(drag.current.moved)try{localStorage.setItem("news-audio-widget-position",JSON.stringify(drag.current.position))}catch{}
 }
 function cancel(e:PointerEvent){if(drag.current.pointerId===e.pointerId){drag.current.active=false;drag.current.moved=true}}

 function playList(list:Track[], i:number){
   if(!list.length)return;
   const next=Math.max(0,i);
   if(next>=list.length){stop();return;}
   setIndex(next);
   audio.current?.pause();
   const player=new Audio(list[next].audioUrl);
   audio.current=player;
   player.onplay=()=>setPlaying(true);
   player.onended=()=>playList(list, next+1);
   player.onerror=()=>{setPlaying(false);audio.current=null};
   player.play().catch(()=>setPlaying(false));
 }

 function stop(){audio.current?.pause();audio.current=null;setPlaying(false);setIndex(0)}

 async function toggle(){
   if(playing){stop();return;}
   if(loading)return;
   
   let currentList = tracks;
   if(!currentList.length){
     setLoading(true);
     try{
       const response=await fetch("/api/backend/audio",{cache:"no-store"});
       if(!response.ok)throw new Error();
       const data=await response.json();
       currentList=(data.items??[]).map((x:Track)=>({...x,audioUrl:`/api/backend${x.audioUrl}`}));
       setTracks(currentList);
       if(!currentList.length) {
         alert("अभी कोई ऑडियो उपलब्ध नहीं है।");
         setLoading(false);
         return;
       }
     }catch{
       alert("ऑडियो लोड नहीं हो सका।");
       setLoading(false);
       return;
     }
     setLoading(false);
   }
   playList(currentList, index);
 }

 return <aside className={`floatingAudio collapsed ${playing?"isPlaying":""}`} style={{left:pos.x,top:pos.y}} aria-label="टॉप 10 न्यूज़ ऑडियो">
   <div className="audioDrag" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={e=>{if(drag.current.active)cancel(e)}} title="खींचकर स्थान बदलें"><i>⋮⋮</i><span>खींचें</span></div>
   <button className="audioLogo" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={e=>{if(drag.current.active)cancel(e)}} onClick={e=>{if(e.detail===0||!drag.current.moved)toggle()}} title={tracks.length?(playing?`रोकें: ${tracks[index]?.title}`:"क्लिक करें: ऑडियो सुनें • खींचें: स्थान बदलें"):(loading?"लोड हो रहा है...":"क्लिक करें: ऑडियो सुनें • खींचें: स्थान बदलें")} aria-label={playing?"ऑडियो रोकें":"टॉप 10 न्यूज़ चलाएँ"} aria-pressed={playing}>
     <b>24<span>×7</span></b><i>{loading?"...":playing?"■":"▶"}</i>
   </button>
 </aside>
}
