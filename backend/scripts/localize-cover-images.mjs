// Exact paths only. No backup is created; user has an existing backup.
import {readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {client,db} from '../src/database.ts';
const root=fileURLToPath(new URL('../../uploads/',import.meta.url));
const apply=process.argv.includes('--apply');
const directories=new Map();
async function localUrl(value){
 try{
  const u=new URL(value);
  if(!['http:','https:'].includes(u.protocol)||!['news24x7india.com','www.news24x7india.com'].includes(u.hostname))return null;
  const rel=decodeURIComponent(u.pathname.replace(/^\/wp-content\/uploads\//,''));
  if(!u.pathname.startsWith('/wp-content/uploads/')||!/^\d{4}\/\d{2}\/[^/\\]+\.(jpe?g|png|webp|gif|avif)$/i.test(rel))return null;
  const folder=path.posix.dirname(rel),name=path.posix.basename(rel);
  if(!directories.has(folder))directories.set(folder,new Set(await readdir(path.join(root,folder)).catch(()=>[])));
  if(!directories.get(folder).has(name))return null;
  const info=await stat(path.join(root,rel));if(!info.isFile()||!info.size)return null;
  return '/api/backend/uploads/'+rel.split('/').map(encodeURIComponent).join('/');
 }catch{return null}
}
try{
 await client.connect();
 const changes=[];let scanned=0;
 for await(const a of db.collection('articles').find({image_file_id:{$exists:false},image_url:{$type:'string'}},{projection:{image_url:1}})){
  scanned++;const url=await localUrl(a.image_url);
  if(url)changes.push({id:a._id,old:a.image_url,url});
 }
 console.log(JSON.stringify({scanned,exactMatches:changes.length,apply}));
 if(changes.length){
  // Prove that the app proxy actually serves an image before changing data.
  const response=await fetch('http://127.0.0.1:5173'+changes[0].url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw Error('Local image serving verification failed; database unchanged');
  await response.arrayBuffer();
 }
 if(apply){
  let modified=0;
  for(let i=0;i<changes.length;i+=250){
   const result=await db.collection('articles').bulkWrite(changes.slice(i,i+250).map(c=>({updateOne:{filter:{_id:c.id,image_url:c.old,image_file_id:{$exists:false}},update:{$set:{image_url:c.url}}}})));
   modified+=result.modifiedCount;
  }
  console.log(JSON.stringify({modified,verifiedLocalCovers:await db.collection('articles').countDocuments({image_url:/^\/api\/backend\/uploads\//})}));
 }
}finally{await client.close()}
