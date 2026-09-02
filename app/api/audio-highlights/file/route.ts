import {env} from "cloudflare:workers";
import {getChatGPTUser} from "../../../chatgpt-auth";
import {can,getOrBootstrapRole} from "../../../admin/roles";

export async function GET(request:Request){
 const id=Number(new URL(request.url).searchParams.get("id"));
 if(!id)return new Response("Not found",{status:404});
 const row=await env.DB.prepare("SELECT object_key,mime_type,filename,active FROM audio_tracks WHERE id=?").bind(id).first<{object_key:string;mime_type:string;filename:string;active:number}>();
 if(!row)return new Response("Not found",{status:404});
 if(!row.active){const user=await getChatGPTUser();const allowed=user&&can(await getOrBootstrapRole(user.email,user.displayName),"ऑडियो हाइलाइट्स");if(!allowed)return new Response("Not found",{status:404})}
 const object=await env.BUCKET.get(row.object_key);
 if(!object)return new Response("Not found",{status:404});
 const headers=new Headers();object.writeHttpMetadata(headers);headers.set("content-type",row.mime_type||"audio/mpeg");headers.set("content-disposition",`inline; filename="${row.filename.replace(/["\\]/g,"")}"`);headers.set("cache-control","public, max-age=3600");headers.set("etag",object.httpEtag);
 return new Response(object.body,{headers});
}
