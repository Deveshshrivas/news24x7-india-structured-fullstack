import {readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {client,db} from '../src/database.ts';
import {uploadsRoot} from '../src/local-media.ts';
const apply=process.argv.includes('--apply'),folders=new Map(),cache=new Map();
let matched=0,missing=0;
async function mapUrl(url){
 if(cache.has(url))return cache.get(url);
 let result=url;
 try{
  const u=new URL(url),prefix='/wp-content/uploads/';
  if(!['news24x7india.com','www.news24x7india.com'].includes(u.hostname)||!u.pathname.startsWith(prefix))return url;
  const relative=decodeURIComponent(u.pathname.slice(prefix.length));
  if(!/^\d{4}\/\d{2}\/(?!private-)[^/\\]+\.(jpe?g|png|webp|gif|avif|mp4|webm|mp3)$/i.test(relative))return url;
  const folder=path.posix.dirname(relative);
  if(!folders.has(folder))folders.set(folder,new Set(await readdir(path.join(uploadsRoot,folder)).catch(()=>[])));
  if(folders.get(folder).has(path.posix.basename(relative))){
   const info=await stat(path.join(uploadsRoot,relative));
   if(info.isFile()&&info.size){result='/api/backend/uploads/'+relative.split('/').map(encodeURIComponent).join('/');matched++}
  }
  if(result===url)missing++;
 }catch{}
 cache.set(url,result);return result;
}
async function replaceText(value){
 let result=value;
 const urls=[...new Set(value.match(/https?:\/\/(?:www\.)?news24x7india\.com\/wp-content\/uploads\/[^\s"'<>\)]+/g)||[])];
 for(const url of urls){const replacement=await mapUrl(url);if(replacement!==url)result=result.split(url).join(replacement)}
 return result;
}
async function replace(value){
 if(typeof value==='string')return replaceText(value);
 if(Array.isArray(value))return Promise.all(value.map(replace));
 // Media objects: preserve IDs and other BSON values.
 if(value&&typeof value==='object'&&!value._bsontype){const next={...value};for(const key of ['url','image_url','video_url'])if(typeof next[key]==='string')next[key]=await replaceText(next[key]);return next}
 return value;
}
try{
 await client.connect();const plans=[];const counts={};
 const fields=['image_url','seo_image_url','legacy_image_urls','legacy_html','body','media','video_url'];
 for await(const row of db.collection('articles').find({migration_source:'wordpress:news24x7india.com'})){
  const set={},filter={_id:row._id};
  for(const field of fields){if(row[field]===undefined)continue;const next=await replace(row[field]);if(JSON.stringify(next)!==JSON.stringify(row[field])){set[field]=next;filter[field]=row[field];counts[field]=(counts[field]||0)+1}}
  if(Object.keys(set).length)plans.push({updateOne:{filter,update:{$set:set}}});
 }
 console.log(JSON.stringify({apply,articles:plans.length,fields:counts,uniqueMatchedUrls:matched,uniqueMissingUrls:missing}));
 if(apply){let modified=0;for(let i=0;i<plans.length;i+=100){const r=await db.collection('articles').bulkWrite(plans.slice(i,i+100));modified+=r.modifiedCount}console.log(JSON.stringify({modified,totalArticles:await db.collection('articles').countDocuments()}))}
}finally{await client.close()}
