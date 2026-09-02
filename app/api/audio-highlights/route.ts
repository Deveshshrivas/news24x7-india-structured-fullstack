import {env} from "cloudflare:workers";
import {getChatGPTUser} from "../../chatgpt-auth";
import {can,getOrBootstrapRole} from "../../admin/roles";

type Track={id:number;title:string;object_key:string;filename:string;mime_type:string;size:number;active:number;position:number};

async function ready(){
 await env.DB.prepare(`CREATE TABLE IF NOT EXISTS audio_tracks (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,filename TEXT NOT NULL,mime_type TEXT NOT NULL,size INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1,position INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL)`).run();
}
async function manage(){const u=await getChatGPTUser();if(!u)return false;return can(await getOrBootstrapRole(u.email,u.displayName),"ऑडियो हाइलाइट्स")}
function output(x:Track){return{id:x.id,title:x.title,filename:x.filename,size:x.size,active:x.active,position:x.position,audioUrl:`/api/audio-highlights/file?id=${x.id}`}}

export async function GET(request:Request){
 await ready();
 const wantsAdmin=new URL(request.url).searchParams.get("admin")==="1";
 if(wantsAdmin&&!await manage())return Response.json({error:"Forbidden"},{status:403});
 const sql=wantsAdmin?"SELECT * FROM audio_tracks ORDER BY position ASC, created_at DESC":"SELECT * FROM audio_tracks WHERE active=1 ORDER BY position ASC, created_at DESC LIMIT 10";
 const result=await env.DB.prepare(sql).all<Track>();
 return Response.json({items:result.results.map(output),limit:10});
}

export async function POST(request:Request){
 if(!await manage())return Response.json({error:"Forbidden"},{status:403});
 await ready();
 const form=await request.formData();
 const file=form.get("audio");const title=String(form.get("title")||"").trim();
 if(!(file instanceof File)||!title)return Response.json({error:"Title and MP3 are required"},{status:400});
 const valid=file.type==="audio/mpeg"||file.type==="audio/mp3"||file.name.toLowerCase().endsWith(".mp3");
 if(!valid)return Response.json({error:"Only MP3 files are allowed"},{status:415});
 if(file.size>25*1024*1024)return Response.json({error:"MP3 must be 25 MB or smaller"},{status:413});
 const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");const key=`news-audio/${Date.now()}-${crypto.randomUUID()}-${safe}`;
 await env.BUCKET.put(key,file.stream(),{httpMetadata:{contentType:"audio/mpeg",contentDisposition:`inline; filename="${safe}"`}});
 const pos=await env.DB.prepare("SELECT COALESCE(MAX(position),0)+1 AS next FROM audio_tracks").first<{next:number}>();
 await env.DB.prepare("INSERT INTO audio_tracks(title,object_key,filename,mime_type,size,active,position,created_at) VALUES (?,?,?,?,?,1,?,?)").bind(title,key,file.name,"audio/mpeg",file.size,pos?.next||1,Date.now()).run();
 return Response.json({ok:true},{status:201});
}

export async function PATCH(request:Request){
 if(!await manage())return Response.json({error:"Forbidden"},{status:403});
 await ready();const b=await request.json() as {id?:number;title?:string;active?:boolean;direction?:"up"|"down"};
 if(!b.id)return Response.json({error:"ID required"},{status:400});
 if(typeof b.active==="boolean")await env.DB.prepare("UPDATE audio_tracks SET active=? WHERE id=?").bind(b.active?1:0,b.id).run();
 if(b.title?.trim())await env.DB.prepare("UPDATE audio_tracks SET title=? WHERE id=?").bind(b.title.trim(),b.id).run();
 if(b.direction){
  const current=await env.DB.prepare("SELECT id,position FROM audio_tracks WHERE id=?").bind(b.id).first<{id:number;position:number}>();
  if(current){const op=b.direction==="up"?"<":">";const order=b.direction==="up"?"DESC":"ASC";const other=await env.DB.prepare(`SELECT id,position FROM audio_tracks WHERE position ${op} ? ORDER BY position ${order} LIMIT 1`).bind(current.position).first<{id:number;position:number}>();if(other)await env.DB.batch([env.DB.prepare("UPDATE audio_tracks SET position=? WHERE id=?").bind(other.position,current.id),env.DB.prepare("UPDATE audio_tracks SET position=? WHERE id=?").bind(current.position,other.id)])}
 }
 return Response.json({ok:true});
}

export async function DELETE(request:Request){
 if(!await manage())return Response.json({error:"Forbidden"},{status:403});
 await ready();const id=Number(new URL(request.url).searchParams.get("id"));
 const row=await env.DB.prepare("SELECT object_key FROM audio_tracks WHERE id=?").bind(id).first<{object_key:string}>();
 if(row){await env.BUCKET.delete(row.object_key);await env.DB.prepare("DELETE FROM audio_tracks WHERE id=?").bind(id).run()}
 return Response.json({ok:true});
}
