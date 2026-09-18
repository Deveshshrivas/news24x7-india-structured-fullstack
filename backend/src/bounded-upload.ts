import type {StorageEngine} from 'multer';
import {AppError} from './utils.js';
// Enforce limits WHILE receiving files, rather than after buffering up to 440 MB.
export function boundedArticleStorage():StorageEngine{
 const totals=new WeakMap<object,number>();
 return {
  _handleFile(req,file,callback){const chunks:Buffer[]=[];let size=0,settled=false;const max=(file.fieldname==='videos'?40:8)*1024*1024;
   const fail=(error:Error)=>{if(settled)return;settled=true;chunks.length=0;file.stream.resume();callback(error)};
   file.stream.on('data',(chunk:Buffer)=>{if(settled)return;size+=chunk.length;const total=(totals.get(req)||0)+chunk.length;totals.set(req,total);if(size>max||total>80*1024*1024){fail(new AppError(413,'Each photo must be 8 MB or smaller; videos 40 MB; combined media 80 MB'));return}chunks.push(chunk)});
   file.stream.once('error',fail);file.stream.once('end',()=>{if(!settled){settled=true;callback(null,{buffer:Buffer.concat(chunks),size})}});
  },
  _removeFile(_req,file,callback){delete (file as Partial<Express.Multer.File>).buffer;callback(null)}
 }
}
