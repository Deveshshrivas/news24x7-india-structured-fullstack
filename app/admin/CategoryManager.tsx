"use client";

import {FormEvent,useCallback,useEffect,useState} from "react";

type Category={id:string;name:string;slug:string;parentId:string|null;active:boolean;position:number};
type Language="hi"|"en";

export default function CategoryManager({language,notify}:{language:Language;notify:(message:string)=>void}){
  const[items,setItems]=useState<Category[]>([]);
  const[name,setName]=useState("");
  const[parentId,setParentId]=useState("");
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const text=useCallback((hi:string,en:string)=>language==="en"?en:hi,[language]);
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const response=await fetch("/api/backend/categories",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.detail||text("श्रेणियाँ लोड नहीं हुईं","Categories could not be loaded"));
      setItems(data.items??[]);
      setError("");
    }catch(caught){setError(caught instanceof Error?caught.message:text("श्रेणियाँ लोड नहीं हुईं","Categories could not be loaded"))}
    finally{setLoading(false)}
  },[text]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);

  async function request(url:string,method:string,body?:object){
    const response=await fetch(url,{method,headers:{"content-type":"application/json"},body:body?JSON.stringify(body):undefined});
    const data=await response.json();
    if(!response.ok)throw new Error(data.detail||text("कार्रवाई पूरी नहीं हुई","The action could not be completed"));
    return data;
  }
  async function add(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!name.trim())return;
    setSaving(true);setError("");
    try{
      await request("/api/backend/categories","POST",{name:name.trim(),parent_id:parentId||null,active:true,position:items.length});
      setName("");setParentId("");await load();notify(text("श्रेणी सेव हुई","Category saved"));
    }catch(caught){setError(caught instanceof Error?caught.message:text("श्रेणी सेव नहीं हुई","Category could not be saved"))}
    finally{setSaving(false)}
  }
  async function edit(item:Category){
    const next=window.prompt(text("श्रेणी का नया नाम","New category name"),item.name)?.trim();
    if(!next||next===item.name)return;
    try{await request(`/api/backend/categories/${item.id}`,"PATCH",{name:next,parent_id:item.parentId,active:item.active,position:item.position});await load();notify(text("श्रेणी अपडेट हुई","Category updated"))}
    catch(caught){setError(caught instanceof Error?caught.message:text("श्रेणी अपडेट नहीं हुई","Category could not be updated"))}
  }
  async function toggle(item:Category){
    try{await request(`/api/backend/categories/${item.id}`,"PATCH",{name:item.name,parent_id:item.parentId,active:!item.active,position:item.position});await load();notify(text("स्थिति अपडेट हुई","Status updated"))}
    catch(caught){setError(caught instanceof Error?caught.message:text("स्थिति अपडेट नहीं हुई","Status could not be updated"))}
  }
  async function remove(item:Category){
    if(!window.confirm(text(`“${item.name}” हटाएँ?`,`Delete “${item.name}”?`)))return;
    try{await request(`/api/backend/categories/${item.id}`,"DELETE");await load();notify(text("श्रेणी हटाई गई","Category deleted"))}
    catch(caught){setError(caught instanceof Error?caught.message:text("श्रेणी हटाई नहीं जा सकी","Category could not be deleted"))}
  }
  const parents=items.filter(item=>!item.parentId);
  return <section className="workspace categoryManager">
    <div className="workspaceHead"><div><h2>{text("श्रेणियाँ और उप-श्रेणियाँ","Categories and subcategories")}</h2><p>{text("मुख्य श्रेणी के अंदर एक स्तर तक उप-श्रेणियाँ बनाएँ।","Create one level of subcategories inside each parent category.")}</p></div></div>
    <form className="categoryAddForm" onSubmit={add}>
      <label>{text("नाम","Name")}<input required minLength={2} maxLength={80} value={name} onChange={event=>setName(event.target.value)} placeholder={text("नई श्रेणी या उप-श्रेणी","New category or subcategory")}/></label>
      <label>{text("मुख्य श्रेणी","Parent category")}<select value={parentId} onChange={event=>setParentId(event.target.value)}><option value="">{text("कोई नहीं — मुख्य श्रेणी","None — top-level category")}</option>{parents.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <button className="primary" disabled={saving}>{saving?text("सेव हो रहा है…","Saving…"):text("＋ श्रेणी जोड़ें","＋ Add category")}</button>
    </form>
    {error&&<p className="categoryError" role="alert">{error}</p>}
    {loading?<div className="categoryEmpty">{text("लोड हो रहा है…","Loading…")}</div>:parents.length===0?<div className="categoryEmpty">{text("अभी कोई श्रेणी नहीं है। ऊपर से पहली श्रेणी बनाएँ।","No categories yet. Create the first category above.")}</div>:<div className="categoryTree">{parents.map(parent=>{
      const children=items.filter(item=>item.parentId===parent.id);
      return <article className="categoryGroup" key={parent.id}><div className="categoryRow"><div><b>{parent.name}</b><small>/{parent.slug} · {children.length} {text("उप-श्रेणियाँ","subcategories")}</small></div><span className={parent.active?"categoryActive":"categoryInactive"}>{parent.active?text("सक्रिय","Active"):text("निष्क्रिय","Inactive")}</span><div className="categoryActions"><button onClick={()=>void edit(parent)}>{text("संपादित करें","Edit")}</button><button onClick={()=>void toggle(parent)}>{parent.active?text("बंद करें","Disable"):text("चालू करें","Enable")}</button><button className="danger" onClick={()=>void remove(parent)}>{text("हटाएँ","Delete")}</button></div></div>{children.length>0&&<div className="subcategoryList">{children.map(child=><div className="categoryRow" key={child.id}><div><b>↳ {child.name}</b><small>/{child.slug}</small></div><span className={child.active?"categoryActive":"categoryInactive"}>{child.active?text("सक्रिय","Active"):text("निष्क्रिय","Inactive")}</span><div className="categoryActions"><button onClick={()=>void edit(child)}>{text("संपादित करें","Edit")}</button><button onClick={()=>void toggle(child)}>{child.active?text("बंद करें","Disable"):text("चालू करें","Enable")}</button><button className="danger" onClick={()=>void remove(child)}>{text("हटाएँ","Delete")}</button></div></div>)}</div>}</article>
    })}</div>}
  </section>
}
