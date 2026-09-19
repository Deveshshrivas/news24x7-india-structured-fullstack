import mysql, {type PoolConnection, type RowDataPacket} from 'mysql2/promise';
import {BSON,ObjectId,type Document,type Db} from 'mongodb';
import {createHash} from 'node:crypto';
import {config} from './config.js';

type Connection=PoolConnection;
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const encode=(value:unknown)=>BSON.EJSON.stringify(value,{relaxed:false});
const decode=(value:string)=>BSON.EJSON.parse(value,{relaxed:false});
const idKey=(value:unknown)=>Buffer.from(encode(value)).toString('base64');
const identifier=(value:string)=>{if(!/^[a-zA-Z0-9_]+$/.test(value))throw Error('Invalid SQL identifier');return '`'+value+'`'};
const tableName=(name:string)=>'mongo_'+name.replace(/[^a-zA-Z0-9_]/g,'_').slice(0,30)+'_'+hash(name).slice(0,12);
export const mysqlPool=mysql.createPool({...config.mysql,charset:'utf8mb4',connectionLimit:8,timezone:'Z'});
const columns:Record<string,string>={status:'v_status',category:'v_category',slug:'v_slug',email:'v_email',name:'v_name',reporter_id:'v_reporter_id',published_at:'v_published',created_at:'v_created',position:'v_position',views:'v_views',reading_seconds:'v_reading',expires_at:'v_expires',title:'v_title',excerpt:'v_excerpt',author_name:'v_author',seo_keywords:'v_keywords'};
const numeric=new Set(['published_at','created_at','updated_at','last_seen','expires_at','position','views','reading_seconds','seconds','length','n']);
function path(field:string){if(!/^[a-zA-Z0-9_.]+$/.test(field))throw Error('Invalid document field');return '$.'+field.split('.').map(p=>'"'+p+'"').join('.')}
function raw(field:string){return `JSON_EXTRACT(document,'${path(field)}')`}
function expression(field:string,useColumns=true){
 if(useColumns&&columns[field])return identifier(columns[field]);
 const p=path(field),extract=(suffix='')=>`JSON_UNQUOTE(JSON_EXTRACT(document,'${p}${suffix}'))`;
 const value=field.endsWith('_at')||field==='last_seen'?extract('."$date"."$numberLong"'):numeric.has(field)?`COALESCE(${extract('."$numberInt"')},${extract('."$numberLong"')},${extract('."$numberDouble"')},NULLIF(${extract()},'null'))`:field==='_id'||field.endsWith('_id')&&field!=='reporter_id'?`COALESCE(${extract('."$oid"')},NULLIF(${extract()},'null'))`:`NULLIF(${extract()},'null')`;
 return numeric.has(field)?`CAST(${value} AS DECIMAL(24,4))`:value;
}
function scalar(value:unknown):unknown {if(value instanceof ObjectId)return value.toHexString();if(value instanceof Date)return value.getTime();if(typeof value==='boolean')return String(value);return value}
function literalPattern(pattern:string){
 const start=pattern.startsWith('^'),end=pattern.endsWith('$')&&!pattern.endsWith('\\$');
 const text=pattern.slice(start?1:0,end?-1:undefined);let literal='';
 for(let i=0;i<text.length;i++){const c=text[i]!;if(c==='\\'){const next=text[++i];if(!next||!'.*+?^${}()|[]\\'.includes(next))return null;literal+=next}else{if('.*+?^${}()|[]'.includes(c))return null;literal+=c}}
 return(start?'':'%')+literal.replace(/[!%_]/g,c=>'!'+c)+(end?'':'%');
}
function where(query:Document={},params:unknown[]=[]):{sql:string;params:unknown[]}{
 const clauses:string[]=[];
 for(const [field,value]of Object.entries(query)){
  if(field==='$or'||field==='$and'){const parts=value.map((q:Document)=>where(q,params).sql);clauses.push('('+parts.join(field==='$or'?' OR ':' AND ')+')');continue}
  if(field.startsWith('$'))throw Error('Unsupported query operator '+field);
  const expr=expression(field);
  function equal(v:unknown,not=false){
   if(v==null)return `${expr} IS ${not?'NOT ':''}NULL`;
   if(field==='_id'){params.push(idKey(v));return `id ${not?'<>':'='} ?`}
   if(field==='slug_keys'){params.push(hash(String(v)));return `id ${not?'NOT ':''}IN (SELECT document_id FROM app_unique_keys WHERE collection_name='articles' AND field_name='slug_keys' AND value_hash=?)`}
   params.push(scalar(v));return not?`(${expr} <> ? OR ${expr} IS NULL)`:`${expr} = ?`;
  }
  if(value&&typeof value==='object'&&!(value instanceof Date)&&!(value instanceof ObjectId)&&!Array.isArray(value)){
   for(const [op,arg]of Object.entries(value)){
    if(op==='$options')continue;
    if(op==='$eq'||op==='$ne'){clauses.push(equal(arg,op==='$ne'));continue}
    if(op==='$exists'){clauses.push(`${raw(field)} IS ${arg?'NOT ':''}NULL`);continue}
    if(op==='$type'){const suffix=arg==='date'?'."$date"':arg==='string'?null:undefined;if(suffix===undefined)throw Error('Unsupported BSON type');clauses.push(arg==='date'&&columns[field]&&numeric.has(field)?`${expr} IS NOT NULL`:arg==='string'?`JSON_TYPE(${raw(field)})='STRING'`:`JSON_EXTRACT(document,'${path(field)}${suffix}') IS NOT NULL`);continue}
    if(op==='$regex'){const insensitive=String((value as Document).$options||'').includes('i'),literal=literalPattern(String(arg));if(literal!==null){params.push(literal);clauses.push(`${expr}${insensitive?' COLLATE utf8mb4_0900_as_ci':''} LIKE ? ESCAPE '!'`)}else{params.push(arg,insensitive?'i':'c');clauses.push(`REGEXP_LIKE(${expr}, ?, ?)`)}continue}
    if(op==='$in'||op==='$nin'){clauses.push('('+((arg as unknown[]).map(v=>equal(v,op==='$nin')).join(op==='$in'?' OR ':' AND ')|| (op==='$in'?'FALSE':'TRUE'))+')');continue}
    const symbol:Record<string,string>={$lt:'<',$lte:'<=',$gt:'>',$gte:'>='};if(!symbol[op])throw Error('Unsupported query operator '+op);params.push(scalar(arg));clauses.push(`${expr} ${symbol[op]} ?`);
   }
  }else clauses.push(equal(value));
 }
 return{sql:clauses.join(' AND ')||'TRUE',params};
}
function order(sort:Document={}){return Object.entries(sort).map(([field,direction])=>`${field==='_id'?'id':expression(field)} ${direction===-1?'DESC':'ASC'}`).join(', ')}
function projectSql(projection?:Document){
 if(!projection||!Object.keys(projection).length)return 'document';
 const entries=Object.entries(projection);
 if(entries.some(([k,v])=>k!=='_id'&&v===1)||entries.every(([,v])=>v===1)){
  const fields=entries.filter(([,v])=>v===1).map(([k])=>k);if(projection._id!==0&&!fields.includes('_id'))fields.push('_id');
  return `JSON_OBJECT(${fields.map(k=>`'${k}',${raw(k)}`).join(',')})`;
 }
 const removed=entries.filter(([,v])=>v===0).map(([k])=>`'${path(k)}'`);return removed.length?`JSON_REMOVE(document,${removed.join(',')})`:'document';
}
function getValue(doc:Document,key:string){return key.split('.').reduce((v,k)=>v?.[k],doc)}
function setValue(doc:Document,key:string,value:unknown){const parts=key.split('.');let parent=doc;for(const p of parts.slice(0,-1)){parent[p]??={};parent=parent[p]}parent[parts.at(-1)!]=value}
function applyUpdate(doc:Document,update:Document|Document[]){
 for(const operation of Array.isArray(update)?update:[update]){
  if(Object.keys(operation).some(k=>!['$set','$unset','$inc','$setOnInsert'].includes(k)))throw Error('Unsupported update operator');
  for(const [key,value]of Object.entries(operation.$set||{})){const resolved=Array.isArray(update)?(Array.isArray(value)?value.map(v=>typeof v==='string'&&v.startsWith('$')?getValue(doc,v.slice(1)):v):typeof value==='string'&&value.startsWith('$')?getValue(doc,value.slice(1)):value):value;setValue(doc,key,resolved)}
  for(const key of Object.keys(operation.$unset||{})){const parts=key.split('.'),parent=getValue(doc,parts.slice(0,-1).join('.'))||doc;delete parent[parts.at(-1)!]}
  for(const [key,value]of Object.entries(operation.$inc||{}))setValue(doc,key,Number(getValue(doc,key)||0)+Number(value));
 }
 return doc;
}
function duplicate(){return Object.assign(Error('Duplicate value'),{code:11000})}
// Database-backed unique keys protect email, canonical slugs, reporter IDs, and
// every historical article alias even across concurrent requests.
function uniqueKeys(name:string,doc:Document){
 const keys:[string,string][]=[];
 if(['users','reporters'].includes(name)&&typeof doc.email==='string')keys.push(['email',doc.email]);
 if(name==='reporters'&&typeof doc.reporter_id==='string')keys.push(['reporter_id',doc.reporter_id]);
 if(['articles','categories'].includes(name)&&typeof doc.slug==='string')keys.push(['slug',doc.slug]);
 if(name==='articles')for(const alias of new Set(doc.slug_keys||[]))keys.push(['slug_keys',String(alias)]);
 return keys.map(([field,value])=>[name,field,hash(value),idKey(doc._id)]);
}
class Cursor{
 private sorting:Document={};private offset=0;private maximum:number|undefined;
 constructor(private collection:Collection,private query:Document={},private options:Document={}){this.sorting=options.sort||{}}
 sort(value:Document){this.sorting=value;return this}skip(value:number){this.offset=Math.max(0,Math.floor(value));return this}limit(value:number){this.maximum=Math.max(0,Math.floor(value));return this}batchSize(_value:number){return this}
 async toArray(){const q=where(this.query),sorting=order(this.sorting);let sql=`SELECT ${projectSql(this.options.projection)} AS document FROM ${identifier(this.collection.table)} WHERE ${q.sql}`;if(sorting)sql+=' ORDER BY '+sorting;if(this.maximum!==undefined)sql+=` LIMIT ${this.maximum}`;else if(this.offset)sql+=' LIMIT 18446744073709551615';if(this.offset)sql+=` OFFSET ${this.offset}`;const [rows]=await mysqlPool.query<RowDataPacket[]>(sql,q.params);return rows.map(row=>decode(typeof row.document==='string'?row.document:JSON.stringify(row.document)))}
 async next(){this.limit(1);return(await this.toArray())[0]||null}
 async *[Symbol.asyncIterator](){for(const row of await this.toArray())yield row}
}
class Collection{
 readonly table:string;
 constructor(readonly name:string){this.table=tableName(name)}
 find(query:Document={},options:Document={}){return new Cursor(this,query,options)}
 async findOne(query:Document={},options:Document={}){
  if(Array.isArray(query.$or)&&query.$or.length===2&&query.$or.every((q:Document)=>Object.keys(q).length===1&&(['slug','slug_keys'].includes(Object.keys(q)[0]!)&&typeof Object.values(q)[0]==='string'))){const {$or,...rest}=query;for(const part of $or){const row=await this.find({...rest,...part},options).next();if(row)return row}return null}
  return this.find(query,options).next();
 }
 async countDocuments(query:Document={}){const q=where(query),[[row]]=await mysqlPool.query<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${identifier(this.table)} WHERE ${q.sql}`,q.params);return Number(row!.count)}
 async distinct(field:string,query:Document={}){const q=where(query),expr=expression(field),[rows]=await mysqlPool.query<RowDataPacket[]>(`SELECT DISTINCT ${expr} AS value FROM ${identifier(this.table)} WHERE ${q.sql} AND ${expr} IS NOT NULL`,q.params);return rows.map(r=>r.value)}
 async createIndex(_keys:Document,_options?:Document){return 'managed_by_mysql_schema'}
 async persist(connection:Connection,doc:Document,insert=false){
  const text=encode(doc),key=idKey(doc._id);
  try{
   await connection.execute('DELETE FROM app_unique_keys WHERE collection_name=? AND document_id=?',[this.name,key]);
   const keys=uniqueKeys(this.name,doc);if(keys.length)await connection.query('INSERT INTO app_unique_keys (collection_name,field_name,value_hash,document_id) VALUES ?',[keys]);
   if(insert)await connection.execute(`INSERT INTO ${identifier(this.table)} (id,document,sha256) VALUES (?,?,?)`,[key,text,hash(text)]);
   else await connection.execute(`UPDATE ${identifier(this.table)} SET document=?,sha256=? WHERE id=?`,[text,hash(text),key]);
  }catch(error){if((error as {code?:string}).code==='ER_DUP_ENTRY')throw duplicate();throw error}
 }
 async transaction<T>(fn:(connection:Connection)=>Promise<T>):Promise<T>{const c=await mysqlPool.getConnection();try{await c.beginTransaction();const value=await fn(c);await c.commit();return value}catch(error){await c.rollback();throw error}finally{c.release()}}
 async insertOne(value:Document){const doc={...value,_id:value._id||new ObjectId()};await this.transaction(c=>this.persist(c,doc,true));return{insertedId:doc._id,acknowledged:true}}
 async insertMany(values:Document[]){return this.transaction(async c=>{const insertedIds:Document={};for(let i=0;i<values.length;i++){const doc={...values[i],_id:values[i]!._id||new ObjectId()};await this.persist(c,doc,true);insertedIds[i]=doc._id}return{insertedCount:values.length,insertedIds}})}
 private async change(query:Document,update:Document|Document[]|null,options:Document={},remove=false){return this.transaction(async c=>{
  const q=where(query),[rows]=await c.query<RowDataPacket[]>(`SELECT document FROM ${identifier(this.table)} WHERE ${q.sql} LIMIT 1 FOR UPDATE`,q.params);let before=rows[0]?decode(rows[0].document):null;
  if(!before){if(!options.upsert)return null;const doc={...query,...(!Array.isArray(update)?update?.$setOnInsert||{}:{}),_id:query._id||new ObjectId()};await this.persist(c,applyUpdate(doc,update!),true);return options.returnDocument==='after'?doc:null}
  if(remove){await c.execute(`DELETE FROM ${identifier(this.table)} WHERE id=?`,[idKey(before._id)]);await c.execute('DELETE FROM app_unique_keys WHERE collection_name=? AND document_id=?',[this.name,idKey(before._id)]);return before}
  const after=applyUpdate(decode(encode(before)),update!);await this.persist(c,after);return options.returnDocument==='after'?after:before;
 })}
 findOneAndUpdate(q:Document,u:Document,options:Document={}){return this.change(q,u,options)}
 findOneAndDelete(q:Document){return this.change(q,null,{},true)}
 async updateOne(q:Document,u:Document|Document[],options:Document={}){const before=await this.change(q,u,options);return{matchedCount:before?1:0,modifiedCount:before?1:0,acknowledged:true}}
 async updateMany(q:Document,u:Document|Document[]){let count=0;for(const row of await this.find(q).toArray()){await this.updateOne({_id:row._id},u);count++}return{matchedCount:count,modifiedCount:count}}
 async deleteOne(q:Document){return{deletedCount:await this.findOneAndDelete(q)?1:0}}
 async deleteMany(q:Document){let count=0;for(const row of await this.find(q).toArray()){await this.deleteOne({_id:row._id});count++}return{deletedCount:count}}
 async bulkWrite(ops:Document[]){for(const op of ops){if(op.updateOne)await this.updateOne(op.updateOne.filter,op.updateOne.update,op.updateOne);else if(op.insertOne)await this.insertOne(op.insertOne.document);else throw Error('Unsupported bulk operation')}return{acknowledged:true}}
 aggregate(pipeline:Document[]){const run=async()=>{
  const grouping=pipeline.find(p=>p.$group)?.$group;
  if(grouping?.total){const [[r]]=await mysqlPool.query<RowDataPacket[]>(`SELECT COALESCE(SUM(v_views),0) AS total FROM ${identifier(this.table)}`);return[{_id:null,total:Number(r!.total)}]}
  if(grouping?._id?.$dateToString){const q=where(pipeline.find(p=>p.$match)?.$match||{});const [rows]=await mysqlPool.query<RowDataPacket[]>(`SELECT DATE_FORMAT(DATE_ADD(TIMESTAMPADD(MICROSECOND,v_published*1000,'1970-01-01 00:00:00'),INTERVAL 330 MINUTE),'%Y-%m-%d') AS _id,COUNT(*) AS count FROM ${identifier(this.table)} WHERE ${q.sql} GROUP BY _id ORDER BY _id DESC LIMIT 30`,q.params);return rows}
  if(pipeline.some(p=>p.$project?.score)){
   const q=where(pipeline.find(p=>p.$match)?.$match||{}),limit=Math.min(20,Math.max(1,Number(pipeline.find(p=>p.$limit)?.$limit)||15));
   const [rows]=await mysqlPool.query<RowDataPacket[]>(`SELECT ${projectSql({body:0,legacy_html:0,legacy_image_urls:0})} AS document FROM ${identifier(this.table)} INNER JOIN (SELECT id FROM ${identifier(this.table)} WHERE ${q.sql} ORDER BY COALESCE(v_views,0)+COALESCE(v_reading,0)/60 DESC,v_published DESC,id DESC LIMIT ${limit}) AS ranked USING(id) ORDER BY COALESCE(v_views,0)+COALESCE(v_reading,0)/60 DESC,v_published DESC,id DESC`,q.params);return rows.map(r=>decode(typeof r.document==='string'?r.document:JSON.stringify(r.document)));
  }
  if(this.name==='categories'&&pipeline.some(p=>p.$lookup)){
   const categories=await this.find({active:{$ne:false}}).sort({position:1,name:1}).toArray();const result=[];
   for(const category of categories){const articles=await new Collection('articles').find({status:'published',category:category.name},{projection:{body:0,legacy_html:0,legacy_image_urls:0,media:0}}).sort({published_at:-1,_id:-1}).limit(7).toArray();if(articles.length)result.push({...category,articles})}return result;
  }
  throw Error('Unsupported aggregation pipeline');
 };return{toArray:run,next:async()=>(await run())[0]||null}}
}
export const mysqlDb={collection:(name:string)=>new Collection(name),command:async(_command:Document)=>{await mysqlPool.query('SELECT 1');return{ok:1}}} as unknown as Db;
const collections=['articles','categories','users','reporters','audio_tracks','breaking_news','oauth_codes','reading_sessions','site_settings','local_uploads','audio_files.files','audio_files.chunks','article_images.files','article_images.chunks','reporter_photos.files','reporter_photos.chunks','ads'];
export async function initializeMysql(){
 const [manifest]=await mysqlPool.query<RowDataPacket[]>('SELECT * FROM migration_manifest');
 if(!manifest.length||manifest.some(r=>!r.verified))throw Error('MySQL migration is not fully verified');
 await mysqlPool.query('CREATE TABLE IF NOT EXISTS app_unique_keys (collection_name VARCHAR(128) CHARACTER SET ascii NOT NULL, field_name VARCHAR(64) CHARACTER SET ascii NOT NULL,value_hash CHAR(64) CHARACTER SET ascii NOT NULL, document_id VARCHAR(512) CHARACTER SET ascii NOT NULL,PRIMARY KEY(collection_name,field_name,value_hash),KEY document_lookup(collection_name,document_id)) ENGINE=InnoDB');
 for(const name of collections){
  const table=tableName(name);
  await mysqlPool.query(`CREATE TABLE IF NOT EXISTS ${identifier(table)} (id VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,document LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,sha256 CHAR(64) CHARACTER SET ascii NOT NULL,CHECK(JSON_VALID(document))) ENGINE=InnoDB`);
  const [existing]=await mysqlPool.query<RowDataPacket[]>('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',[config.mysql.database,table]);
  const present=new Set(existing.map(r=>r.COLUMN_NAME));
  const additions=Object.entries(columns).filter(([,column])=>!present.has(column)).map(([field,column])=>`ADD COLUMN ${identifier(column)} ${numeric.has(field)?'DECIMAL(24,4)':['title','excerpt','seo_keywords'].includes(field)?'LONGTEXT':'VARCHAR(512)'} GENERATED ALWAYS AS (${expression(field,false)}) STORED`);
  if(additions.length)await mysqlPool.query(`ALTER TABLE ${identifier(table)} ${additions.join(',')}`);
  const [indexes]=await mysqlPool.query<RowDataPacket[]>(`SHOW INDEX FROM ${identifier(table)}`);const indexNames=new Set(indexes.map(r=>r.Key_name));
  const specs:Record<string,string[]>=name==='articles'?{app_status_date:['v_status','v_published'],app_category_date:['v_category','v_published'],app_slug:['v_slug'],app_views_date:['v_status','v_views','v_published']}:name==='categories'?{app_slug:['v_slug'],app_position_name:['v_position','v_name']}:name==='users'?{app_email:['v_email']}:name==='reporters'?{app_email:['v_email'],app_name:['v_name']}:['oauth_codes','reading_sessions'].includes(name)?{app_expiry:['v_expires']}:name==='audio_tracks'?{app_position:['v_position']}:name==='breaking_news'?{app_created:['v_created']}:{};
  for(const index of indexNames)if(typeof index==='string'&&index.startsWith('app_')&&!(index in specs))await mysqlPool.query(`ALTER TABLE ${identifier(table)} DROP INDEX ${identifier(index)}`);
  for(const [index,cols]of Object.entries(specs))if(!indexNames.has(index))await mysqlPool.query(`ALTER TABLE ${identifier(table)} ADD INDEX ${identifier(index)} (${cols.map(identifier).join(',')})`);
 }
 // Rebuild only once after the snapshot. Unique collisions fail startup safely.
 const [[r]]=await mysqlPool.query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM app_unique_keys');
 if(Number(r!.count)===0){const connection=await mysqlPool.getConnection();try{await connection.beginTransaction();for(const name of ['articles','categories','users','reporters']){for(const row of await new Collection(name).find({},{projection:{_id:1,slug:1,slug_keys:1,email:1,reporter_id:1}}).toArray()){const keys=uniqueKeys(name,row);if(keys.length)await connection.query('INSERT INTO app_unique_keys (collection_name,field_name,value_hash,document_id) VALUES ?',[keys])}}await connection.commit()}catch(error){await connection.rollback();throw error}finally{connection.release()}}
}
export async function expireMysqlRecords(){for(const name of ['reading_sessions','oauth_codes']){const collection=new Collection(name),q=where({expires_at:{$lte:new Date()}});await mysqlPool.query(`DELETE FROM ${identifier(collection.table)} WHERE ${q.sql}`,q.params)}}
