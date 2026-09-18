'use client';
import {useEffect} from 'react';
export default function ReadingTracker({articleId}:{articleId:string}){
 useEffect(()=>{
  if(!/^[a-f0-9]{24}$/.test(articleId))return;
  const session=crypto.randomUUID();let visibleSeconds=0,lastActivity=Date.now(),lastTick=Date.now();
  const activity=()=>{lastActivity=Date.now()};
  const send=()=>{void fetch('/api/backend/engagement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({articleId,session}),keepalive:true}).catch(()=>{})};
  send();
  const timer=setInterval(()=>{
   const now=Date.now(),elapsed=Math.min(2,(now-lastTick)/1000);lastTick=now;
   if(document.visibilityState==='visible'&&document.hasFocus()&&now-lastActivity<90000)visibleSeconds+=elapsed;
   if(visibleSeconds>=30){visibleSeconds-=30;send()}
  },1000);
  for(const event of ['pointerdown','pointermove','scroll','keydown'])window.addEventListener(event,activity,{passive:true});
  return()=>{clearInterval(timer);for(const event of ['pointerdown','pointermove','scroll','keydown'])window.removeEventListener(event,activity)};
 },[articleId]);
 return null;
}
