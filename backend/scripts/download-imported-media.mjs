// Resumable migration: exact paths, no overwrite, bounded downloads, original URLs in manifest.
import {mkdir,stat,open,link,unlink,appendFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {client,db} from '../src/database.ts';
import {uploadsRoot} from '../src/local-media.ts';
const hosts=new Set(['news24x7india.com','www.news24x7india.com','adityabharat.com']);
const manifest=path.join(uploadsRoot,'.migration','remote-media.jsonl');
await mkdir(path.dirname(manifest),{recursive:true});
const memo=new Map();
const totals={articles:0,updated:0,downloaded:0,existing:0,unavailable:0,bytes:0};
const fields=['image_url','seo_image_url','legacy_image_urls','legacy_html','body','media','video_url'];
function target(value){
 try{const url=new URL(value.replace(/&amp;/g,'&'));
  if(!hosts.has(url.hostname)||!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;
  const relative=decodeURIComponent(url.pathname.replace(/^\/wp-content\/uploads\//,''));
  if(!url.pathname.startsWith('/wp-content/uploads/')||!/^\d{4}\/\d{2}\/(?!private-)[^/\\:*?"<>|%]+\.(jpe?g|png|webp|gif|avif|mp4|webm|mp3)$/i.test(relative))return null;
  // External sites get a separate filename namespace to avoid same-path collisions.
  const local=url.hostname==='adityabharat.com'?relative.replace(/([^/]+)$/,'adityabharat-$1'):relative;
  return {url,relative:local,isImage:/\.(jpe?g|png|webp|gif|avif)$/i.test(relative)};
 }catch{return null}
}
async function retrieve(value){
 const entry=target(value);if(!entry)return value;
 if(memo.has(entry.relative))return memo.get(entry.relative);
 const job=(async()=>{
  const destination=path.join(uploadsRoot,entry.relative);
  const local='/api/backend/uploads/'+entry.relative.split('/').map(encodeURIComponent).join('/');
  try{const info=await stat(destination);if(info.isFile()&&info.size){totals.existing++;return local}throw Error('Existing empty file requires review')}catch(e){if(e.code!=='ENOENT')throw e}
  await mkdir(path.dirname(destination),{recursive:true});
  const temp=destination+'.'+randomUUID()+'.part';
  let reason='';
  for(let attempt=0;attempt<2;attempt++){
   try{
    let current=new URL(entry.url);current.protocol='https:';
    let response;
    for(let hop=0;hop<4;hop++){
     if(!hosts.has(current.hostname)||current.port||current.protocol!=='https:')throw Error('Redirect host rejected');
     response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(20000)});
     if([301,302,303,307,308].includes(response.status)){const location=response.headers.get('location');await response.body?.cancel();if(!location)throw Error('Invalid redirect');current=new URL(location,current);continue}break;
    }
    if(!response?.ok){await response?.body?.cancel();throw Error('HTTP '+response?.status)}
    const type=response.headers.get('content-type')||'';
    if(!/^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm)|audio\/mpeg)(;|$)/i.test(type)){await response.body?.cancel();throw Error('Unexpected content type '+type)}
    let size=0;
    const limit=entry.isImage?20*1024*1024:80*1024*1024;
    await pipeline(Readable.fromWeb(response.body),new Transform({transform(chunk,_encoding,done){size+=chunk.length;done(size>limit?Error('File exceeds limit'):null,chunk)}}),createWriteStream(temp,{flags:'wx'}));
    if(!size)throw Error('Empty response');
    const file=await open(temp,'r');const prefix=Buffer.alloc(16);try{await file.read(prefix,0,16,0)}finally{await file.close()}
    if(entry.isImage&&!((prefix[0]===255&&prefix[1]===216)||prefix.subarray(1,4).toString()==='PNG'||prefix.subarray(0,3).toString()==='GIF'||prefix.subarray(8,12).toString()==='WEBP'||prefix.subarray(4,8).toString()==='ftyp'))throw Error('Invalid image bytes');
    try{await link(temp,destination)}catch(error){if(error.code!=='EEXIST')throw error}
    await unlink(temp);totals.downloaded++;totals.bytes+=size;
    await appendFile(manifest,JSON.stringify({source:value,local,status:'downloaded',bytes:size})+'\n');
    return local;
   }catch(error){reason=error.message;await unlink(temp).catch(()=>{});if(/HTTP 40[034]/.test(reason))break}
  }
  totals.unavailable++;
  const replacement=entry.isImage?'/media-unavailable.svg':local;
  await appendFile(manifest,JSON.stringify({source:value,local:replacement,status:'unavailable',reason})+'\n');
  return replacement;
 })();memo.set(entry.relative,job);return job;
}
async function replace(value){
 if(typeof value==='string'){
  let next=value;
  const urls=[...new Set(value.match(/https?:\/\/(?:www\.)?(?:news24x7india|adityabharat)\.com\/wp-content\/uploads\/[^\s"'<>\)]+/g)||[])];
  for(const url of urls)next=next.split(url).join(await retrieve(url));return next;
 }
 if(Array.isArray(value)){const result=[];for(const item of value)result.push(await replace(item));return result}
 if(value&&typeof value==='object'&&!value._bsontype){const next={...value};for(const key of ['url','image_url','video_url'])if(typeof next[key]==='string')next[key]=await replace(next[key]);return next}
 return value;
}
try{
 await client.connect();
 const projection={published_at:1,...Object.fromEntries(fields.map(f=>[f,1]))};
 const articles=await db.collection('articles').find({migration_source:'wordpress:news24x7india.com'},{projection}).toArray();
 articles.sort((a,b)=>Number(b.published_at)-Number(a.published_at));
 let index=0;
 const timer=setInterval(()=>console.log(JSON.stringify(totals)),15000);
 try{await Promise.all(Array.from({length:8},async()=>{
  while(index<articles.length){const row=articles[index++],set={},filter={_id:row._id};
   for(const field of fields){if(row[field]===undefined)continue;const next=await replace(row[field]);if(JSON.stringify(next)!==JSON.stringify(row[field])){set[field]=next;filter[field]=row[field]}}
   if(Object.keys(set).length){const r=await db.collection('articles').updateOne(filter,{$set:set});totals.updated+=r.modifiedCount}
   totals.articles++;
  }
 }))}finally{clearInterval(timer)}
 console.log('COMPLETE '+JSON.stringify(totals));
}finally{await client.close()}
