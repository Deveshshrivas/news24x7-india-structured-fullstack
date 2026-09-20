"use client";

import {FormEvent,useEffect,useState,useCallback} from "react";

type Role="super_admin"|"admin"|"editor"|"reporter"|"ad_manager";
type Member={id:string;email:string;name:string;role:Role;active:boolean;updated_at?:string};

export default function TeamManager({notify,currentEmail,language,userRole}:{notify:(message:string)=>void;currentEmail:string;language:"hi"|"en";userRole?:string}){
  const text = useCallback((hi: string, en: string) => language === "en" ? en : hi, [language]);
  const isSuperAdmin=userRole==="super_admin";
  
  const allLabels:Record<Role,string>={
    super_admin: text("सुपर एडमिन", "Super Admin"),
    admin: text("एडमिन", "Admin"),
    editor: text("मुख्य संपादक", "Chief Editor"),
    reporter: text("रिपोर्टर", "Reporter"),
    ad_manager: text("विज्ञापन प्रबंधक", "Ad Manager"),
  };

  // Admin can only create these roles
  const adminAllowedRoles:Role[]=["editor","reporter","ad_manager"];
  const createLabels=isSuperAdmin?allLabels:Object.fromEntries(adminAllowedRoles.map(r=>[r,allLabels[r]])) as Record<string,string>;

  const[items,setItems]=useState<Member[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[creating,setCreating]=useState(false);

  async function load(){
    setLoading(true);
    try{
      const response=await fetch("/api/backend/users",{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.detail||text("उपयोगकर्ता सूची लोड नहीं हुई", "Failed to load user list"));
      setItems(data.items??[]);
      setError("");
    }catch(caught){
      // Admin can't list users, that's ok - just show empty
      if(!isSuperAdmin){setItems([]);setError("");} 
      else setError(caught instanceof Error?caught.message:text("उपयोगकर्ता सूची लोड नहीं हुई", "Failed to load user list"));
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{
    let cancelled=false;
    fetch("/api/backend/users",{cache:"no-store"})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.detail||text("उपयोगकर्ता सूची लोड नहीं हुई", "Failed to load user list"));return data})
      .then(data=>{if(!cancelled){setItems(data.items??[]);setError("")}})
      .catch(caught=>{if(!cancelled){if(!isSuperAdmin){setItems([]);setError("")}else setError(caught instanceof Error?caught.message:text("उपयोगकर्ता सूची लोड नहीं हुई", "Failed to load user list"))}})
      .finally(()=>{if(!cancelled)setLoading(false)});
    return()=>{cancelled=true};
  },[text,isSuperAdmin]);

  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setCreating(true);
    setError("");
    const form=event.currentTarget;
    const body=Object.fromEntries(new FormData(form));
    try{
      const response=await fetch("/api/backend/users",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
      const data=await response.json();
      if(!response.ok)throw new Error(data.detail||text("नया उपयोगकर्ता नहीं बन सका", "Could not create new user"));
      form.reset();
      if(isSuperAdmin) await load();
      notify(text("नया उपयोगकर्ता बनाया गया", "New user created"));
    }catch(caught){
      setError(caught instanceof Error?caught.message:text("नया उपयोगकर्ता नहीं बन सका", "Could not create new user"));
    }finally{
      setCreating(false);
    }
  }

  async function update(member:Member,data:{role?:Role;active?:boolean}){
    setError("");
    const response=await fetch(`/api/backend/users/${member.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({role:data.role??member.role,active:data.active??member.active})});
    const result=await response.json();
    if(!response.ok){setError(result.detail||text("भूमिका अपडेट नहीं हुई", "Role not updated"));return}
    await load();
    notify(text("उपयोगकर्ता अपडेट हुआ", "User updated"));
  }

  return <section className="workspace">
    <div className="workspaceHead"><div><h2>{text("टीम और भूमिकाएँ", "Team and Roles")}</h2><p>{isSuperAdmin?text("केवल सुपर एडमिन नए एडमिन बना सकता है और सभी उपयोगकर्ताओं की भूमिका या स्थिति बदल सकता है।", "Only Super Admin can create new admins and change roles or status of all users."):text("आप नए रिपोर्टर, संपादक या विज्ञापन प्रबंधक बना सकते हैं।", "You can create new reporters, editors or ad managers.")}</p></div><span className="superAdminOnly">{isSuperAdmin?text("सुपर एडमिन नियंत्रण", "Super Admin Control"):text("एडमिन नियंत्रण", "Admin Control")}</span></div>
    <form className="teamAdd" onSubmit={create}>
      <div className="teamAddIntro"><h3>{text("नया उपयोगकर्ता बनाएँ", "Create New User")}</h3><p>{text("सुरक्षित लॉगिन के लिए नाम, ईमेल, अस्थायी पासवर्ड और भूमिका निर्धारित करें।", "Set name, email, temp password and role for secure login.")}</p></div>
      <label>{text("नाम", "Name")}<input name="name" required minLength={2} maxLength={80} autoComplete="name"/></label>
      <label>{text("ईमेल", "Email")}<input name="email" required type="email" autoComplete="email"/></label>
      <label>{text("अस्थायी पासवर्ड", "Temporary Password")}<input name="password" required type="password" minLength={8} maxLength={128} autoComplete="new-password"/></label>
      <label>{text("भूमिका", "Role")}<select name="role" defaultValue={isSuperAdmin?"admin":"reporter"}>{Object.entries(createLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <button className="primary" disabled={creating}>{creating?text("बन रहा है…", "Creating..."):text("＋ उपयोगकर्ता बनाएँ", "＋ Create User")}</button>
    </form>
    {error&&<div className="teamError" role="alert">{error}</div>}
    {loading?<p className="teamLoading">{text("लोड हो रहा है...", "Loading...")}</p>:<div className="teamList">{items.map(member=>{
      const isCurrent=member.email.toLowerCase()===currentEmail.toLowerCase();
      return <article key={member.id}>
        <div className="teamAvatar">{member.name.slice(0,1).toUpperCase()}</div>
        <div><b>{member.name}{isCurrent&&<em className="currentUserTag">{text("आप", "You")}</em>}</b><small>{member.email}</small>{member.updated_at && <small style={{display:"block", color:"var(--muted)", fontSize:"11px", marginTop:"3px"}}>{text("अंतिम अपडेट: ", "Last updated: ")} {new Date(member.updated_at).toLocaleDateString()}</small>}</div>
        {isSuperAdmin?<select aria-label={text(`${member.name} की भूमिका`, `${member.name}'s role`)} disabled={isCurrent} value={member.role} onChange={event=>void update(member,{role:event.target.value as Role})}>{Object.entries(allLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:<span className="pill">{allLabels[member.role]}</span>}
        {isSuperAdmin?<button aria-label={text(`${member.name} की स्थिति बदलें`, `Change ${member.name}'s status`)} title={isCurrent?text("अपने खाते को निष्क्रिय नहीं किया जा सकता", "Cannot deactivate your own account"):undefined} disabled={isCurrent} className={member.active?"activeUser":"inactiveUser"} onClick={()=>void update(member,{active:!member.active})}>{isCurrent?text("आपका खाता", "Your account"):member.active?text("सक्रिय", "Active"):text("निष्क्रिय", "Inactive")}</button>:<span className={member.active?"activeUser":"inactiveUser"} style={{padding:"4px 12px",borderRadius:"6px",fontSize:"13px"}}>{member.active?text("सक्रिय", "Active"):text("निष्क्रिय", "Inactive")}</span>}
      </article>;
    })}</div>}
  </section>;
}
