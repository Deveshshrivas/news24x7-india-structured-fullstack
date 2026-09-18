import {db} from './database.js';
let cached:{items:unknown[];expires:number}|undefined;
let pending:Promise<unknown[]>|undefined;
export async function sitemapArticles(){
 if(cached&&cached.expires>Date.now())return cached.items;
 return pending??=db.collection('articles').find({status:'published'},{projection:{_id:0,slug:1,category:1,published_at:1,updated_at:1}}).sort({published_at:-1}).limit(49000).toArray().then(rows=>{const items=rows.map(row=>({slug:row.slug,category:row.category,publishedAt:row.published_at,updatedAt:row.updated_at}));cached={items,expires:Date.now()+60000};return items}).finally(()=>{pending=undefined});
}
