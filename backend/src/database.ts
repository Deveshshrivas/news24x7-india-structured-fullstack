import {GridFSBucket,MongoClient} from "mongodb";
import dns from "node:dns";
import {config} from "./config.js";
import {CATEGORIES,sampleArticles} from "./seed.js";
import {slugifyTitle} from "./utils.js";

if(config.mongodbUri.startsWith("mongodb+srv://")&&config.mongodbDnsServers.length)dns.setServers(config.mongodbDnsServers);

export const client=new MongoClient(config.mongodbUri,{serverSelectionTimeoutMS:8000});
export const db=client.db(config.databaseName);
export const audioFiles=new GridFSBucket(db,{bucketName:"audio_files"});

export async function initializeDatabase(){
  await client.connect();
  await db.command({ping:1});
  await Promise.all([
    db.collection("users").createIndex({email:1},{unique:true}),
    db.collection("oauth_codes").createIndex({expires_at:1},{expireAfterSeconds:0}),
    db.collection("audio_tracks").createIndex({position:1}),
    db.collection("breaking_news").createIndex({created_at:1}),
    db.collection("articles").createIndex({slug:1},{unique:true}),
    db.collection("articles").createIndex({status:1,published_at:-1}),
    db.collection("articles").createIndex({category:1,published_at:-1}),
    db.collection("articles").createIndex({title:"text",excerpt:"text",body:"text"}),
    db.collection("categories").createIndex({slug:1},{unique:true}),
    db.collection("categories").createIndex({parent_id:1,position:1}),
  ]);
  if(await db.collection("articles").countDocuments({})===0)await db.collection("articles").insertMany(sampleArticles());
  if(await db.collection("categories").countDocuments({})===0){const now=new Date();await db.collection("categories").insertMany(CATEGORIES.map((name,position)=>({name,slug:slugifyTitle(name),parent_id:null,active:true,position,created_at:now,updated_at:now})))}
}
