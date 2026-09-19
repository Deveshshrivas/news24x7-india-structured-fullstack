import {Router} from 'express';
import multer from 'multer';
import {ObjectId} from 'mongodb';
import {z} from 'zod';
import type {RowDataPacket} from 'mysql2/promise';
import {authenticate} from '../security.js';
import type {AuthedRequest} from '../types.js';
import {AppError,asyncRoute,routeParam} from '../utils.js';
import {config} from '../config.js';
import {db} from '../database.js';
import {mediaStore} from '../local-media.js';
import {repairFilename} from '../filenames.js';
import {mysqlPool} from '../mysql-database.js';
import {catalogState,initMediaLibrary,syncMediaLibrary,libraryItem,mediaResponse,uploadLibraryFile,updateLibraryFile,trashLibraryFile,restoreLibraryFile,safeFile,diskStream,type LibraryItem} from '../media-library.js';

export const mediaRouter=Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:40*1024*1024,files:1,fields:5,fieldSize:4096}}).single('file');
const all=(req:AuthedRequest)=>['super_admin','admin','editor'].includes(req.user!.role);
const manage=(req:AuthedRequest,item:LibraryItem)=>['super_admin','admin'].includes(req.user!.role)||item.owner_id===String(req.user!._id);
function access(req:AuthedRequest,item:LibraryItem,write=false){if(!(write?manage(req,item):all(req)||item.owner_id===String(req.user!._id)))throw new AppError(403,'Insufficient permission')}
const output=(req:AuthedRequest,item:LibraryItem)=>({...mediaResponse(item),canManage:manage(req,item)});
mediaRouter.use(authenticate,(_req,_res,next)=>next(config.databaseEngine==='mysql'?undefined:new AppError(503,'Media catalog requires the configured MySQL database')));
mediaRouter.get('/',asyncRoute(async(req:AuthedRequest,res)=>{
 await initMediaLibrary();
 if(!catalogState.running&&Date.now()-catalogState.lastCompleted>30*60*1000){const [[recent]]=await mysqlPool.query<RowDataPacket[]>('SELECT MAX(seen_at) latest FROM media_library');if(!recent!.latest||Date.now()-new Date(recent!.latest).getTime()>30*60*1000)void syncMediaLibrary();else catalogState.lastCompleted=new Date(recent!.latest).getTime()}
 const where=['missing=FALSE','deleted_at IS '+(req.query.trash==='1'?'NOT NULL':'NULL')],values:unknown[]=[];
 if(!all(req)){where.push('owner_id=?');values.push(String(req.user!._id))}
 for(const field of ['type','year','month'])if(typeof req.query[field]==='string'&&req.query[field]){where.push(`${field}=?`);values.push(req.query[field])}
 const q=typeof req.query.q==='string'?req.query.q.trim().slice(0,120):'';
 if(q){where.push('(filename LIKE ? ESCAPE \'!\' OR title LIKE ? ESCAPE \'!\')');const term='%'+q.replace(/[!%_]/g,'!$&')+'%';values.push(term,term)}
 const condition=where.join(' AND ');
 const [[count]]=await mysqlPool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM media_library WHERE '+condition,values);
 const total=Number(count!.total),pages=Math.max(1,Math.ceil(total/24)),page=Math.min(pages,Math.max(1,Number(req.query.page)||1));
 const [rows]=await mysqlPool.query<LibraryItem[]>('SELECT * FROM media_library WHERE '+condition+' ORDER BY modified_at DESC,id DESC LIMIT 24 OFFSET ?',[...values,(Math.floor(page)-1)*24]);
 const [years]=await mysqlPool.query<RowDataPacket[]>('SELECT DISTINCT year FROM media_library'+(!all(req)?' WHERE owner_id=?':'')+' ORDER BY year DESC',!all(req)?[String(req.user!._id)]:[]);
 const [[lock]]=await mysqlPool.query<RowDataPacket[]>("SELECT IS_USED_LOCK('news24x7_media_catalog') AS busy");
 res.set('Cache-Control','no-store').json({items:rows.map(item=>output(req,item)),total,page:Math.floor(page),pages,years:years.map(row=>row.year),indexing:catalogState.running||Boolean(lock!.busy),indexed:catalogState.indexed,indexError:catalogState.error,canSync:all(req)});
}));
mediaRouter.post('/sync',asyncRoute(async(req:AuthedRequest,res)=>{if(!all(req))throw new AppError(403,'Insufficient permission');void syncMediaLibrary();res.status(202).json({indexing:true})}));
mediaRouter.post('/',upload,asyncRoute(async(req:AuthedRequest,res)=>{if(!req.file)throw new AppError(400,'Choose a media file');req.file.originalname=repairFilename(req.file.originalname);res.status(201).json(output(req,await uploadLibraryFile(req.file,String(req.user!._id))))}));
mediaRouter.get('/:id/file',asyncRoute(async(req:AuthedRequest,res)=>{
 const item=await libraryItem(routeParam(req.params.id));access(req,item);if(item.deleted_at)throw new AppError(404,'File is in trash');
 const size=Number(item.bytes);let start=0,end=size-1;
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2])){res.status(416).set('Content-Range',`bytes */${size}`).end();return}
  if(!match[1])start=Math.max(0,size-Number(match[2]));else {start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]))}
  if(start>end||start>=size){res.status(416).set('Content-Range',`bytes */${size}`).end();return}res.status(206).set('Content-Range',`bytes ${start}-${end}/${size}`);
 }
 let full:string|undefined;if(item.path){try{full=await safeFile(item.path)}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new AppError(404,'File is missing from uploads');throw e}}
 res.set({'Content-Type':item.mime,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'private, no-cache','X-Content-Type-Options':'nosniff'});
 if(req.method==='HEAD'){res.end();return}
 const stream=full?diskStream(item,full,start,end):mediaStore(db,item.bucket!).openDownloadStream(new ObjectId(item.file_id!),{start,end:end+1});
 stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}));
