import assert from 'node:assert/strict';
import test from 'node:test';
import {Readable} from 'node:stream';
import type {Request} from 'express';
import {boundedArticleStorage} from './bounded-upload.js';

test('article storage rejects oversized photos while streaming',async()=>{
 const storage=boundedArticleStorage();
 const file={fieldname:'image',stream:Readable.from([Buffer.alloc(8*1024*1024),Buffer.alloc(1)])} as Express.Multer.File;
 await new Promise<void>(resolve=>storage._handleFile({} as Request,file,(error)=>{assert.equal((error as {status:number}).status,413);resolve()}));
});
test('article storage accepts small photos with exact bytes',async()=>{
 const storage=boundedArticleStorage(),bytes=Buffer.from('test');
 const file={fieldname:'image',stream:Readable.from([bytes])} as Express.Multer.File;
 await new Promise<void>(resolve=>storage._handleFile({} as Request,file,(error,result)=>{assert.ifError(error);assert.equal(result?.size,4);assert.deepEqual(result?.buffer,bytes);resolve()}));
});
