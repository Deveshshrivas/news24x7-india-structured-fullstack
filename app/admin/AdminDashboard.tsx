"use client";
import BrandLogo from "../BrandLogo";
import AppearanceSettings from "./AppearanceSettings";
import ProfileSettings from "./ProfileSettings";
import GlobalContentManager from "./GlobalContentManager";

import {FormEvent,useEffect,useState,useSyncExternalStore} from "react";
import Link from "next/link";
import BreakingManager from "./BreakingManager";
import TeamManager from "./TeamManager";
import AudioHighlightsManager from "./AudioHighlightsManager";
import NewsManager from "./NewsManager";
import CategoryManager from "./CategoryManager";
import ReporterManager from "./ReporterManager";
import MediaLibraryManager from "./MediaLibraryManager";
import AdManager from "./AdManager";
type Props={user:{name:string,email:string};roleLabel:string;allowed:string[];signout:string};
export type AdminLanguage="hi"|"en";
type DashboardStats={totalViews:number;publishedStories:number;draftStories:number;reviewStories:number;totalReporters:number;activeReporters:number};
const ADMIN_LANGUAGE_KEY="news24x7-admin-language";

const Icons = {
  "डैशबोर्ड": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  "समाचार": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  "नई पोस्ट": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  "श्रेणियाँ": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>,
  "रिपोर्टर": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  "ब्रेकिंग न्यूज़": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  "ऑडियो हाइलाइट्स": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  "विज्ञापन": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155 7.587-3.94-.694m-.025-.138L6.2 5.094l-3.94-.693"/></svg>,
  "मीडिया लाइब्रेरी": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  "टिप्पणियाँ": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  "टीम और भूमिकाएँ": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  "सेटिंग्स": <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
};
const nav=["डैशबोर्ड","समाचार","नई पोस्ट","श्रेणियाँ","रिपोर्टर","ब्रेकिंग न्यूज़","ऑडियो हाइलाइट्स","विज्ञापन","मीडिया लाइब्रेरी","टीम और भूमिकाएँ","वेबसाइट कंटेंट"];
const englishLabels:Record<string,string>={"डैशबोर्ड":"Dashboard","समाचार":"News","नई पोस्ट":"New post","श्रेणियाँ":"Categories","रिपोर्टर":"Reporters","ब्रेकिंग न्यूज़":"Breaking news","ऑडियो हाइलाइट्स":"Audio highlights","विज्ञापन":"Advertising","मीडिया लाइब्रेरी":"Media library","टीम और भूमिकाएँ":"Team and roles","सेटिंग्स":"Settings", "वेबसाइट कंटेंट":"Website Content", "सुपर एडमिन":"Super admin","एडमिन":"Admin","मुख्य संपादक":"Editor in chief","विज्ञापन प्रबंधक":"Ad manager"};
function localize(language:AdminLanguage,hindi:string,english?:string){return language==="en"?(english??englishLabels[hindi]??hindi):hindi}
function subscribeLanguage(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener("admin-language-change",callback);return()=>{window.removeEventListener("storage",callback);window.removeEventListener("admin-language-change",callback)}}
function getLanguageSnapshot():AdminLanguage{return window.localStorage.getItem(ADMIN_LANGUAGE_KEY)==="en"?"en":"hi"}
const baseArticles:{title:string;category:string;author:string;status:string;views:string;date:string}[]=[];
export default function AdminDashboard({user,roleLabel,allowed,signout}:Props){const[tab,setTab]=useState("डैशबोर्ड");
  const [notifications, setNotifications] = useState<{message: string, actionUrl?: string, timestamp: string}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const[articles,setArticles]=useState(baseArticles); const [editArticleItem, setEditArticleItem] = useState<any>(null); const [rawArticles, setRawArticles] = useState<any[]>([]);
  useEffect(() => {
    const handleOpen = (e: any) => { window.open("/news/" + rawArticles[e.detail].slug, "_blank"); };
    window.addEventListener("open-article", handleOpen);
    return () => window.removeEventListener("open-article", handleOpen);
  }, [rawArticles]);
  useEffect(() => {
    let es: EventSource | undefined;
    try {
      es = new EventSource("/api/backend/notifications/stream");
      es.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') return;
        
        setNotifications(prev => [data, ...prev].slice(0, 50));
        setUnreadCount(c => c + 1);
        setToast(data);
        setTimeout(() => setToast(null), 3500);
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            const n = new Notification("News24x7 India", { body: data.message });
            if (data.actionUrl) n.onclick = () => window.open(data.actionUrl, "_blank");
          }
        
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          }
        } catch(e) {}
      };
    } catch(err) {}
    return () => es && es.close();
  }, []);

  useEffect(() => {
    fetch("/api/backend/articles?limit=10", {cache: "no-store"})
      .then(r => r.json())
      .then(d => {
        if(d && d.items) { setRawArticles(d.items);
          setArticles(d.items.map((x: any) => ({
            title: x.title,
            category: x.category || "General",
            author: x.author || "Unknown",
            status: x.status || "draft",
            views: x.views ? String(x.views) : "0",
            date: new Date(x.updatedAt || x.createdAt || Date.now()).toLocaleDateString("hi-IN")
          })));
        }
      })
      .catch(() => {});
  }, []);
