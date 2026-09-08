import {createHash} from 'node:crypto';
import {ObjectId} from 'mongodb';
import {client,db} from '../src/database.ts';
import {newsSlug} from '../src/news-slug.ts';
import {readWordpressRows} from './wordpress-sql.mjs';

const source='wordpress:news24x7india.com';
const apply=process.argv.includes('--apply');
const file=process.argv[2];
if(!file)throw new Error('Usage: npx tsx scripts/import-wordpress.mjs <dump.sql> [--apply]');
const posts=[], attachments=new Map(), terms=new Map(), taxonomies=new Map(), relations=new Map(), authors=new Map(), thumbs=new Map(), primary=new Map();
function decode(text='') {return String(text).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):'';}).replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|rsquo|lsquo|ldquo|rdquo);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”'})[n]);}
function plain(html=''){return decode(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--([\s\S]*?)-->/g,'').replace(/<\/?(?:p|div|h[1-6]|li|blockquote|br)\b[^>]*>/gi,'\n\n').replace(/<[^>]+>/g,'').replace(/\[\/?(?:caption|gallery|embed)[^\]]*\]/gi,'')).replace(/[ \t]+/g,' ').replace(/\n\s*\n(?:\s*\n)+/g,'\n\n').trim();}
function safeUrl(value){try{const u=new URL(decode(value),'https://news24x7india.com');return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}}
function date(gmt,local){const value=gmt&&!gmt.startsWith('0000')?gmt.replace(' ','T')+'Z':local&&!local.startsWith('0000')?local.replace(' ','T')+'+05:30':null;const d=value?new Date(value):null;return d&&!isNaN(d.getTime())?d:null;}
const oid=(type,id)=>new ObjectId(createHash('sha256').update(`${source}:${type}:${id}`).digest('hex').slice(0,24));
console.log('Reading published content and reference tables (no SQL execution)...');
await readWordpressRows(file,new Set(['wp_posts','wp_terms','wp_term_taxonomy','wp_term_relationships','wp_users','wp_postmeta']),async(table,r)=>{
  if(table==='wp_posts'){
    if(r.post_type==='post'&&r.post_status==='publish'&&!r.post_password)posts.push(r);
    else if(r.post_type==='attachment')attachments.set(r.ID,{url:safeUrl(r.guid),mime:r.post_mime_type});
  }else if(table==='wp_terms')terms.set(r.term_id,r);
  else if(table==='wp_term_taxonomy'&&r.taxonomy==='category')taxonomies.set(r.term_taxonomy_id,r);
  else if(table==='wp_term_relationships'){const a=relations.get(r.object_id)||[];a.push(r.term_taxonomy_id);relations.set(r.object_id,a);}
  else if(table==='wp_users')authors.set(r.ID,plain(r.display_name));
  else if(table==='wp_postmeta'&&r.meta_key==='_thumbnail_id')thumbs.set(r.post_id,r.meta_value);
  else if(table==='wp_postmeta'&&r.meta_key==='_yoast_wpseo_primary_category')primary.set(r.post_id,r.meta_value);
});
try{
  await client.connect();
  const existingArticles=await db.collection('articles').find({},{projection:{_id:1,slug:1,slug_keys:1,migration_key:1}}).toArray();
  const existingCats=await db.collection('categories').find({}).toArray();
  const known=new Set(existingArticles.map(a=>a.migration_key));
  const reserved=new Set(existingArticles.flatMap(a=>[a.slug,...(a.slug_keys||[])]));
  const catSlugs=new Set(existingCats.map(c=>c.slug));
  const mapped=new Map(),newCats=[],now=new Date();
  for(const tax of taxonomies.values()){
    const term=terms.get(tax.term_id);if(!term)throw new Error('Missing category term');
    const name=plain(term.name);
    const existing=existingCats.find(c=>c.name===name||c.migration_key===`${source}:category:${term.term_id}`);
    if(existing){mapped.set(term.term_id,existing);continue;}
    let slug=newsSlug(name)||`wp-category-${term.term_id}`;
    if(catSlugs.has(slug))slug=`${slug.slice(0,155)}-wp-${term.term_id}`;
    catSlugs.add(slug);
    const c={_id:oid('category',term.term_id),name,slug,parent_id:null,active:true,position:100+newCats.length,created_at:now,updated_at:now,migration_key:`${source}:category:${term.term_id}`,migration_source:source,legacy_parent:tax.parent};
    mapped.set(term.term_id,c);newCats.push(c);
  }
  for(const c of newCats){c.parent_id=mapped.get(c.legacy_parent)?._id||null;delete c.legacy_parent;}
  const docs=[];let withImages=0,aliasConflicts=0;
  for(const p of posts){
    const key=`${source}:post:${p.ID}`;if(known.has(key))continue;
    const title=plain(p.post_title)||`News ${p.ID}`;
    let slug=newsSlug(title)||`wordpress-news-${p.ID}`;
    if(reserved.has(slug))slug=`${slug.slice(0,150)}-wp-${p.ID}`;
    let n=2;const base=slug;while(reserved.has(slug))slug=`${base.slice(0,165)}-${n++}`;
    const aliases=[slug];reserved.add(slug);
    let old=p.post_name;try{old=decodeURIComponent(old);}catch{}
    for(const candidate of new Set([old,p.post_name]))if(candidate&&candidate!==slug){if(!reserved.has(candidate)){aliases.push(candidate);reserved.add(candidate);}else aliasConflicts++;}
    const categoryIds=(relations.get(p.ID)||[]).map(id=>taxonomies.get(id)?.term_id).filter(Boolean);
    const selected=mapped.get(primary.get(p.ID))||mapped.get(categoryIds.find(id=>id!=='1'))||mapped.get(categoryIds[0]);
    const images=[...p.post_content.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(m=>safeUrl(m[1])).filter(Boolean);
    const image=attachments.get(thumbs.get(p.ID))?.url||images[0]||null;if(image)withImages++;
    const body=plain(p.post_content);
    docs.push({_id:oid('post',p.ID),migration_key:key,migration_source:source,legacy_post_id:p.ID,legacy_url:safeUrl(p.guid),legacy_categories:categoryIds,legacy_image_urls:[...new Set(images)],legacy_html:p.post_content,title,slug,slug_keys:aliases,excerpt:(plain(p.post_excerpt)||body||title).slice(0,600),body:body||title,category:selected?.name||'Uncategorized',image_url:image,status:'published',featured:false,author_name:authors.get(p.post_author)||'NEWS24x7 INDIA',published_at:date(p.post_date_gmt,p.post_date),created_at:date(p.post_date_gmt,p.post_date),updated_at:date(p.post_modified_gmt,p.post_modified),views:0,media:[],imported_at:now});
  }
  console.log(JSON.stringify({mode:apply?'APPLY':'DRY RUN',sourcePublished:posts.length,categoriesMapped:mapped.size,newCategories:newCats.length,newArticles:docs.length,alreadyImported:posts.length-docs.length,withMainImage:withImages,skippedConflictingAliases:aliasConflicts,estimatedDocumentMB:Math.round(Buffer.byteLength(JSON.stringify(docs))/1048576),existingArticles:existingArticles.length}));
  if(!apply)process.exitCode=0;
  else{
    for(const [name,records] of [['categories',newCats],['articles',docs]]){
      for(let i=0;i<records.length;i+=250){await db.collection(name).bulkWrite(records.slice(i,i+250).map(doc=>({updateOne:{filter:{_id:doc._id},update:{$setOnInsert:doc},upsert:true}})),{ordered:true});if(i%2000===0)console.log(`${name}: ${Math.min(i+250,records.length)}/${records.length}`);}
    }
    console.log(JSON.stringify({importedPublished:await db.collection('articles').countDocuments({migration_source:source}),totalArticles:await db.collection('articles').countDocuments({}),totalCategories:await db.collection('categories').countDocuments({}),sampleSlugs:docs.slice(-2).map(d=>d.slug)}));
  }
}finally{await client.close();}
