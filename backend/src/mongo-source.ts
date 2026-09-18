// Explicit source for migration/audit scripts, independent of runtime cutover.
import {MongoClient} from 'mongodb';
import dns from 'node:dns';
import {config} from './config.js';
if(config.mongodbUri.startsWith('mongodb+srv://')&&config.mongodbDnsServers.length)dns.setServers(config.mongodbDnsServers);
export const client=new MongoClient(config.mongodbUri,{serverSelectionTimeoutMS:8000});
export const db=client.db(config.databaseName);
