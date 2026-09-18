// Run before cutover/editorial edits: compare every source document to MySQL.
import mysql from 'mysql2/promise';
import {BSON} from 'mongodb';
import {createHash} from 'node:crypto';
import {config} from '../src/config.ts';
import {client,db} from '../src/mongo-source.ts';
const connection=await mysql.createConnection({...config.mysql,charset:'utf8mb4'});
const hash=value=>createHash('sha256').update(value).digest('hex');
try{
 await client.connect();
 const [manifest]=await connection.query('SELECT collection_name,table_name FROM migration_manifest');
 for(const row of manifest){
  if(!/^mongo_[a-zA-Z0-9_]+$/.test(row.table_name))throw Error('Invalid manifest table');
  const [target]=await connection.query(`SELECT id,sha256 FROM \`${row.table_name}\``);
  const hashes=new Map(target.map(r=>[r.id,r.sha256]));let checked=0,mismatches=0;
  for await(const document of db.collection(row.collection_name).find({}).batchSize(50)){
   const text=BSON.EJSON.stringify(document,{relaxed:false}),key=Buffer.from(BSON.EJSON.stringify(document._id,{relaxed:false})).toString('base64');
   if(hashes.get(key)!==hash(text))mismatches++;hashes.delete(key);checked++;
  }
  console.log(JSON.stringify({collection:row.collection_name,checked,mismatches,extraTargetRecords:hashes.size}));
  if(mismatches||hashes.size)throw Error('Source/target mismatch; do not cut over before reconciliation');
 }
 console.log(JSON.stringify({allSourceDocumentsMatch:true}));
}catch(error){console.error(JSON.stringify({verificationFailed:true,error:error.code||error.message}));process.exitCode=1}
finally{await client.close();await connection.end()}
