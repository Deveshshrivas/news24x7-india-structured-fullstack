import assert from 'node:assert/strict';
import {client,db} from '../src/database.ts';
const source='wordpress:news24x7india.com';
try{
 await client.connect();
 const imported=await db.collection('articles').countDocuments({migration_source:source});
 assert.equal(imported,20501);
 const original=await db.collection('articles').countDocuments({migration_source:{$ne:source}});
 assert.ok(original>=28,'Original articles must remain');
 assert.equal(await db.collection('articles').countDocuments({migration_source:source,status:{$ne:'published'}}),0);
 const sample=await db.collection('articles').findOne({migration_source:source},{sort:{published_at:-1}});
 const response=await fetch(`http://127.0.0.1:8000/articles/${encodeURIComponent(sample.slug)}?track_view=false`);
 assert.equal(response.status,200);
 const article=await response.json();assert.equal(article.title,sample.title);assert.equal(article.body,sample.body);assert.ok(!('legacy_html' in article));
 const html=await fetch(`http://127.0.0.1:5173/news/${encodeURIComponent(sample.slug)}`).then(r=>r.text());
 assert.ok(html.includes(sample.slug));
 console.log(JSON.stringify({imported,originalPreserved:original,totalCategories:await db.collection('categories').countDocuments({}),sampleTitle:sample.title,sampleUrl:`http://127.0.0.1:5173/news/${sample.slug}`,imageUrl:sample.image_url,checks:'passed'}));
}finally{await client.close();}
