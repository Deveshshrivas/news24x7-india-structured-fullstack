import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ObjectId} from 'mongodb';
process.env.DATABASE_ENGINE='mysql';
const {db,client}=await import('../src/database.ts');
const {createToken}=await import('../src/security.ts');
const base=process.env.TEST_API_URL||'http://127.0.0.1:8001';
const articles=db.collection('articles'),start=await articles.countDocuments({});
const admin=await db.collection('users').findOne({role:'super_admin'});
assert.ok(admin,'Existing super admin must be present');
const authorization='Bearer '+createToken(admin);
const cleanup=[],suffix=randomUUID().slice(0,8);
async function request(path,options={},status=200){const r=await fetch(base+path,options);assert.equal(r.status,status,`${path}: ${await r.clone().text()}`);console.log(JSON.stringify({check:path.split('?')[0],status:r.status}));return r}
const headers={authorization,'Content-Type':'application/json'};
try{
 for(const path of ['/health','/articles?limit=3','/articles?sort=views&limit=10','/articles?sort=engagement&limit=15','/categories/news','/categories','/epaper','/audio'])await request(path);
 await request('/dashboard/stats',{headers:{authorization}});
 await request('/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'},403);
 await request('/users',{},401);
 const sample=await articles.findOne({status:'published'},{sort:{published_at:-1}});
 const news=await(await request('/articles/'+encodeURIComponent(sample.slug)+'?track_view=false')).json();assert.equal(news.title,sample.title);assert.equal(news.body,sample.body);
 const alias=sample.slug_keys.find(x=>x!==sample.slug);if(alias){const r=await(await request('/articles/'+encodeURIComponent(alias)+'?track_view=false')).json();assert.equal(r.id,String(sample._id))}
 const q=sample.title.slice(0,12);await request('/articles?q='+encodeURIComponent(q));
 const audio=await db.collection('audio_tracks').findOne({active:true});if(audio){const response=await request('/audio/'+audio._id+'/stream');assert.equal((await response.arrayBuffer()).byteLength,Number(audio.size))}
 const title='MySQL सत्यापन समाचार '+suffix;
 const payload={title,excerpt:'This is a temporary MySQL verification article only.',body:'Temporary migration verification content. This article is removed after testing.',category:sample.category,status:'draft'};
 const created=await(await request('/articles',{method:'POST',headers,body:JSON.stringify(payload)})).json();cleanup.push(['articles',created.id]);assert.ok(/^[a-z0-9-]+$/.test(created.slug));
 await request('/articles/'+created.slug,{},404);
 const slug='mysql-verification-'+suffix;
 await request('/articles/'+created.id,{method:'PATCH',headers,body:JSON.stringify({...payload,slug})});
 const row=await articles.findOne({_id:new ObjectId(created.id)});assert.equal(row.slug,slug);assert.ok(row.slug_keys.includes(created.slug));
 // Database uniqueness, not merely a UI check.
 const duplicateId=new ObjectId();await assert.rejects(()=>articles.insertOne({...row,_id:duplicateId}),e=>e.code===11000);
 assert.equal(await articles.countDocuments({_id:duplicateId}),0);
 // Existing auth identities survive the move.
 await request('/auth/me',{headers:{authorization}});
 // Parent/child management and protected deletion.
 const parent=await(await request('/categories',{method:'POST',headers,body:JSON.stringify({name:'MySQL parent '+suffix})})).json();cleanup.push(['categories',parent.id]);
 const child=await(await request('/categories',{method:'POST',headers,body:JSON.stringify({name:'MySQL child '+suffix,parent_id:parent.id})})).json();cleanup.push(['categories',child.id]);assert.equal(child.parentId,parent.id);
 await request('/categories/'+parent.id,{method:'DELETE',headers:{authorization}},409);
 const reporterBody={reporter_id:'MYSQL_'+suffix,name:'MySQL Test Reporter',designation:'Verification',phone:'9999999999',email:`mysql-${suffix}@example.invalid`,address:'Temporary verification address',active:true};
 const reporter=await(await request('/reporters',{method:'POST',headers,body:JSON.stringify(reporterBody)},201)).json();cleanup.push(['reporters',reporter.item.id]);assert.equal(reporter.item.reporterId,reporterBody.reporter_id.toUpperCase());
 // Password login and non-super-admin access rules, with a disposable identity.
 const password=randomUUID();const user=await(await request('/users',{method:'POST',headers,body:JSON.stringify({name:'MySQL Verification User',email:`mysql-user-${suffix}@example.invalid`,password,role:'admin'})},201)).json();cleanup.push(['users',user.user.id]);
 const logged=await request('/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:user.user.email,password})});assert.ok(logged.headers.get('set-cookie')?.includes('news_token='));
 const nonSuper=await db.collection('users').findOne({_id:new ObjectId(user.user.id)});await request('/users',{headers:{authorization:'Bearer '+createToken(nonSuper)}},403);
 const code=randomUUID();const oauth=await db.collection('oauth_codes').insertOne({code,user_id:admin._id,expires_at:new Date(Date.now()+120000)});cleanup.push(['oauth_codes',String(oauth.insertedId)]);
 await request('/auth/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});await request('/auth/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})},400);
 // Upload and stream a valid one-pixel PNG as a draft: public access is denied.
 const form=new FormData();for(const [key,value]of Object.entries(payload))form.append(key,value);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM1sAAAAASUVORK5CYII=','base64');
 form.append('image',new Blob([png],{type:'image/png'}),'verification.png');
 form.append('images',new Blob([png],{type:'image/png'}),'gallery.png');
 const uploaded=await(await request('/articles',{method:'POST',headers:{authorization},body:form})).json();cleanup.push(['articles',uploaded.id]);
 const image=await request('/articles/'+uploaded.id+'/image',{headers:{authorization}});assert.equal((await image.arrayBuffer()).byteLength,png.length);
 await request('/articles/'+uploaded.id+'/image',{},401);
 const gallery=await request('/articles/'+uploaded.id+'/media/'+uploaded.media[0].id,{headers:{authorization}});assert.equal((await gallery.arrayBuffer()).byteLength,png.length);
 const stats=await(await request('/dashboard/stats',{headers:{authorization}})).json();assert.ok(stats.publishedStories>=20501);
 console.log(JSON.stringify({passed:true,checks:['public feeds','popular ranking','category mapping','epaper','news content','historical slug aliases','search','stored MP3 streaming','authenticated identity','signup disabled','draft CRUD','unique slug rollback','parent/child categories','reporter IDs','password login','super-admin permissions','single-use OAuth exchange','private cover and gallery uploads']}));
}finally{
 for(const [collection,id]of cleanup.reverse()){if(['articles','categories','reporters'].includes(collection))await request('/'+collection+'/'+id,{method:'DELETE',headers:{authorization}});else await db.collection(collection).deleteOne({_id:new ObjectId(id)})}
 assert.equal(await articles.countDocuments({}),start,'Temporary articles must be removed');
 await client.close();
}
