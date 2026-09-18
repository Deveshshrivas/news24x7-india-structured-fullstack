// Read-only audit: no database updates and no file moves.
import {readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {client,db} from '../src/database.ts';
const root=fileURLToPath(new URL('../../uploads/',import.meta.url));
const files=new Map(),names=new Map(),folded=new Map();
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name);
 if(entry.isDirectory())await walk(full);
 else if(entry.isFile()){
  const relative=path.relative(root,full).split(path.sep).join('/');
  files.set(relative,(await stat(full)).size);
  names.set(entry.name,[...(names.get(entry.name)||[]),relative]);
  folded.set(relative.toLowerCase(),[...(folded.get(relative.toLowerCase())||[]),relative]);
 }
}}
await walk(root);
const counts={},hosts={},samples={},unique=new Set();
function check(value,field){
 let state='empty';
 if(value){
  try{
   const u=new URL(value,'http://local.invalid');hosts[u.hostname]=(hosts[u.hostname]||0)+1;
   const marker='/wp-content/uploads/';
   if(!['news24x7india.com','www.news24x7india.com'].includes(u.hostname)||!u.pathname.includes(marker))state='other_or_local';
   else {
    const rel=decodeURIComponent(u.pathname.split(marker)[1]);unique.add(rel);
    if(rel.split('/').some(p=>p==='..'||p==='.')||rel.includes('\\'))state='unsafe_path';
    else if(files.has(rel))state=files.get(rel)>0?'exact_match':'empty_file';
    else if(folded.has(rel.toLowerCase()))state='case_mismatch';
    else state=names.has(path.posix.basename(rel))?'same_name_wrong_folder':'missing';
   }
  }catch{state='invalid_url'}
 }
 const key=field+':'+state;counts[key]=(counts[key]||0)+1;
 if(!['exact_match','empty'].includes(state)){samples[key]??=[];if(samples[key].length<4)samples[key].push(value)}
}
try{
 await client.connect();
 let articles=0;
 for await(const a of db.collection('articles').find({},{projection:{image_url:1,legacy_image_urls:1,media:1}})){
  articles++;check(a.image_url,'cover');
  for(const url of a.legacy_image_urls||[])check(url,'archived');
  for(const m of a.media||[])if(m.url)check(m.url,'media');
 }
 console.log(JSON.stringify({articles,localFiles:files.size,localBytes:[...files.values()].reduce((a,b)=>a+b,0),duplicateBasenames:[...names.values()].filter(v=>v.length>1).length,caseCollisions:[...folded.values()].filter(v=>v.length>1).length,uniqueReferencedPaths:unique.size,counts,hosts,samples},null,2));
}finally{await client.close()}
