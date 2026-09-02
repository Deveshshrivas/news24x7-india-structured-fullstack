"use client";
import {PointerEvent,useEffect,useRef,useState} from "react";

type Story={title:string};
type Track={id:number;title:string;audioUrl:string};
type Point={x:number;y:number};

export default function HomeAudioHighlights({stories:_fallback}:{stories:Story[]}){
 const[tracks,setTracks]=useState<Track[]>([]);const[playing,setPlaying]=useState(false);const[index,setIndex]=useState(0);const[pos,setPos]=useState<Point>({x:20,y:520});
 const audio=useRef<HTMLAudioElement|null>(null);const drag=useRef({active:false,moved:false,dx:0,dy:0});
 useEffect(()=>{fetch("/api/backend/audio").then(r=>r.json()).then(d=>setTracks((d.items??[]).map((x:Track)=>({...x,audioUrl:`/api/backend${x.audioUrl}`})))).catch(()=>{});const saved=localStorage.getItem("news-audio-widget-position");if(saved){try{setPos(JSON.parse(saved))}catch{}}else setPos({x:Math.max(14,window.innerWidth-92),y:Math.max(90,window.innerHeight-110)});return()=>{audio.current?.pause()}},[]);
 function clamp(p:Point){return{x:Math.max(8,Math.min(window.innerWidth-80,p.x)),y:Math.max(8,Math.min(window.innerHeight-80,p.y))}}
 function down(e:PointerEvent){drag.current={active:true,moved:false,dx:e.clientX-pos.x,dy:e.clientY-pos.y};e.currentTarget.setPointerCapture(e.pointerId)}
 function move(e:PointerEvent){if(!drag.current.active)return;const next=clamp({x:e.clientX-drag.current.dx,y:e.clientY-drag.current.dy});if(Math.abs(next.x-pos.x)>2||Math.abs(next.y-pos.y)>2)drag.current.moved=true;setPos(next)}
 function up(e:PointerEvent){drag.current.active=false;e.currentTarget.releasePointerCapture(e.pointerId);localStorage.setItem("news-audio-widget-position",JSON.stringify(pos));setTimeout(()=>{drag.current.moved=false},0)}
 function play(i:number){if(!tracks.length)return;const next=Math.max(0,i);if(next>=tracks.length){stop();return}setIndex(next);audio.current?.pause();const player=new Audio(tracks[next].audioUrl);audio.current=player;player.onplay=()=>setPlaying(true);player.onended=()=>play(next+1);player.onerror=()=>{setPlaying(false);audio.current=null};player.play().catch(()=>setPlaying(false))}
 function stop(){audio.current?.pause();audio.current=null;setPlaying(false);setIndex(0)}
 function toggle(){playing?stop():play(index)}
 return <aside className={`floatingAudio collapsed ${playing?"isPlaying":""}`} style={{left:pos.x,top:pos.y}} aria-label="टॉप 10 न्यूज़ ऑडियो"><div className="audioDrag" onPointerDown={down} onPointerMove={move} onPointerUp={up} title="खींचकर स्थान बदलें"><i>⋮⋮</i><span>खींचें</span></div><button className="audioLogo" onClick={()=>{if(!drag.current.moved)toggle()}} disabled={!tracks.length} title={tracks.length?(playing?`रोकें: ${tracks[index]?.title}`:"टॉप 10 न्यूज़ सुनें"):"एडमिन ने अभी MP3 नहीं जोड़ा है"} aria-label={playing?"ऑडियो रोकें":"टॉप 10 न्यूज़ चलाएँ"} aria-pressed={playing}><b>24<span>×7</span></b><i>{playing?"■":"▶"}</i></button></aside>
}
