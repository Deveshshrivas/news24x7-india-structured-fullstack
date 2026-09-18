import assert from 'node:assert/strict';
import {unlink,rm} from 'node:fs/promises';
import path from 'node:path';
import {db,client} from '../src/database.ts';
import {createToken} from '../src/security.ts';
import {mysqlPool} from '../src/mysql-database.ts';
import {uploadsRoot} from '../src/local-media.ts';
const user=await db.collection('users').findOne({role:'super_admin'}),headers={Authorization:'Bearer '+createToken(user)},base='http://127.0.0.1:8000/media';
let id;
async function request(url,options={}){return fetch(url,{...options,headers:{...headers,...options.headers}})}
function photo(){return new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')],{type:'image/png'})}
try{
 assert.equal((await fetch(base)).status,401);
 const form=new FormData();form.set('file',photo(),'media-crud-test.png');let r=await request(base,{method:'POST',body:form});assert.equal(r.status,201);const asset=await r.json();id=asset.id;assert.equal(asset.type,'image');
 r=await request('http://127.0.0.1:8000/media/'+id+'/file',{headers:{Range:'bytes=0-7'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,8);
 const edit=new FormData();edit.set('title','Media CRUD verified');edit.set('altText','One pixel test');edit.set('caption','Disposable verification asset');edit.set('file',photo(),'replace.png');r=await request(base+'/'+id,{method:'PATCH',body:edit});assert.equal(r.status,200);const edited=await r.json();assert.equal(edited.title,'Media CRUD verified');assert.equal(edited.publicUrl.split('?')[0],asset.publicUrl.split('?')[0]);
 r=await request(base+'?q=Media%20CRUD%20verified&type=image');assert.equal(r.status,200);assert.ok((await r.json()).items.some(item=>item.id===id));
 r=await request(base+'/'+id,{method:'DELETE'});assert.equal(r.status,200);assert.equal((await request(base+'/'+id+'/file')).status,404);
 r=await request(base+'?trash=1&q=Media%20CRUD%20verified');assert.ok((await r.json()).items.some(item=>item.id===id));
 assert.equal((await request(base+'/'+id+'/restore',{method:'POST'})).status,200);assert.equal((await request(base+'/'+id+'/file')).status,200);
 r=await request(base+'?type=image');const protectedFile=(await r.json()).items.find(item=>item.usageCount>0);if(protectedFile)assert.equal((await request(base+'/'+protectedFile.id,{method:'DELETE'})).status,409);
 const invalid=new FormData();invalid.set('file',new Blob(['bad'],{type:'image/png'}),'bad.png');assert.equal((await request(base,{method:'POST',body:invalid})).status,415);
 console.log('PASS: authenticated listing, upload, preview range, metadata edit, replacement URL preservation, search, recoverable delete, restore, format validation');
}finally{
 if(id){const [[row]]=await mysqlPool.query('SELECT path,trash_path FROM media_library WHERE id=?',[id]);if(row){for(const relative of [row.path,row.trash_path].filter(Boolean))await unlink(path.join(uploadsRoot,relative)).catch(()=>{});await mysqlPool.execute('DELETE FROM media_library WHERE id=?',[id])}}
 if(id&&/^[a-f0-9]{24}$/.test(id))await rm(path.join(uploadsRoot,'.versions',id),{recursive:true,force:true});
 await client.close();
}
