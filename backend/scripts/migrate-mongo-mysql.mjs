// Lossless, insert-only copy. Atlas is read-only; existing MySQL tables are not overwritten.
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {BSON} from 'mongodb';
import {client,db} from '../src/mongo-source.ts';

const root=dotenv.parse(readFileSync(new URL('../../.env',import.meta.url)));
const local=dotenv.parse(readFileSync(new URL('../.env',import.meta.url)));
const setting=key=>process.env[key]||local[key]||root[key];
const database=setting('MYSQL_DATABASE')||'news24x7';
if(!/^[a-zA-Z0-9_]{1,64}$/.test(database))throw Error('Invalid MySQL database name');
const connection=await mysql.createConnection({host:setting('MYSQL_HOST')||'127.0.0.1',port:Number(setting('MYSQL_PORT')||3306),user:setting('MYSQL_USER')||'root',password:setting('MYSQL_PASSWORD'),charset:'utf8mb4',multipleStatements:false});
const digest=text=>createHash('sha256').update(text,'utf8').digest('hex');
const tableName=name=>'mongo_'+name.replace(/[^a-zA-Z0-9_]/g,'_').slice(0,30)+'_'+digest(name).slice(0,12);
try{
 await client.connect();
 const collections=await db.listCollections({}, {nameOnly:true}).toArray();
 // An occupied destination must be reviewed rather than merged/overwritten silently.
 const [existing]=await connection.execute('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?',[database]);
 if(existing.length)throw Error('Destination database contains tables; use a new empty MYSQL_DATABASE');
 if(collections.some(c=>tableName(c.name).length>64))throw Error('Source collection name too long for target table');
 if(!process.argv.includes('--apply')){console.log(JSON.stringify({dryRun:true,database,collections:collections.map(c=>c.name)}));process.exitCode=0;}
 else{
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
  await connection.query(`USE \`${database}\``);
  await connection.query('CREATE TABLE migration_manifest (collection_name VARCHAR(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin PRIMARY KEY, table_name VARCHAR(64) NOT NULL, source_count BIGINT NOT NULL, copied_count BIGINT NOT NULL DEFAULT 0, verified BOOLEAN NOT NULL DEFAULT FALSE, source_indexes LONGTEXT NOT NULL, completed_at DATETIME(3) NULL) ENGINE=InnoDB');
  for(const c of collections){
   const name=c.name,table=tableName(name),source=db.collection(name),expected=await source.countDocuments({});
   const indexes=await source.listIndexes().toArray();
   // Canonical Extended JSON retains ObjectIds, dates, binary GridFS bytes, hashes,
   // arrays, historical slug aliases, and arbitrary import/recovery fields.
   await connection.query(`CREATE TABLE \`${table}\` (id VARCHAR(512) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY, document LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL, sha256 CHAR(64) CHARACTER SET ascii NOT NULL, CHECK(JSON_VALID(document))) ENGINE=InnoDB`);
   await connection.execute('INSERT INTO migration_manifest (collection_name,table_name,source_count,source_indexes) VALUES (?,?,?,?)',[name,table,expected,BSON.EJSON.stringify(indexes,{relaxed:false})]);
   let count=0,batch=[];
   async function flush(){if(!batch.length)return;await connection.query(`INSERT INTO \`${table}\` (id,document,sha256) VALUES ?`,[batch]);batch=[];}
   for await(const document of source.find({}).batchSize(50)){
    const text=BSON.EJSON.stringify(document,{relaxed:false}),key=Buffer.from(BSON.EJSON.stringify(document._id,{relaxed:false})).toString('base64');
    if(key.length>512)throw Error('Source ID exceeds supported length');
    batch.push([key,text,digest(text)]);count++;if(batch.length>=20)await flush();
   }
   await flush();
   const [[row]]=await connection.query(`SELECT COUNT(*) AS count, SUM(sha256 <> LOWER(SHA2(document,256))) AS corrupt FROM \`${table}\``);
   const after=await source.countDocuments({});
   if(count!==expected||Number(row.count)!==expected||after!==expected||Number(row.corrupt)!==0)throw Error(`Verification failed: ${name}`);
   // Validate round-trip BSON, including binary content, not only row counts.
   const [sample]=await connection.query(`SELECT document FROM \`${table}\` ORDER BY id LIMIT 3`);
   for(const row of sample){const restored=BSON.EJSON.parse(row.document,{relaxed:false});if(digest(BSON.EJSON.stringify(restored,{relaxed:false}))!==digest(row.document))throw Error(`BSON round-trip failed: ${name}`)}
   await connection.execute('UPDATE migration_manifest SET copied_count=?,verified=TRUE,completed_at=UTC_TIMESTAMP(3) WHERE collection_name=?',[count,name]);
   console.log(JSON.stringify({collection:name,copied:count,verified:true}));
  }
  console.log(JSON.stringify({complete:true,database,sourceUnchanged:true,runtimeSwitched:false}));
 }
}catch(error){console.error(JSON.stringify({migrationFailed:true,error:error.code||error.message}));process.exitCode=1;}
finally{await client.close();await connection.end()}
