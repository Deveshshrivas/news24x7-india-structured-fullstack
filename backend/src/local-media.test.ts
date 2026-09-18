import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ObjectId,type Db} from 'mongodb';
import {uploadPath,mediaStore,uploadsRoot} from './local-media.js';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
test('uses IST year/month at month boundary and safe unique filename',()=>{
 const id=new ObjectId();
 assert.equal(uploadPath(id,'video/mp4',new Date('2026-09-30T20:00:00Z')),`2026/10/private-${id}.mp4`);
 assert.notEqual(uploadPath(id,'image/jpeg'),uploadPath(new ObjectId(),'image/jpeg'));
 assert.throws(()=>uploadPath(id,'text/html'));
});
test('disk upload metadata, full/ranged reads and deletion',async()=>{
 const rows=new Map<string,any>();
 const collection={insertOne:async(row:any)=>rows.set(String(row._id),row),findOne:async(q:any)=>rows.get(String(q._id))||null,deleteOne:async(q:any)=>rows.delete(String(q._id))};
 const fakeDb={collection:()=>collection} as unknown as Db;
 const store=mediaStore(fakeDb,'test_media');
 const stream=store.openUploadStream('../../unsafe-name.mp4',{contentType:'video/mp4'});
 try{
  await pipeline(Readable.from(Buffer.from('0123456789')),stream);
  const metadata=await store.find({_id:stream.id}).next();assert.equal(metadata!.length,10);
  assert.ok(metadata && 'path' in metadata);
  assert.equal((await readFile(path.join(uploadsRoot,String(metadata.path)))).toString(),'0123456789');
  const chunks=[];for await(const chunk of store.openDownloadStream(stream.id,{start:2,end:5}))chunks.push(chunk);
  assert.equal(Buffer.concat(chunks).toString(),'234');
 }finally{await store.delete(stream.id)}
 assert.equal(rows.size,0);
});