const[breaking,setBreaking]=useState("");const[toast,setToast]=useState<string | {message: string, actionUrl?: string} | null>(null);const[menu,setMenu]=useState(false);const language=useSyncExternalStore<AdminLanguage>(subscribeLanguage,getLanguageSnapshot,()=>"hi");function setLanguage(next:AdminLanguage){window.localStorage.setItem(ADMIN_LANGUAGE_KEY,next);document.documentElement.lang=next;window.dispatchEvent(new Event("admin-language-change"))}function notify(x:string){setToast(x);setTimeout(()=>setToast(null),2200)}return <div className="adminShell" lang={language}>
   {menu && <div className="adminBackdrop" onClick={() => setMenu(false)} style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 38}} />}
   <aside className={`adminNav ${menu?"open":""}`}><Link className="adminBrand" href="/"><BrandLogo/><small>ADMIN DESK</small></Link><nav>{nav.filter(x=>allowed.includes(x)).map((x,i)=><button key={x} className={tab===x?"active":""} onClick={()=>{setTab(x);setMenu(false)}}><i className="adminSvgIcon">{Icons[x as keyof typeof Icons] || Icons["डैशबोर्ड"]}</i>{localize(language,x)}</button>)}</nav><div className="navBottom">{allowed.includes("सेटिंग्स")&&<button onClick={()=>setTab("सेटिंग्स")}><i className="adminSvgIcon">{Icons["सेटिंग्स"]}</i> {localize(language,"सेटिंग्स")}</button>}<a href={signout}>↪ {localize(language,"साइन आउट","Sign out")}</a></div></aside>
 <main className="adminMain"><header><div><button className="mobileMenu" onClick={()=>setMenu(!menu)}>☰</button><h1>{localize(language,tab)}</h1><p>{localize(language,`नमस्कार, ${user.name.split(" ")[0]} — न्यूज़रूम में आपका स्वागत है।`,`Hello, ${user.name.split(" ")[0]} — welcome to the newsroom.`)}</p></div><div className="adminActions"><button className="languageToggle" type="button" title={localize(language,"English में बदलें","हिन्दी में बदलें")} aria-label={localize(language,"डैशबोर्ड भाषा English करें","Switch dashboard language to Hindi")} onClick={()=>{const next=language==="hi"?"en":"hi";setLanguage(next);notify(next==="en"?"Dashboard language changed to English":"डैशबोर्ड भाषा हिन्दी की गई")}}><span aria-hidden="true">🌐</span>{language==="hi"?"EN":"हिन्दी"}</button><div style={{position:"relative"}}>
  <button className="bell" aria-label={localize(language,"सूचनाएं","Notifications")} onClick={()=>{ setShowNotifications(!showNotifications); setUnreadCount(0); if(typeof Notification!=="undefined"&&Notification.permission==="default")Notification.requestPermission(); }}>
    ♢{unreadCount > 0 && <i>{unreadCount}</i>}
  </button>
  {showNotifications && (
    <div style={{position:"absolute", top:"100%", right:0, width:"320px", background:"#fff", border:"1px solid #e1e5ea", borderRadius:"8px", boxShadow:"0 10px 25px rgba(0,0,0,0.1)", zIndex:100, maxHeight:"400px", overflowY:"auto", padding:"10px"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #eee", paddingBottom:"10px", marginBottom:"10px"}}>
        <div style={{fontWeight:"bold", color:"#111827", fontSize:"14px"}}>{localize(language,"हाल की सूचनाएं", "Recent Notifications")}</div>
        {notifications.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); setNotifications([]); setUnreadCount(0); setShowNotifications(false); }} style={{background:"none", border:"none", color:"#ef4444", fontSize:"12px", cursor:"pointer", padding:0}}>
            {localize(language, "सभी हटाएं", "Clear all")}
          </button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div style={{padding:"20px", textAlign:"center", color:"#89919c", fontSize:"12px"}}>{localize(language,"कोई नई सूचना नहीं", "No new notifications")}</div>
      ) : (
        notifications.map((n, i) => (
          <div key={i} style={{padding:"10px", borderBottom:"1px solid #f3f4f6", fontSize:"13px", color:"#374151"}}>
            {n.actionUrl ? <a href={n.actionUrl} target="_blank" style={{color:"#0066cc", textDecoration:"none", fontWeight:500, display:"block"}}>{n.message}</a> : n.message}
              <div style={{fontSize:"10px", color:"#9ca3af", marginTop:"4px"}}>{new Date(n.timestamp || Date.now()).toLocaleTimeString()}</div>
          </div>
        ))
      )}
    </div>
  )}
