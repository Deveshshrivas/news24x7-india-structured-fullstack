import {GridFSBucket,ObjectId,type Db} from 'mongodb';
import {Writable,PassThrough,Readable} from 'node:stream';
import {config} from './config.js';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const uploadsRoot=fileURLToPath(new URL('../../uploads/',import.meta.url));
const extensions:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif','video/mp4':'mp4','video/webm':'webm','audio/mpeg':'mp3'};
export function uploadPath(id:ObjectId,contentType:string,date=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit'}).formatToParts(date);
 const ext=extensions[contentType];if(!ext)throw Error('Unsupported media type');
 return `${parts.find(p=>p.type==='year')!.value}/${parts.find(p=>p.type==='month')!.value}/private-${id.toHexString()}.${ext}`;
}
function resolveMedia(relative:string){
 if(!/^\d{4}\/\d{2}\/private-[a-f0-9]{24}\.(jpg|png|webp|gif|avif|mp4|webm|mp3)$/.test(relative))throw Error('Invalid media path');
 return path.join(uploadsRoot,relative);
}
// Keep existing API URLs and access checks; old GridFS files remain readable.
export function mediaStore(db:Db,bucketName:string){
 const legacy=config.databaseEngine==='mysql'?null:new GridFSBucket(db,{bucketName}),records=db.collection('local_uploads');
 const legacyFind=(id:ObjectId)=>legacy?legacy.find({_id:id}).next():db.collection(bucketName+'.files').findOne({_id:id});
 function legacyStream(id:ObjectId,options?:{start?:number;end?:number}){
  if(legacy)return legacy.openDownloadStream(id,options);
  const output=new PassThrough();
  void(async()=>{
   const file=await legacyFind(id);if(!file)throw Error('Media not found');
   const chunks=await db.collection(bucketName+'.chunks').find({files_id:id}).sort({n:1}).toArray();
   const data=Buffer.concat(chunks.map(chunk=>Buffer.from(chunk.data.buffer)));
   if(data.length!==Number(file.length))throw Error('Incomplete media');
   if(!output.destroyed)Readable.from(data.subarray(options?.start||0,options?.end??data.length)).pipe(output);
  })().catch(error=>output.destroy(error));return output;
 }
 return {
  openUploadStream(filename:string,{contentType}:{contentType:string}){
   const id=new ObjectId(),relative=uploadPath(id,contentType),full=resolveMedia(relative),chunks:Buffer[]=[];
   const stream=new Writable({write(chunk,_encoding,done){chunks.push(Buffer.from(chunk));done()},final(done){
    void (async()=>{
     await mkdir(path.dirname(full),{recursive:true});
     const data=Buffer.concat(chunks);await writeFile(full,data,{flag:'wx'});
     try{await records.insertOne({_id:id,bucket:bucketName,path:relative,filename,contentType,length:data.length,uploadDate:new Date()})}
     catch(error){await unlink(full).catch(()=>undefined);throw error}
    })().then(()=>done(),done);
   }});
   return Object.assign(stream,{id});
  },
  find(filter:{_id:ObjectId}){return {next:async()=>await records.findOne({...filter,bucket:bucketName})??await legacyFind(filter._id)}},
  openDownloadStream(id:ObjectId,options?:{start?:number;end?:number}){
   const output=new PassThrough();
   void (async()=>{
    const record=await records.findOne({_id:id,bucket:bucketName});
    if(output.destroyed)return;
    const source=record?createReadStream(resolveMedia(record.path),{start:options?.start,end:options?.end===undefined?undefined:options.end-1}):legacyStream(id,options);
    output.on('close',()=>source.destroy());source.on('error',error=>output.destroy(error)).pipe(output);
   })().catch(error=>output.destroy(error));
   return output;
  },
  async delete(id:ObjectId){
   const record=await records.findOne({_id:id,bucket:bucketName});
   if(!record){if(legacy)await legacy.delete(id);else{await db.collection(bucketName+'.chunks').deleteMany({files_id:id});await db.collection(bucketName+'.files').deleteOne({_id:id})}return}
   await unlink(resolveMedia(record.path)).catch(error=>{if(error.code!=='ENOENT')throw error});
   await records.deleteOne({_id:id,bucket:bucketName});
  }
 };
}
