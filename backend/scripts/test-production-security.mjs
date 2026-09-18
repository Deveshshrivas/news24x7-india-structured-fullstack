import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ObjectId} from 'mongodb';
import {db,client} from '../src/database.ts';
import {createToken} from '../src/security.ts';
const base=process.env.TEST_API_URL||'http://127.0.0.1:8000',id=new ObjectId();
try{
 const health=await fetch(base+'/health');assert.equal(health.status,200);assert.equal(health.headers.get('x-content-type-options'),'nosniff');assert.equal(health.headers.get('x-powered-by'),null);assert.ok(health.headers.get('x-request-id'));
 assert.equal((await fetch(base+'/auth/google/callback?code=fake&state=fake')).status,400);
 await db.collection('users').insertOne({_id:id,name:'Security Test Reporter',email:randomUUID()+'@example.invalid',provider:'password',active:true,role:'reporter',created_at:new Date()});
 const user=await db.collection('users').findOne({_id:id}),authorization='Bearer '+createToken(user),sample=await db.collection('articles').findOne({status:'published'});
 assert.equal((await fetch(base+'/articles/'+sample._id,{method:'PATCH',headers:{authorization,'content-type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/articles/'+sample._id,{method:'DELETE',headers:{authorization}})).status,403);
 const listing=await fetch(base+'/articles?admin=true',{headers:{authorization}});assert.equal(listing.status,200);assert.equal((await listing.json()).total,0);assert.ok(listing.headers.get('cache-control')?.includes('no-store'));
 const bad=new FormData();bad.set('title','Invalid image test');bad.set('excerpt','Disposable validation test content');bad.set('body','Disposable validation test content only.');bad.set('category',sample.category);bad.set('image',new Blob(['not a PNG'],{type:'image/png'}),'fake.png');assert.equal((await fetch(base+'/articles',{method:'POST',headers:{authorization},body:bad})).status,415);
 const sitemap=await fetch(base+'/articles/sitemap');assert.equal(sitemap.status,200);const data=await sitemap.json();assert.equal(data.items.length,await db.collection('articles').countDocuments({status:'published'}));assert.ok(data.items.every(a=>a.slug&&!('body' in a)&&!('author_id' in a)));
 console.log('PASS: security headers, browser-bound OAuth rejection, reporter ownership, private admin cache control, upload magic-byte validation, complete lightweight sitemap');
}finally{await db.collection('users').deleteOne({_id:id});await client.close()}