</div><div className="avatar">{user.name.slice(0,1).toUpperCase()}</div><div><b>{user.name}</b><small>{localize(language,roleLabel)}</small></div></div></header>
 {tab==="डैशबोर्ड"?<Dashboard allowed={allowed} language={language} articles={articles} breaking={breaking} setBreaking={setBreaking} setTab={setTab}/>:<Workspace allowed={allowed} language={language} setLanguage={setLanguage} tab={tab} setTab={setTab} articles={articles} setArticles={setArticles} notify={notify} currentEmail={user.email} currentName={user.name} editArticleItem={editArticleItem}/>}
 </main>{toast&&<div className="adminToast">✓ {typeof toast === "string" ? toast : (toast.actionUrl ? <a href={toast.actionUrl} target="_blank" style={{color:"inherit", textDecoration:"underline"}}>{toast.message}</a> : toast.message)}</div>}</div>}

function Dashboard({allowed,language,articles,breaking,setBreaking,setTab}:{allowed:string[];language:AdminLanguage;articles:typeof baseArticles;breaking:string;setBreaking:(x:string)=>void;setTab:(x:string)=>void}){const[liveStats,setLiveStats]=useState<DashboardStats|null>(null);const[statsError,setStatsError]=useState(false);useEffect(()=>{let cancelled=false;fetch("/api/backend/dashboard/stats",{cache:"no-store"}).then(async response=>{if(!response.ok)throw new Error();return response.json() as Promise<DashboardStats>}).then(data=>{if(!cancelled){setLiveStats(data);setStatsError(false)}}).catch(()=>{if(!cancelled)setStatsError(true)});fetch("/api/backend/breaking",{cache:"no-store"}).then(r=>r.json()).then(d=>{if(!cancelled&&d.items){const active=d.items.find((x:any)=>x.active);if(active)setBreaking(active.text);else setBreaking(language==="en"?"No active breaking news":"कोई लाइव ब्रेकिंग न्यूज़ नहीं है")}}).catch(()=>{});return()=>{cancelled=true}},[language]);const format=(value:number|undefined)=>value===undefined?"—":new Intl.NumberFormat("en-IN").format(value);const stats=language==="en"?[["Total views",format(liveStats?.totalViews),"Across all stories","◉"],["Published stories",format(liveStats?.publishedStories),"Live on the website","▤"],["Total reporters",format(liveStats?.totalReporters),liveStats?`${format(liveStats.activeReporters)} active`:"Loading…","♙"],["Draft stories",format(liveStats?.draftStories),liveStats?`${format(liveStats.reviewStories)} in review`:"Loading…","▣"]]:[["कुल व्यूज़",format(liveStats?.totalViews),"सभी खबरों के व्यूज़","◉"],["प्रकाशित खबरें",format(liveStats?.publishedStories),"वेबसाइट पर लाइव","▤"],["कुल रिपोर्टर",format(liveStats?.totalReporters),liveStats?`${format(liveStats.activeReporters)} सक्रिय`:"लोड हो रहा है…","♙"],["ड्राफ्ट खबरें",format(liveStats?.draftStories),liveStats?`${format(liveStats.reviewStories)} समीक्षा में`:"लोड हो रहा है…","▣"]];const quick=language==="en"?[["＋","नई पोस्ट","Create and publish an article"],["▧","मीडिया लाइब्रेरी","Add photos and videos"],["♙","रिपोर्टर","Create a team member profile"],["▣","विज्ञापन","Create an advertising campaign"]]:[["＋","नई पोस्ट","लेख बनाएं और प्रकाशित करें"],["▧","मीडिया लाइब्रेरी","फोटो और वीडियो जोड़ें"],["♙","रिपोर्टर","नई टीम सदस्य प्रोफाइल"],["▣","विज्ञापन","नया विज्ञापन अभियान"]];return <><section className="statsGrid" aria-busy={!liveStats&&!statsError}>{stats.filter(s=>{ if(!allowed.includes("समाचार")) return false; if(s[0]==="Total reporters"||s[0]==="कुल रिपोर्टर") return allowed.includes("टीम और भूमिकाएँ"); if(s[0]==="Draft stories"||s[0]==="ड्राफ्ट खबरें") return allowed.includes("समाचार"); return true; }).map(s=><article key={s[0]}><div className="statIcon">{Icons[s[0] === "Total views" || s[0] === "कुल व्यूज़" ? "डैशबोर्ड" : s[0] === "Published stories" || s[0] === "प्रकाशित खबरें" ? "समाचार" : s[0] === "Total reporters" || s[0] === "कुल रिपोर्टर" ? "रिपोर्टर" : "नई पोस्ट"]}</div><span>{s[0]}</span><strong>{s[1]}</strong><small>{s[2]}</small></article>)}</section>{statsError&&<p className="statsNotice" role="alert">{localize(language,"लाइव आंकड़े लोड नहीं हुए। पेज दोबारा खोलें।","Live statistics could not be loaded. Please reopen the page.")}</p>}{allowed.includes("ब्रेकिंग न्यूज़") && <section className="breakingEditor"><div><span>⚡ {localize(language,"लाइव ब्रेकिंग न्यूज़","Live breaking news")}</span><p>{localize(language,"कई हेडलाइन जोड़ें और नियंत्रित करें","Add and manage multiple headlines")}</p></div><input value={breaking} onChange={e=>setBreaking(e.target.value)} readOnly placeholder={localize(language, "लोड हो रहा है...", "Loading...")}/><button className="primary" onClick={()=>setTab("ब्रेकिंग न्यूज़")}>{localize(language,"सभी मैनेज करें","Manage all")}</button><label><input type="checkbox" defaultChecked disabled/> {localize(language,"लाइव","Live")}</label></section>}<section className="adminGrid">{allowed.includes("समाचार") && <ArticleTable language={language} articles={articles} setTab={setTab}/>}<aside className="adminSide"><div className="panel quick"><h2>{localize(language,"त्वरित कार्य","Quick actions")}</h2>{quick.filter(x=>allowed.includes(x[1])).map(x=><button key={x[1]} onClick={()=>setTab(x[1])}><i>{x[0]}</i><span><b>{localize(language,x[1])}</b><small>{x[2]}</small></span><em>›</em></button>)}</div><div className="panel activity"><h2>{localize(language,"हाल की गतिविधि","Recent activity")}</h2>{articles.slice(0, 5).map((a,i)=><div key={a.title} onClick={()=>{ if(typeof window !== "undefined") { window.dispatchEvent(new CustomEvent("open-article", {detail: i})); }; }} style={{cursor:"pointer"}} className="hoverableRow"><i>{a.author.slice(0,1).toUpperCase()}</i><p><b>{language==="en" ? (a.author + " updated " + a.title.slice(0,25) + "...") : (a.author + " ने " + a.title.slice(0,25) + "... अपडेट किया")}</b><small>{a.date}</small></p></div>)}</div></aside></section></>}
function ArticleTable({language,articles,setTab}:{language:AdminLanguage;articles:typeof baseArticles;setTab:(x:string)=>void}){ return <div className="panel"><div className="panelHead"><div><h2>{localize(language,"हाल की खबरें","Recent stories")}</h2><p>{localize(language,"समाचारों को संपादित और प्रकाशित करें","Edit and publish news stories")}</p></div><button className="primary" onClick={()=>setTab("नई पोस्ट")}>＋ {localize(language,"नई खबर लिखें","Write new story")}</button></div><div className="tableWrap"><table><thead><tr><th>{localize(language,"शीर्षक","Title")}</th><th>{localize(language,"श्रेणी","Category")}</th><th>{localize(language,"लेखक","Author")}</th><th>{localize(language,"स्थिति","Status")}</th><th>{localize(language,"व्यूज़","Views")}</th><th>{localize(language,"अपडेट","Updated")}</th></tr></thead><tbody>{articles.map((a,i)=><tr key={a.title} onClick={()=>{ if(typeof window !== "undefined") { window.dispatchEvent(new CustomEvent("open-article", {detail: i})); }; }} style={{cursor:"pointer"}} className="hoverableRow" title={localize(language,"लेख पढ़ने के लिए नया टैब खोलें","Open article in new tab")}><td><b>{a.title}</b></td><td><span className="pill">{a.category}</span></td><td>{a.author}</td><td><span className={`status ${a.status}`}>● {a.status}</span></td><td>{a.views}</td><td>{a.date}</td></tr>)}</tbody></table></div><button className="viewAll" onClick={()=>setTab("समाचार")}>{localize(language,"सभी समाचार देखें","View all news")} →</button></div>}

