'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
export default function SiteAppearance(){
 const pathname=usePathname();
 useEffect(()=>{
  const controller=new AbortController();
  async function refresh(){
   if(pathname.startsWith('/admin')){delete document.documentElement.dataset.siteManaged;delete document.documentElement.dataset.sitePalette;return}
   try{
    const r=await fetch('/api/backend/appearance',{cache:'no-store',signal:controller.signal});if(!r.ok)return;
    const data=await r.json();if(controller.signal.aborted||!['light','black','charcoal','warm'].includes(data.theme))return;
    const root=document.documentElement;
    root.dataset.sitePalette=data.theme==='light'?(['black','charcoal','warm'].includes(data.darkPalette)?data.darkPalette:'black'):data.theme;
    root.dataset.siteManaged='true';
    let preference:string|null=null;try{preference=localStorage.getItem('news-theme')}catch{}
    root.dataset.theme=preference==='light'||preference==='dark'?preference:data.theme==='light'?'light':'dark';
   }catch{}
  }
  void refresh();const timer=setInterval(()=>void refresh(),30000);
  window.addEventListener('focus',refresh);window.addEventListener('site-appearance-changed',refresh);
  return()=>{controller.abort();clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('site-appearance-changed',refresh)};
 },[pathname]);return null;
}
