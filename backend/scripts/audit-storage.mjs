// Read-only Atlas storage audit. Does not initialize, create indexes, or modify data.
import {createHash} from 'node:crypto';
import {BSON} from 'mongodb';
import {client,db} from '../src/mongo-source.ts';
const groups={migration:new Map(),content:new Map(),title:new Map()};
const fields={};let total=0,imported=0,bytes=0,htmlEqualsBody=0;
const hash=value=>createHash('sha256').update(value).digest('hex');
function record(map,key,a){if(!key)return;let g=map.get(key);if(!g){g={count:0,bytes:0,examples:[]};map.set(key,g)}g.count++;g.bytes+=BSON.calculateObjectSize(a);if(g.examples.length<3)g.examples.push({id:String(a._id),slug:a.slug})}
try{
 await client.connect();
 const collections=[];
 for(const c of await db.listCollections({}, {nameOnly:true}).toArray()){
  const result={name:c.name};
  try{const s=await db.command({collStats:c.name,scale:1});Object.assign(result,{count:s.count,dataBytes:s.size,storageBytes:s.storageSize,indexBytes:s.totalIndexSize,indexSizes:s.indexSizes})}catch(e){result.statsError=e.codeName||e.message}
  try{result.indexes=await db.collection(c.name).listIndexes().toArray()}catch{}
  try{result.indexUsage=await db.collection(c.name).aggregate([{$indexStats:{}}]).toArray()}catch(e){result.usageError=e.codeName||e.message}
  collections.push(result);
 }
 for await(const a of db.collection('articles').find({})){
  total++;if(a.migration_source)imported++;bytes+=BSON.calculateObjectSize(a);
  for(const [key,value]of Object.entries(a)){fields[key]??={count:0,bytes:0};fields[key].count++;fields[key].bytes+=BSON.calculateObjectSize({[key]:value})-5}
  record(groups.migration,a.migration_key,a);
  if(a.body?.trim())record(groups.content,hash(`${a.title?.trim()||''}\n${a.body.trim()}`),a);
  if(a.title?.trim())record(groups.title,hash(a.title.trim()),a);
  if(a.legacy_html&&a.legacy_html===a.body)htmlEqualsBody++;
 }
 const duplicates=Object.fromEntries(Object.entries(groups).map(([name,map])=>{const rows=[...map.values()].filter(g=>g.count>1);return[name,{groups:rows.length,extraRecords:rows.reduce((n,g)=>n+g.count-1,0),estimatedDuplicateDocumentBytes:rows.reduce((n,g)=>n+g.bytes*(g.count-1)/g.count,0),examples:rows.slice(0,5)}]}));
 console.log(JSON.stringify({total,imported,articleBsonBytes:bytes,htmlEqualsBody,fields,duplicates,collections},null,2));
}finally{await client.close()}
