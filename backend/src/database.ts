import {MongoClient} from "mongodb";
import {mediaStore} from "./local-media.js";
import dns from "node:dns";
import {config} from "./config.js";
import {CATEGORIES} from "./seed.js";
import {slugifyTitle} from "./utils.js";
import {mysqlDb,mysqlPool,initializeMysql,expireMysqlRecords} from './mysql-database.js';

if(config.mongodbUri.startsWith("mongodb+srv://")&&config.mongodbDnsServers.length)dns.setServers(config.mongodbDnsServers);

const mongoClient=new MongoClient(config.mongodbUri,{serverSelectionTimeoutMS:8000});
export const client=config.databaseEngine==='mysql'?{connect:async()=>{await mysqlPool.query('SELECT 1')},close:async()=>{clearInterval(expiryTimer);await mysqlPool.end()}}:mongoClient;
export const db=config.databaseEngine==='mysql'?mysqlDb:mongoClient.db(config.databaseName);
let expiryTimer:ReturnType<typeof setInterval>|undefined;
export const audioFiles=mediaStore(db,"audio_files");
export const reporterPhotos=mediaStore(db,"reporter_photos");
export const articleImages=mediaStore(db,"article_images");

export async function initializeDatabase(){
  await client.connect();
  if(config.databaseEngine==='mysql'){
    await initializeMysql();
    await expireMysqlRecords();
    expiryTimer=setInterval(()=>{void expireMysqlRecords().catch(()=>console.error('MySQL expiry cleanup failed'))},60000);expiryTimer.unref();
    return;
  }
  await db.collection('reading_sessions').createIndex({expires_at:1},{expireAfterSeconds:0});
  await db.command({ping:1});
  await db.collection("articles").updateMany({slug:{$type:"string"},slug_keys:{$exists:false}},[{$set:{slug_keys:["$slug"]}}]);
  await Promise.all([
    db.collection("users").createIndex({email:1},{unique:true}),
    db.collection("oauth_codes").createIndex({expires_at:1},{expireAfterSeconds:0}),
    db.collection("audio_tracks").createIndex({position:1}),
    db.collection("breaking_news").createIndex({created_at:1}),
    db.collection("articles").createIndex({slug:1},{unique:true}),
    db.collection("articles").createIndex({slug_keys:1},{unique:true,sparse:true}),
    db.collection("articles").createIndex({status:1,published_at:-1}),
    db.collection("articles").createIndex({category:1,published_at:-1}),
    db.collection("articles").createIndex({title:"text",excerpt:"text",body:"text"}),
    db.collection("categories").createIndex({slug:1},{unique:true}),
    db.collection("categories").createIndex({parent_id:1,position:1}),
    db.collection("reporters").createIndex({email:1},{unique:true}),
    db.collection("reporters").createIndex({name:1}),
    db.collection("reporters").createIndex({reporter_id:1},{unique:true,partialFilterExpression:{reporter_id:{$type:"string"}}}),
  ]);
  if(await db.collection("categories").countDocuments({})===0){const now=new Date();await db.collection("categories").insertMany(CATEGORIES.map((name,position)=>({name,slug:slugifyTitle(name),parent_id:null,active:true,position,created_at:now,updated_at:now})))}
}
