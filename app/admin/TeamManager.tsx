"use client";

import {FormEvent,useEffect,useState} from "react";

type Role="super_admin"|"admin"|"editor"|"reporter"|"ad_manager";
type Member={id:string;email:string;name:string;role:Role;active:boolean};

const labels:Record<Role,string>={
  super_admin:"सुपर एडमिन",
  admin:"एडमिन",
  editor:"मुख्य संपादक",
  reporter:"रिपोर्टर",
  ad_manager:"विज्ञापन प्रबंधक",
};

export default function TeamManager({notify,currentEmail}:{notify:(message:string)=>void;currentEmail:string}){
  const[items,setItems]=useState<Member[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[creating,setCreating]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const response=await fetch("/api/backend/users",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.detail||"उपयोगकर्ता सूची लोड नहीं हुई");
      setItems(data.items??[]);
      setError("");
    }catch(caught){
      setError(caught instanceof Error?caught.message:"उपयोगकर्ता सूची लोड नहीं हुई");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    let cancelled=false;
    fetch("/api/backend/users",{cache:"no-store"})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.detail||"उपयोगकर्ता सूची लोड नहीं हुई");return data})
      .then(data=>{if(!cancelled){setItems(data.items??[]);setError("")}})
      .catch(caught=>{if(!cancelled)setError(caught instanceof Error?caught.message:"उपयोगकर्ता सूची लोड नहीं हुई")})
      .finally(()=>{if(!cancelled)setLoading(false)});
    return()=>{cancelled=true};
  },[]);

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setCreating(true);
    setError("");
    const form=event.currentTarget;
    const body=Object.fromEntries(new FormData(form));
    try{
      const response=await fetch("/api/backend/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.detail||"नया उपयोगकर्ता नहीं बन सका");
      form.reset();
      await load();
      notify("नया उपयोगकर्ता बनाया गया");
    }catch(caught){
      setError(caught instanceof Error?caught.message:"नया उपयोगकर्ता नहीं बन सका");
    }finally{
      setCreating(false);
    }
  }

  async function update(member:Member,data:{role?:Role;active?:boolean}){
    setError("");
    const response=await fetch(`/api/backend/users/${member.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({role:data.role??member.role,active:data.active??member.active})});
    const result=await response.json();
    if(!response.ok){setError(result.detail||"भूमिका अपडेट नहीं हुई");return}
    await load();
    notify("उपयोगकर्ता अपडेट हुआ");
  }

  return <section className="workspace">
    <div className="workspaceHead"><div><h2>टीम और भूमिकाएँ</h2><p>केवल सुपर एडमिन नए एडमिन बना सकता है और सभी उपयोगकर्ताओं की भूमिका या स्थिति बदल सकता है।</p></div><span className="superAdminOnly">सुपर एडमिन नियंत्रण</span></div>
    <form className="teamAdd" onSubmit={create}>
      <div className="teamAddIntro"><h3>नया उपयोगकर्ता बनाएँ</h3><p>सुरक्षित लॉगिन के लिए नाम, ईमेल, अस्थायी पासवर्ड और भूमिका निर्धारित करें।</p></div>
      <label>नाम<input name="name" required minLength={2} maxLength={80} autoComplete="name"/></label>
      <label>ईमेल<input name="email" required type="email" autoComplete="email"/></label>
      <label>अस्थायी पासवर्ड<input name="password" required type="password" minLength={8} maxLength={128} autoComplete="new-password"/></label>
      <label>भूमिका<select name="role" defaultValue="admin">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <button className="primary" disabled={creating}>{creating?"बन रहा है…":"＋ उपयोगकर्ता बनाएँ"}</button>
    </form>
    {error&&<div className="teamError" role="alert">{error}</div>}
    {loading?<p className="teamLoading">लोड हो रहा है...</p>:<div className="teamList">{items.map(member=>{
      const isCurrent=member.email.toLowerCase()===currentEmail.toLowerCase();
      return <article key={member.id}>
        <div className="teamAvatar">{member.name.slice(0,1).toUpperCase()}</div>
        <div><b>{member.name}{isCurrent&&<em className="currentUserTag">आप</em>}</b><small>{member.email}</small></div>
        <select aria-label={`${member.name} की भूमिका`} disabled={isCurrent} value={member.role} onChange={event=>void update(member,{role:event.target.value as Role})}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <button aria-label={`${member.name} की स्थिति बदलें`} title={isCurrent?"अपने खाते को निष्क्रिय नहीं किया जा सकता":undefined} disabled={isCurrent} className={member.active?"activeUser":"inactiveUser"} onClick={()=>void update(member,{active:!member.active})}>{isCurrent?"आपका खाता":member.active?"सक्रिय":"निष्क्रिय"}</button>
      </article>;
    })}</div>}
  </section>;
}
