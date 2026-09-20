import {createHash,randomUUID} from 'node:crypto';
import {readdir,lstat,realpath,mkdir,writeFile,rename,unlink,link} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {ObjectId,BSON,type Document} from 'mongodb';
import type {RowDataPacket} from 'mysql2/promise';
import {mysqlPool} from './mysql-database.js';
import {db} from './database.js';
import {uploadsRoot,uploadPath,mediaStore} from './local-media.js';
import {AppError} from './utils.js';

export const mediaMimes:Record<string,string>={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',avif:'image/avif',mp4:'video/mp4',webm:'video/webm',mp3:'audio/mpeg'};
export type LibraryItem=RowDataPacket&{id:string;path:string|null;bucket:string|null;file_id:string|null;source:'disk'|'gridfs';filename:string;title:string;alt_text:string;caption:string;type:'image'|'video'|'audio';mime:string;bytes:number;year:string;month:string;modified_at:Date;owner_id:string|null;usage_count:number;deleted_at:Date|null;trash_path:string|null};
export const catalogState={running:false,indexed:0,lastCompleted:0,error:''};
let schema:Promise<void>|undefined;
const key=(value:string)=>createHash('sha256').update(value).digest('hex').slice(0,24);
const logicalKey=(relative:string,bucket?:string,fileId?:string)=>key(bucket&&fileId?`blob:${bucket}:${fileId}`:`disk:${relative}`);
export function initMediaLibrary(){return schema??=mysqlPool.query(`CREATE TABLE IF NOT EXISTS media_library (
 id CHAR(24) CHARACTER SET ascii PRIMARY KEY,path VARCHAR(512) COLLATE utf8mb4_bin NULL,bucket VARCHAR(64) NULL,file_id CHAR(24) NULL,
 source ENUM('disk','gridfs') NOT NULL,filename VARCHAR(512) NOT NULL,title VARCHAR(300) NOT NULL DEFAULT '',alt_text VARCHAR(500) NOT NULL DEFAULT '',caption TEXT NOT NULL,
 type ENUM('image','video','audio') NOT NULL,mime VARCHAR(80) NOT NULL,bytes BIGINT UNSIGNED NOT NULL,year CHAR(4) NOT NULL,month CHAR(2) NOT NULL,
 modified_at DATETIME(3) NOT NULL,owner_id CHAR(24) NULL,usage_count INT UNSIGNED NOT NULL DEFAULT 0,deleted_at DATETIME(3) NULL,trash_path VARCHAR(768) NULL,seen_at DATETIME(3) NOT NULL,missing BOOLEAN NOT NULL DEFAULT FALSE,
 UNIQUE KEY file_path(path),KEY listing(deleted_at,year,month,modified_at,id),KEY owner_listing(owner_id,deleted_at,modified_at),KEY type_listing(type,deleted_at,modified_at)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_ci`).then(async()=>{const [columns]=await mysqlPool.query<RowDataPacket[]>("SHOW COLUMNS FROM media_library LIKE 'missing'");if(!columns.length)await mysqlPool.query('ALTER TABLE media_library ADD COLUMN missing BOOLEAN NOT NULL DEFAULT FALSE')}).catch(error=>{schema=undefined;throw error})}
export function fileType(mime:string):LibraryItem['type']{return mime.startsWith('image/')?'image':mime.startsWith('video/')?'video':'audio'}
export function validateMedia(file:Express.Multer.File){
 const b=file.buffer,m=file.mimetype,ext=path.extname(file.originalname).slice(1).toLowerCase();
 if(!mediaMimes[ext]||mediaMimes[ext]!==m)throw new AppError(415,'Use JPG, PNG, WebP, GIF, AVIF, MP4, WebM or MP3 with the correct extension');
 const valid=m==='image/jpeg'?b[0]===255&&b[1]===216:m==='image/png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):m==='image/webp'?b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP':m==='image/gif'?/^GIF8[79]a$/.test(b.toString('ascii',0,6)):m==='video/webm'?b.subarray(0,4).equals(Buffer.from([26,69,223,163])):m==='video/mp4'||m==='image/avif'?b.toString('ascii',4,8)==='ftyp':m==='audio/mpeg'?b.toString('ascii',0,3)==='ID3'||b[0]===255&&(b[1]!&224)===224:false;
 if(!valid)throw new AppError(415,'File contents do not match its media type');
 const max=fileType(m)==='image'?8:fileType(m)==='video'?40:25;
 if(file.size>max*1024*1024)throw new AppError(413,`This media type supports at most ${max} MB`);
}
export async function safeFile(relative:string,exists=true){
 if(!/^\d{4}\/(?:0[1-9]|1[0-2])\/[^/\\]+\.(jpe?g|png|webp|gif|avif|mp4|webm|mp3)$/i.test(relative)||relative.includes('\0'))throw new AppError(400,'Invalid media path');
 const root=await realpath(uploadsRoot),parent=path.dirname(path.join(root,relative)),resolvedParent=await realpath(parent);
 if(resolvedParent!==root&&!resolvedParent.startsWith(root+path.sep))throw new AppError(400,'Media path escapes uploads');
 const full=path.join(resolvedParent,path.basename(relative));
 if(exists){const info=await lstat(full);if(!info.isFile()||info.isSymbolicLink())throw new AppError(400,'Not a regular media file')}
 else{try{const info=await lstat(full);if(info.isSymbolicLink())throw new AppError(400,'Symbolic links are not allowed')}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e}}
 return full;
}
function relativeUrl(value:string){
 try{const u=new URL(value,'http://local.invalid'),marker=u.pathname.includes('/api/backend/uploads/')?'/api/backend/uploads/':u.pathname.includes('/wp-content/uploads/')?'/wp-content/uploads/':u.pathname.startsWith('/uploads/')?'/uploads/':null;if(!marker)return null;const relative=decodeURIComponent(u.pathname.split(marker)[1]!);return /^\d{4}\/\d{2}\/[^/\\]+$/.test(relative)?relative:null}catch{return null}
}
type Reference={collection:string;id:ObjectId;title:string;owner?:string};
export async function mediaReferences(target?:LibraryItem){
 const refs=new Map<string,Reference[]>();
 const add=(asset:string,ref:Reference)=>{const list=refs.get(asset)||[];if(!list.some(r=>r.collection===ref.collection&&r.id.equals(ref.id)))list.push(ref);refs.set(asset,list)};
 let candidates:Document[]|undefined;
 if(target){const needle=target.file_id||target.path!;const terms=[needle,needle.split('/').map(encodeURIComponent).join('/')];const [rows]=await mysqlPool.query<RowDataPacket[]>("SELECT document FROM mongo_articles_906c7ff47cd7 WHERE document LIKE ? ESCAPE '!' OR document LIKE ? ESCAPE '!'",terms.map(value=>'%'+value.replace(/[!%_]/g,'!$&')+'%'));candidates=rows.map(row=>BSON.EJSON.parse(row.document,{relaxed:false}))}
 for await(const a of candidates??db.collection('articles').find({},{projection:{_id:1,title:1,author_id:1,image_url:1,seo_image_url:1,image_file_id:1,legacy_image_urls:1,legacy_html:1,body:1,media:1,video_url:1,youtube_url:1}})){
  const ref={collection:'articles',id:a._id,title:a.title||'News',owner:a.author_id?String(a.author_id):undefined};
  for(const field of ['image_url','seo_image_url','video_url'])if(typeof a[field]==='string'){const r=relativeUrl(a[field]);if(r)add('disk:'+r,ref)}
  for(const value of a.legacy_image_urls||[]){const r=relativeUrl(value);if(r)add('disk:'+r,ref)}
  for(const field of ['legacy_html','body'])for(const match of String(a[field]||'').matchAll(/(?:https?:\/\/[^\s"'<>]+)?\/(?:api\/backend\/uploads|wp-content\/uploads|uploads)\/\d{4}\/\d{2}\/[^\s"'<>]+/g)){const r=relativeUrl(match[0]);if(r)add('disk:'+r,ref)}
  if(a.image_file_id)add('blob:article_images:'+a.image_file_id,ref);
  for(const m of a.media||[])if(m.file_id)add('blob:article_images:'+m.file_id,ref);
 }
 for(const [collection,bucket,field]of [['reporters','reporter_photos','photo_file_id'],['audio_tracks','audio_files','file_id']])for await(const row of db.collection(collection!).find({}))if(row[field!])add(`blob:${bucket}:${row[field!]}`,{collection:collection!,id:row._id,title:row.name||row.title||'Media'});
 for await(const ad of candidates??db.collection('ads').find({},{projection:{_id:1,name:1,imageId:1,owner_id:1}})){
  if(ad.imageId){
   const ref={collection:'ads',id:ad._id,title:ad.name||'Ad',owner:ad.owner_id?String(ad.owner_id):undefined};
   add('blob:ad_banners:'+ad.imageId,ref);
  }
 }
 return refs;
}
const referenceKey=(item:Pick<LibraryItem,'bucket'|'file_id'|'path'>)=>item.bucket&&item.file_id?`blob:${item.bucket}:${item.file_id}`:'disk:'+item.path;
export async function usage(item:LibraryItem){return(await mediaReferences(item)).get(referenceKey(item))||[]}
async function upsertRows(rows:unknown[][]){if(!rows.length)return;await mysqlPool.query(`INSERT INTO media_library (id,path,bucket,file_id,source,filename,title,alt_text,caption,type,mime,bytes,year,month,modified_at,owner_id,usage_count,seen_at) VALUES ? ON DUPLICATE KEY UPDATE path=VALUES(path),source=VALUES(source),bytes=VALUES(bytes),mime=VALUES(mime),usage_count=VALUES(usage_count),owner_id=COALESCE(owner_id,VALUES(owner_id)),seen_at=VALUES(seen_at),missing=FALSE`,[rows]);catalogState.indexed+=rows.length}
export async function syncMediaLibrary(){
 if(catalogState.running)return;
 catalogState.running=true;catalogState.indexed=0;catalogState.error='';
 let connection;
 try{
  await initMediaLibrary();connection=await mysqlPool.getConnection();const [[lock]]=await connection.query<RowDataPacket[]>("SELECT GET_LOCK('news24x7_media_catalog',0) AS acquired");if(!lock!.acquired)return;
 const scanStarted=new Date(),refs=await mediaReferences(),records=await db.collection('local_uploads').find({}).toArray();
  const privatePaths=new Map(records.map(r=>[r.path,r]));let batch:unknown[][]=[];
  const flush=async()=>{const pending=batch;batch=[];await upsertRows(pending)};
  for(const year of await readdir(uploadsRoot,{withFileTypes:true})){
   if(!year.isDirectory()||year.isSymbolicLink()||!/^\d{4}$/.test(year.name))continue;
   for(const month of await readdir(path.join(uploadsRoot,year.name),{withFileTypes:true})){
    if(!month.isDirectory()||month.isSymbolicLink()||!/^(0[1-9]|1[0-2])$/.test(month.name))continue;
    for(const entry of await readdir(path.join(uploadsRoot,year.name,month.name),{withFileTypes:true})){
     if(!entry.isFile()||entry.isSymbolicLink()||entry.name.startsWith('.'))continue;
     const mime=mediaMimes[path.extname(entry.name).slice(1).toLowerCase()];if(!mime)continue;
     const relative=[year.name,month.name,entry.name].join('/'),record=privatePaths.get(relative),info=await lstat(path.join(uploadsRoot,relative));
     const fileId=record?String(record._id):null,bucket=record?.bucket||null,linked=refs.get(record?`blob:${bucket}:${fileId}`:'disk:'+relative)||[];
     const id=logicalKey(relative,bucket||undefined,fileId||undefined),name=record?.filename||entry.name;
     batch.push([id,relative,bucket,fileId,'disk',name,'','','',fileType(mime),mime,info.size,year.name,month.name,record?.uploadDate||info.mtime,record?.owner_id?String(record.owner_id):linked.find(r=>r.owner)?.owner||null,linked.length,new Date()]);
     if(batch.length>=400)await flush();
    }
   }
  }
  await flush();
  for(const bucket of ['article_images','reporter_photos','audio_files','ad_banners'])for await(const file of db.collection(bucket+'.files').find({})){
   if(records.some(r=>r.bucket===bucket&&String(r._id)===String(file._id)))continue;
   const mime=file.contentType||mediaMimes[path.extname(file.filename||'').slice(1).toLowerCase()];if(!mime)continue;
   const date=file.uploadDate instanceof Date?file.uploadDate:new Date(),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).formatToParts(date),linked=refs.get(`blob:${bucket}:${file._id}`)||[];
   batch.push([logicalKey('',bucket,String(file._id)),null,bucket,String(file._id),'gridfs',file.filename||'Media','','','',fileType(mime),mime,Number(file.length),parts.find(p=>p.type==='year')!.value,parts.find(p=>p.type==='month')!.value,date,linked.find(r=>r.owner)?.owner||null,linked.length,new Date()]);
  }
  await flush();await mysqlPool.execute('UPDATE media_library SET missing=TRUE WHERE deleted_at IS NULL AND seen_at<?',[scanStarted]);catalogState.lastCompleted=Date.now();
 }catch(error){catalogState.error='Media indexing failed. Check backend logs.';console.error('Media indexing failed',error instanceof Error?error.message:'Unknown error')}
 finally{if(connection){await connection.query("SELECT RELEASE_LOCK('news24x7_media_catalog')").catch(()=>undefined);connection.release()}catalogState.running=false}
}
export async function libraryItem(id:string){if(!/^[a-f0-9]{24}$/.test(id))throw new AppError(400,'Invalid media ID');await initMediaLibrary();const [[item]]=await mysqlPool.query<LibraryItem[]>('SELECT * FROM media_library WHERE id=?',[id]);if(!item)throw new AppError(404,'Media not found');return item}
export function mediaResponse(item:LibraryItem){return{id:item.id,filename:item.filename,title:item.title,altText:item.alt_text,caption:item.caption,type:item.type,mime:item.mime,size:Number(item.bytes),year:item.year,month:item.month,modifiedAt:item.modified_at,usageCount:item.usage_count,deletedAt:item.deleted_at,source:item.source,url:`/api/backend/media/${item.id}/file?v=${item.modified_at.getTime()}`,publicUrl:item.path&&!path.basename(item.path).startsWith('private-')?'/api/backend/uploads/'+item.path.split('/').map(encodeURIComponent).join('/')+`?v=${item.modified_at.getTime()}`:null}}
export async function uploadLibraryFile(file:Express.Multer.File,ownerId:string){
 validateMedia(file);const oid=new ObjectId(),relative=uploadPath(oid,file.mimetype).replace('private-',''),parent=path.join(uploadsRoot,path.dirname(relative));await mkdir(parent,{recursive:true});const full=await safeFile(relative,false);
 await writeFile(full,file.buffer,{flag:'wx'});const id=logicalKey(relative),now=new Date();
 try{await initMediaLibrary();await upsertRows([[id,relative,null,null,'disk',file.originalname,'','','',fileType(file.mimetype),file.mimetype,file.size,...relative.split('/').slice(0,2),now,ownerId,0,now]])}catch(e){await unlink(full).catch(()=>undefined);throw e}
 return libraryItem(id);
}
export async function updateLibraryFile(item:LibraryItem,fields:{title:string;altText:string;caption:string},file?:Express.Multer.File){
 if(item.deleted_at)throw new AppError(409,'Restore this file before editing');
 if(file){validateMedia(file);if(file.mimetype!==item.mime)throw new AppError(415,'Replacement must use the same file format to preserve existing URLs')}
 if(file&&item.source==='gridfs'){
  const relative=uploadPath(new ObjectId(item.file_id!),file.mimetype),full=path.join(uploadsRoot,relative);await mkdir(path.dirname(full),{recursive:true});await safeFile(relative,false);await writeFile(full,file.buffer,{flag:'wx'});
  let inserted=false;try{await db.collection('local_uploads').insertOne({_id:new ObjectId(item.file_id!),bucket:item.bucket,path:relative,filename:item.filename,contentType:item.mime,length:file.size,uploadDate:new Date()});inserted=true;await mysqlPool.execute("UPDATE media_library SET path=?,source='disk' WHERE id=?",[relative,item.id]);item.path=relative;item.source='disk'}catch(e){if(inserted)await db.collection('local_uploads').deleteOne({_id:new ObjectId(item.file_id!),bucket:item.bucket});await unlink(full).catch(()=>undefined);throw e}
 }else if(file){
  const full=await safeFile(item.path!),versions=path.join(uploadsRoot,'.versions',item.id);await mkdir(versions,{recursive:true});const old=path.join(versions,randomUUID()+path.extname(full)),temp=full+'.'+randomUUID()+'.part';
  await writeFile(temp,file.buffer,{flag:'wx'});
  try{await rename(full,old);try{await rename(temp,full)}catch(e){await rename(old,full);throw e}}finally{await unlink(temp).catch(()=>undefined)}
  if(item.bucket)await db.collection('local_uploads').updateOne({_id:new ObjectId(item.file_id!),bucket:item.bucket},{$set:{length:file.size}});
 }
 const now=new Date();await mysqlPool.execute('UPDATE media_library SET title=?,alt_text=?,caption=?,bytes=?,modified_at=? WHERE id=?',[fields.title,fields.altText,fields.caption,file?.size??Number(item.bytes),now,item.id]);
 if(file){for(const ref of await usage(item)){await db.collection(ref.collection).updateOne({_id:ref.id},{$set:{updated_at:now,...(ref.collection==='audio_tracks'?{size:file.size}:{})}})}}
 return libraryItem(item.id);
}
export async function trashLibraryFile(item:LibraryItem){
 if(item.deleted_at)throw new AppError(409,'Already in trash');const references=await usage(item);if(references.length)throw new AppError(409,`File is used by ${references.length} news/profile/audio record(s). Remove those references before deleting.`);
 let trash:string|null=null;
 if(item.path){const full=await safeFile(item.path),relative=path.posix.join('.trash',item.id,randomUUID()+path.extname(item.path));const dest=path.join(uploadsRoot,relative);await mkdir(path.dirname(dest),{recursive:true});await rename(full,dest);trash=relative;
  try{await mysqlPool.execute('UPDATE media_library SET deleted_at=?,trash_path=? WHERE id=?',[new Date(),trash,item.id])}catch(e){await rename(dest,full);throw e}
 }else await mysqlPool.execute('UPDATE media_library SET deleted_at=? WHERE id=?',[new Date(),item.id]);
}
export async function restoreLibraryFile(item:LibraryItem){
 if(!item.deleted_at)throw new AppError(409,'File is not in trash');
 if(item.path){if(!item.trash_path||!/^\.trash\/[a-f0-9]{24}\/[a-f0-9-]+\.[a-z0-9]+$/.test(item.trash_path))throw new AppError(400,'Invalid trash path');const trash=path.join(uploadsRoot,item.trash_path),full=await safeFile(item.path,false),root=await realpath(uploadsRoot),resolved=await realpath(trash);if(!resolved.startsWith(root+path.sep+'.trash'+path.sep))throw new AppError(400,'Invalid trash target');await link(resolved,full);try{await mysqlPool.execute('UPDATE media_library SET deleted_at=NULL,trash_path=NULL WHERE id=?',[item.id])}catch(e){await unlink(full).catch(()=>undefined);throw e}await unlink(resolved).catch(()=>undefined)}
 else await mysqlPool.execute('UPDATE media_library SET deleted_at=NULL WHERE id=?',[item.id]);return libraryItem(item.id);
}
export async function permanentDeleteLibraryFile(item:LibraryItem){
 if(!item.deleted_at)throw new AppError(409,'File must be moved to trash first');
 if(item.path && item.trash_path){
  const trash=path.join(uploadsRoot,item.trash_path);
  await unlink(trash).catch(()=>undefined);
 }
 if(item.bucket && item.file_id){
  try { await mediaStore(db,item.bucket).delete(new ObjectId(item.file_id)); } catch(e){}
 }
 await mysqlPool.execute('DELETE FROM media_library WHERE id=?',[item.id]);
}
export function diskStream(item:LibraryItem,full:string,start=0,end=Number(item.bytes)-1){return createReadStream(full,{start,end})}