function Workspace({allowed,language,setLanguage,tab,setTab,articles,setArticles,notify,currentEmail,currentName,editArticleItem,setEditArticleItem}:{allowed:string[];language:AdminLanguage;setLanguage:(language:AdminLanguage)=>void;tab:string;setTab:(x:string)=>void;articles:typeof baseArticles;setArticles:(x:typeof baseArticles)=>void;notify:(x:string)=>void;currentEmail:string;currentName:string; editArticleItem?:any; setEditArticleItem?:(x:any)=>void}){ if(!allowed.includes(tab) && tab !== "डैशबोर्ड" && tab !== "सेटिंग्स") return <section className="workspace"><h2>Access Denied / अनुमति नहीं है</h2></section>; function submit(e:FormEvent<HTMLFormElement>,type:string){e.preventDefault();const f=new FormData(e.currentTarget);if(type==="article"){const title=String(f.get("title"));setArticles([{title,category:String(f.get("category")),author:"न्यूज़ डेस्क",status:String(f.get("status")),views:"—",date:"अभी"},...articles]);notify("नई खबर सेव हुई");setTab("समाचार")}else notify(localize(language,`${type} सेव हुआ`,`${englishLabels[type]??type} saved`))}
 if(tab==="टीम और भूमिकाएँ")return <TeamManager language={language} notify={notify} currentEmail={currentEmail}/>;
 if(tab==="ऑडियो हाइलाइट्स")return <AudioHighlightsManager language={language} notify={notify}/>;
 if(tab==="समाचार")return <NewsManager language={language} mode="list" setTab={setTab} notify={notify} editArticleItem={editArticleItem} clearEditArticle={() => setEditArticleItem && setEditArticleItem(null)}/>;
 if(tab==="नई पोस्ट")return <NewsManager language={language} mode="create" setTab={setTab} notify={notify}/>;
 if(tab==="श्रेणियाँ")return <CategoryManager language={language} notify={notify}/>;
 if(tab==="रिपोर्टर")return <ReporterManager language={language} notify={notify}/>;
 if(tab==="मीडिया लाइब्रेरी")return <MediaLibraryManager language={language} notify={notify}/>;
 if(tab==="ब्रेकिंग न्यूज़")return <BreakingManager language={language} notify={notify}/>;
 if(tab==="विज्ञापन")return <AdManager language={language} notify={notify}/>;
 if(tab==="टिप्पणियाँ")return <section className="workspace"><div className="workspaceHead"><div><h2>{localize(language,"टिप्पणी मॉडरेशन","Comment moderation")}</h2><p>{localize(language,"12 टिप्पणियाँ समीक्षा में हैं","12 comments in review")}</p></div></div><div className="commentList">{["बहुत उपयोगी जानकारी","कृपया इस खबर का स्रोत बताएं","हमारे शहर की खबर भी प्रकाशित करें"].map(x=><article key={x}><div><b>{localize(language,"पाठक","Reader")}</b><p>{x}</p></div><button onClick={()=>notify(localize(language,"टिप्पणी स्वीकृत हुई","Comment approved"))}>{localize(language,"स्वीकार","Approve")}</button><button onClick={()=>notify(localize(language,"टिप्पणी हटाई गई","Comment removed"))}>{localize(language,"हटाएँ","Remove")}</button></article>)}</div></section>;
  if(tab==="वेबसाइट कंटेंट") return <GlobalContentManager language={language} setLanguage={setLanguage} notify={notify} />;
 return <section className="workspace"><div className="workspaceHead"><div><h2>{localize(language,"वेबसाइट सेटिंग्स","Website settings")}</h2><p>{localize(language,"न्यूज़रूम की सामान्य जानकारी","General newsroom preferences")}</p></div></div><AppearanceSettings/><form className="editorForm settingsForm" onSubmit={e=>e.preventDefault()}><label>{localize(language,"डैशबोर्ड भाषा","Dashboard language")}<select value={language} onChange={event=>setLanguage(event.target.value as AdminLanguage)}><option value="hi">हिन्दी</option><option value="en">English</option></select><small className="settingHint">{localize(language,"यह भाषा केवल इसी ब्राउज़र में सेव रहेगी।","This language will remain saved in this browser.")}</small></label></form><br/><ProfileSettings language={language} notify={notify} localize={localize} user={{name: currentName, email: currentEmail}} /></section>;
}