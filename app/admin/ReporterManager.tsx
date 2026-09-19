"use client";
/* eslint-disable @next/next/no-img-element -- reporter photos are authenticated backend streams */

import {FormEvent,useCallback,useEffect,useRef,useState} from "react";

type Reporter={id:string;reporterId?:string;name:string;designation:string;phone:string;email:string;country:string;state:string;city:string;pincode:string;address:string;active:boolean;photoUrl:string|null;updatedAt?:string|null};
type Language="hi"|"en";

export default function ReporterManager({language,notify}:{language:Language;notify:(message:string)=>void}){
  const[items,setItems]=useState<Reporter[]>([]);
  const[editing,setEditing]=useState<Reporter|null>(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const[searchQuery,setSearchQuery]=useState("");
  const[viewMode,setViewMode]=useState<"card"|"list">("card");
  const formRef=useRef<HTMLFormElement>(null);
  const text=useCallback((hi:string,en:string)=>language==="en"?en:hi,[language]);
  const load=useCallback(async()=>{
    setLoading(true);
    try{const response=await fetch("/api/backend/reporters",{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.detail||text("रिपोर्टर लोड नहीं हुए","Reporters could not be loaded"));setItems(data.items??[]);setError("")}
    catch(caught){setError(caught instanceof Error?caught.message:text("रिपोर्टर लोड नहीं हुए","Reporters could not be loaded"))}
    finally{setLoading(false)}
  },[text]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);

  function beginEdit(item:Reporter){setEditing(item);setError("");window.setTimeout(()=>formRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),0)}
  function cancel(){setEditing(null);setError("");formRef.current?.reset()}
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");const form=event.currentTarget,data=new FormData(form);data.set("active",String((form.elements.namedItem("active") as HTMLInputElement).checked));
    try{const response=await fetch(editing?`/api/backend/reporters/${editing.id}`:"/api/backend/reporters",{method:editing?"PATCH":"POST",body:data});const result=await response.json();if(!response.ok)throw new Error(result.detail||text("रिपोर्टर सेव नहीं हुआ","Reporter could not be saved"));form.reset();setEditing(null);await load();notify(text(editing?"रिपोर्टर अपडेट हुआ":"रिपोर्टर जोड़ा गया",editing?"Reporter updated":"Reporter added"))}
    catch(caught){setError(caught instanceof Error?caught.message:text("रिपोर्टर सेव नहीं हुआ","Reporter could not be saved"))}
    finally{setSaving(false)}
  }
  async function remove(item:Reporter){if(!window.confirm(text(`“${item.name}” को हटाएँ?`,`Delete “${item.name}”?`)))return;try{const response=await fetch(`/api/backend/reporters/${item.id}`,{method:"DELETE"});const result=await response.json();if(!response.ok)throw new Error(result.detail||text("रिपोर्टर हटाया नहीं गया","Reporter could not be deleted"));if(editing?.id===item.id)setEditing(null);await load();notify(text("रिपोर्टर हटाया गया","Reporter deleted"))}catch(caught){setError(caught instanceof Error?caught.message:text("रिपोर्टर हटाया नहीं गया","Reporter could not be deleted"))}}

  const filteredItems=items.filter(i=>!searchQuery||[i.name,i.reporterId,i.country,i.state,i.city,i.pincode].some(x=>x?.toLowerCase().includes(searchQuery.toLowerCase())));

  return <section className="workspace reporterManager">
    <div className="workspaceHead"><div><h2>{text("रिपोर्टर डायरेक्टरी","Reporter directory")}</h2><p>{items.length} {text("रिपोर्टर प्रोफाइल उपलब्ध हैं","reporter profiles available")}</p></div></div>
    <form ref={formRef} key={editing?.id??"new"} className="reporterForm" onSubmit={save}>
      <div className="reporterFormHead"><div><h3>{editing?text("रिपोर्टर संपादित करें","Edit reporter"):text("नया रिपोर्टर जोड़ें","Add new reporter")}</h3><p>{text("संपर्क और प्रोफाइल की पूरी जानकारी भरें।","Enter complete contact and profile information.")}</p></div>{editing&&<button type="button" onClick={cancel}>{text("रद्द करें","Cancel")}</button>}</div>
      <div className="reporterFields"><label>{text("रिपोर्टर आईडी","Reporter ID")}<input name="reporter_id" maxLength={40} pattern="[A-Za-z0-9_-]*" defaultValue={editing?.reporterId??""} placeholder="REP-001"/><small>{text("अक्षर, अंक, - या _। खाली छोड़ने पर मौजूदा आईडी रहेगी।","Letters, numbers, - or _. Leave blank to keep the existing ID.")}</small></label><label>{text("रिपोर्टर का नाम","Reporter name")}<input name="name" required minLength={2} maxLength={80} defaultValue={editing?.name} placeholder={text("पूरा नाम","Full name")}/></label><label>{text("पद / पदनाम","Designation")}<input name="designation" required minLength={2} maxLength={100} defaultValue={editing?.designation} placeholder={text("जैसे: वरिष्ठ संवाददाता","For example: Senior correspondent")}/></label><label>{text("फोन नंबर","Phone number")}<input name="phone" type="tel" required minLength={7} maxLength={24} defaultValue={editing?.phone} placeholder="+91 98765 43210"/></label><label>{text("ईमेल","Email")}<input name="email" type="email" required defaultValue={editing?.email} placeholder="reporter@example.com"/></label><label>{text("देश","Country")}<input name="country" maxLength={50} defaultValue={editing?.country} placeholder="India"/></label><label>{text("राज्य","State")}<input name="state" maxLength={50} defaultValue={editing?.state} placeholder="Madhya Pradesh"/></label><label>{text("शहर","City")}<input name="city" maxLength={50} defaultValue={editing?.city} placeholder="Bhopal"/></label><label>{text("पिनकोड","Pincode")}<input name="pincode" maxLength={20} defaultValue={editing?.pincode} placeholder="462001"/></label><label className="reporterAddress">{text("पता","Address")}<textarea name="address" required minLength={5} maxLength={300} rows={3} defaultValue={editing?.address} placeholder={text("पूरा कार्यालय या संपर्क पता","Full office or contact address")}/></label><label className="reporterPhoto">{text("फोटो","Photo")}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"/><small>{text("JPG, PNG या WebP · अधिकतम 5 MB","JPG, PNG or WebP · maximum 5 MB")}{editing?.photoUrl?text(" · खाली छोड़ने पर मौजूदा फोटो रहेगी"," · leave empty to keep the current photo"):""}</small></label></div>
      <label className="reporterActive"><input name="active" type="checkbox" defaultChecked={editing?.active??true}/><span>{text("सक्रिय रिपोर्टर","Active reporter")}</span></label>
      {error&&<p className="reporterError" role="alert">{error}</p>}
      <div className="reporterFormActions"><button className="primary" disabled={saving}>{saving?text("सेव हो रहा है…","Saving…"):editing?text("बदलाव सेव करें","Save changes"):text("＋ रिपोर्टर जोड़ें","＋ Add reporter")}</button>{editing&&<button type="button" onClick={cancel}>{text("रद्द करें","Cancel")}</button>}</div>
    </form>
    {loading?<div className="reporterEmpty">{text("लोड हो रहा है…","Loading…")}</div>:items.length===0?<div className="reporterEmpty">{text("अभी कोई रिपोर्टर नहीं है। ऊपर से पहला प्रोफाइल बनाएँ।","No reporters yet. Create the first profile above.")}</div>:<><div className="reporterFilter" style={{marginBottom: 20, display: "flex", gap: 10, alignItems: "center"}}><input type="search" style={{flex: 1, padding: 10, borderRadius: 6, border: "1px solid #2d3748", background: "#1a202c", color: "#fff"}} placeholder={text("नाम, शहर, राज्य या पिनकोड से खोजें...","Search by name, city, state or pincode...")} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} /><div style={{display: "flex", gap: 5, background: "#1a202c", padding: 4, borderRadius: 6}}><button type="button" onClick={()=>setViewMode("card")} style={{padding: "8px 16px", borderRadius: 4, background: viewMode==="card"?"#3182ce":"transparent", color: "#fff", border: "none", cursor: "pointer"}}>{text("कार्ड", "Card")}</button><button type="button" onClick={()=>setViewMode("list")} style={{padding: "8px 16px", borderRadius: 4, background: viewMode==="list"?"#3182ce":"transparent", color: "#fff", border: "none", cursor: "pointer"}}>{text("लिस्ट", "List")}</button></div></div>{viewMode === "card" ? (<div className="reporterGrid">{filteredItems.map(item=><article className={item.active?"":"reporterDisabled"} key={item.id}><div className="reporterIdentity">{item.photoUrl?<img src={`/api/backend${item.photoUrl}`} alt={item.name}/>:<div className="reporterInitial" aria-hidden="true">{item.name.slice(0,1).toUpperCase()}</div>}<div><h3>{item.name}</h3><strong>{item.designation}</strong><small>{text("रिपोर्टर आईडी","Reporter ID")}: {item.reporterId||text("नहीं दी गई","Not assigned")}</small><span>{item.active?text("सक्रिय","Active"):text("निष्क्रिय","Inactive")}</span></div></div><div className="reporterContact"><a href={`tel:${item.phone}`}>☎ <span>{item.phone}</span></a><a href={`mailto:${item.email}`}>✉ <span>{item.email}</span></a><p>⌖ <span>{[item.city, item.state, item.country, item.pincode].filter(Boolean).join(", ")}</span></p><p>🏢 <span>{item.address}</span></p></div><div className="reporterCardActions"><button onClick={()=>beginEdit(item)}>{text("संपादित करें","Edit")}</button><button className="danger" onClick={()=>void remove(item)}>{text("हटाएँ","Delete")}</button>  <small style={{display:"block", marginTop:"4px", color:"var(--muted)"}}>{item.updatedAt ? text("अंतिम अपडेट: ", "Updated: ") + new Date(item.updatedAt).toLocaleDateString() : ""}</small>
        </div>
      </article>)}</div>) : (
<div className="reporterList" style={{overflowX: "auto", background: "#1a202c", borderRadius: 8, padding: 1}}>
  <table style={{width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14}}>
    <thead>
      <tr style={{borderBottom: "1px solid #2d3748", background: "#2d3748"}}>
        <th style={{padding: "12px 16px"}}>{text("फोटो", "Photo")}</th>
        <th style={{padding: "12px 16px"}}>{text("नाम", "Name")}</th>
        <th style={{padding: "12px 16px"}}>{text("पद", "Designation")}</th>
        <th style={{padding: "12px 16px"}}>{text("स्थान", "Location")}</th>
        <th style={{padding: "12px 16px"}}>{text("संपर्क", "Contact")}</th>
        <th style={{padding: "12px 16px"}}>{text("कार्रवाई", "Actions")}</th>
      </tr>
    </thead>
    <tbody>
      {filteredItems.map(item => (
        <tr key={item.id} className={item.active?"":"reporterDisabled"} style={{borderBottom: "1px solid #2d3748", opacity: item.active?1:0.6}}>
          <td style={{padding: "12px 16px"}}>{item.photoUrl?<img src={`/api/backend${item.photoUrl}`} alt={item.name} style={{width: 40, height: 40, borderRadius: "50%", objectFit: "cover"}}/>:<div className="reporterInitial" style={{width: 40, height: 40, borderRadius: "50%", background: "#4a5568", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold"}} aria-hidden="true">{item.name.slice(0,1).toUpperCase()}</div>}</td>
          <td style={{padding: "12px 16px"}}><strong>{item.name}</strong><br/><small style={{color: "#a0aec0"}}>{item.reporterId||text("नहीं दी गई","Not assigned")}</small></td>
          <td style={{padding: "12px 16px"}}>{item.designation}</td>
          <td style={{padding: "12px 16px"}}>{[item.city, item.state, item.country, item.pincode].filter(Boolean).join(", ")}</td>
          <td style={{padding: "12px 16px"}}><a href={`tel:${item.phone}`} style={{color: "#63b3ed", textDecoration: "none"}}>☎ {item.phone}</a><br/><a href={`mailto:${item.email}`} style={{color: "#63b3ed", textDecoration: "none"}}>✉ {item.email}</a></td>
          <td style={{padding: "12px 16px", whiteSpace: "nowrap"}}><button onClick={()=>beginEdit(item)} style={{marginRight: 8, padding: "6px 12px", fontSize: 12}}>{text("संपादित करें","Edit")}</button><button className="danger" onClick={()=>void remove(item)} style={{padding: "6px 12px", fontSize: 12}}>{text("हटाएँ","Delete")}</button></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
)}</>}
  </section>
}