const fields=z.object({title:z.string().max(300),altText:z.string().max(500),caption:z.string().max(2000)});
// Serialize mutations per file across API instances; physical filenames never change.
async function mutate(req:AuthedRequest,action:(item:LibraryItem)=>Promise<unknown>){const id=routeParam(req.params.id);if(!/^[a-f0-9]{24}$/.test(id))throw new AppError(400,'Invalid media ID');const connection=await mysqlPool.getConnection();try{const [[lock]]=await connection.query<RowDataPacket[]>('SELECT GET_LOCK(?,0) AS acquired',['media_edit_'+id]);if(!lock!.acquired)throw new AppError(409,'This file is being edited. Try again.');const item=await libraryItem(id);access(req,item,true);return await action(item)}finally{await connection.query('SELECT RELEASE_LOCK(?)',['media_edit_'+id]).catch(()=>undefined);connection.release()}}
mediaRouter.patch('/:id',upload,asyncRoute(async(req:AuthedRequest,res)=>{res.json(await mutate(req,async item=>output(req,await updateLibraryFile(item,fields.parse(req.body),req.file))))}));
mediaRouter.delete('/:id',asyncRoute(async(req:AuthedRequest,res)=>{await mutate(req,trashLibraryFile);res.json({ok:true,recoverable:true})}));
mediaRouter.delete('/:id/permanent',asyncRoute(async(req:AuthedRequest,res)=>{await mutate(req,(item) => import('../media-library.js').then(m => m.permanentDeleteLibraryFile(item)));res.json({ok:true})}));
mediaRouter.post('/:id/restore',asyncRoute(async(req:AuthedRequest,res)=>{try{res.json(await mutate(req,async item=>output(req,await restoreLibraryFile(item))))}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new AppError(409,'Another file occupies this URL. Restore will not overwrite it.');throw e}}}));
