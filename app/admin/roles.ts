import { env } from "cloudflare:workers";
export type AdminRole="super_admin"|"admin"|"editor"|"reporter"|"ad_manager";
export const roleLabels:Record<AdminRole,string>={super_admin:"सुपर एडमिन",admin:"एडमिन",editor:"मुख्य संपादक",reporter:"रिपोर्टर",ad_manager:"विज्ञापन प्रबंधक"};
export const permissions:Record<AdminRole,string[]>={
 super_admin:["डैशबोर्ड","समाचार","नई पोस्ट","श्रेणियाँ","रिपोर्टर","ब्रेकिंग न्यूज़","ऑडियो हाइलाइट्स","विज्ञापन","मीडिया लाइब्रेरी","टिप्पणियाँ","टीम और भूमिकाएँ","सेटिंग्स"],
 admin:["डैशबोर्ड","समाचार","नई पोस्ट","श्रेणियाँ","रिपोर्टर","ब्रेकिंग न्यूज़","ऑडियो हाइलाइट्स","विज्ञापन","मीडिया लाइब्रेरी","टिप्पणियाँ"],
 editor:["डैशबोर्ड","समाचार","नई पोस्ट","श्रेणियाँ","रिपोर्टर","ब्रेकिंग न्यूज़","ऑडियो हाइलाइट्स","मीडिया लाइब्रेरी","टिप्पणियाँ"],
 reporter:["डैशबोर्ड","समाचार","नई पोस्ट","मीडिया लाइब्रेरी"],
 ad_manager:["डैशबोर्ड","विज्ञापन","मीडिया लाइब्रेरी"],
};
export async function initAdminUsers(){await env.DB.prepare(`CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('super_admin','admin','editor','reporter','ad_manager')), active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL)`).run();}
export async function getOrBootstrapRole(email:string,name:string):Promise<AdminRole|null>{await initAdminUsers();const existing=await env.DB.prepare("SELECT role,active FROM admin_users WHERE lower(email)=lower(?)").bind(email).first<{role:AdminRole;active:number}>();if(existing)return existing.active?existing.role:null;const count=await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_users").first<{count:number}>();if((count?.count??0)===0){await env.DB.prepare("INSERT INTO admin_users(email,name,role,active,created_at) VALUES (?,?, 'super_admin',1,?)").bind(email,name,Date.now()).run();return "super_admin"}return null;}
export function can(role:AdminRole|null,section:string){return !!role&&permissions[role].includes(section)}
