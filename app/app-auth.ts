import {cookies} from "next/headers";
export type AppUser={id:string;name:string;email:string;role:"super_admin"|"admin"|"editor"|"reporter"|"ad_manager";active:boolean;avatar?:string};
export async function getAppUser():Promise<AppUser|null>{const jar=await cookies();const raw=jar.toString();if(!raw)return null;try{const r=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/auth/me`,{headers:{cookie:raw},cache:"no-store"});if(!r.ok)return null;return (await r.json()).user}catch{return null}}
