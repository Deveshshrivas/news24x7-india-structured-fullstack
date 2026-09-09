"use client";
import {useEffect,useState} from "react";
export default function ThemeToggle(){
 const[dark,setDark]=useState(false);
 useEffect(()=>{
  const sync=()=>setDark(document.documentElement.dataset.theme==="dark");
  sync();const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return()=>observer.disconnect();
 },[]);
 function toggle(){
  const next=document.documentElement.dataset.theme!=="dark";
  document.documentElement.dataset.theme=next?"dark":"light";setDark(next);
  try{localStorage.setItem("news-theme",next?"dark":"light")}catch{}
 }
 return <button className="themeToggle" onClick={toggle} aria-label={dark?"लाइट मोड चालू करें":"डार्क मोड चालू करें"} title={dark?"लाइट मोड":"डार्क मोड"}><span>{dark?"☀":"☾"}</span><b>{dark?"लाइट":"डार्क"}</b></button>;
}
