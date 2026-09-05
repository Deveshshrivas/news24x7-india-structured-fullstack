"use client";
/* eslint-disable @next/next/no-img-element -- reporter photos are authenticated backend streams */

import {FormEvent,useCallback,useEffect,useRef,useState} from "react";

type Reporter={id:string;name:string;designation:string;phone:string;email:string;address:string;active:boolean;photoUrl:string|null};
type Language="hi"|"en";

export default function ReporterManager({language,notify}:{language:Language;notify:(message:string)=>void}){
  const[items,setItems]=useState<Reporter[]>([]);
  const[editing,setEditing]=useState<Reporter|null>(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
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

  return <section className="workspace reporterManager">
    <div className="workspaceHead"><div><h2>{text("रिपोर्टर डायरेक्टरी","Reporter directory")}</h2><p>{items.length} {text("रिपोर्टर प्रोफाइल उपलब्ध हैं","reporter profiles available")}</p></div></div>
    <form ref={formRef} key={editing?.id??"new"} className="reporterForm" onSubmit={save}>
      <div className="reporterFormHead"><div><h3>{editing?text("रिपोर्टर संपादित करें","Edit reporter"):text("नया रिपोर्टर जोड़ें","Add new reporter")}</h3><p>{text("संपर्क और प्रोफाइल की पूरी जानकारी भरें।","Enter complete contact and profile information.")}</p></div>{editing&&<button type="button" onClick={cancel}>{text("रद्द करें","Cancel")}</button>}</div>
      <div className="reporterFields"><label>{text("रिपोर्टर का नाम","Reporter name")}<input name="name" required minLength={2} maxLength={80} defaultValue={editing?.name} placeholder={text("पूरा नाम","Full name")}/></label><label>{text("पद / पदनाम","Designation")}<input name="designation" required minLength={2} maxLength={100} defaultValue={editing?.designation} placeholder={text("जैसे: वरिष्ठ संवाददाता","For example: Senior correspondent")}/></label><label>{text("फोन नंबर","Phone number")}<input name="phone" type="tel" required minLength={7} maxLength={24} defaultValue={editing?.phone} placeholder="+91 98765 43210"/></label><label>{text("ईमेल","Email")}<input name="email" type="email" required defaultValue={editing?.email} placeholder="reporter@example.com"/></label><label className="reporterAddress">{text("पता","Address")}<textarea name="address" required minLength={5} maxLength={300} rows={3} defaultValue={editing?.address} placeholder={text("पूरा कार्यालय या संपर्क पता","Full office or contact address")}/></label><label className="reporterPhoto">{text("फोटो","Photo")}<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"/><small>{text("JPG, PNG या WebP · अधिकतम 5 MB","JPG, PNG or WebP · maximum 5 MB")}{editing?.photoUrl?text(" · खाली छोड़ने पर मौजूदा फोटो रहेगी"," · leave empty to keep the current photo"):""}</small></label></div>
      <label className="reporterActive"><input name="active" type="checkbox" defaultChecked={editing?.active??true}/><span>{text("सक्रिय रिपोर्टर","Active reporter")}</span></label>
      {error&&<p className="reporterError" role="alert">{error}</p>}
      <div className="reporterFormActions"><button className="primary" disabled={saving}>{saving?text("सेव हो रहा है…","Saving…"):editing?text("बदलाव सेव करें","Save changes"):text("＋ रिपोर्टर जोड़ें","＋ Add reporter")}</button>{editing&&<button type="button" onClick={cancel}>{text("रद्द करें","Cancel")}</button>}</div>
    </form>
    {loading?<div className="reporterEmpty">{text("लोड हो रहा है…","Loading…")}</div>:items.length===0?<div className="reporterEmpty">{text("अभी कोई रिपोर्टर नहीं है। ऊपर से पहला प्रोफाइल बनाएँ।","No reporters yet. Create the first profile above.")}</div>:<div className="reporterGrid">{items.map(item=><article className={item.active?"":"reporterDisabled"} key={item.id}><div className="reporterIdentity">{item.photoUrl?<img src={`/api/backend${item.photoUrl}`} alt={item.name}/>:<div className="reporterInitial" aria-hidden="true">{item.name.slice(0,1).toUpperCase()}</div>}<div><h3>{item.name}</h3><strong>{item.designation}</strong><span>{item.active?text("सक्रिय","Active"):text("निष्क्रिय","Inactive")}</span></div></div><div className="reporterContact"><a href={`tel:${item.phone}`}>☎ <span>{item.phone}</span></a><a href={`mailto:${item.email}`}>✉ <span>{item.email}</span></a><p>⌖ <span>{item.address}</span></p></div><div className="reporterCardActions"><button onClick={()=>beginEdit(item)}>{text("संपादित करें","Edit")}</button><button className="danger" onClick={()=>void remove(item)}>{text("हटाएँ","Delete")}</button></div></article>)}</div>}
  </section>
}
