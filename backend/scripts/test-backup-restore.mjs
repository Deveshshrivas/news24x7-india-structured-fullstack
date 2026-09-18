import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import mysql from 'mysql2/promise';
import path from 'node:path';
import {backup,tool,run} from './backup.mjs';
import {config} from '../src/config.ts';
const temporary='news_restore_test_'+randomUUID().replace(/-/g,'');
assert.match(temporary,/^news_restore_test_[a-f0-9]{32}$/);
const connection=await mysql.createConnection({...config.mysql,multipleStatements:false});
let created=false;
try{
 const dir=await backup(false);
 await connection.query('CREATE DATABASE `'+temporary+'` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci');created=true;
 await run(await tool('mysql'),['--host='+config.mysql.host,'--port='+config.mysql.port,'--user='+config.mysql.user,'--default-character-set=utf8mb4',temporary],{input:path.join(dir,'database.sql'),stdio:['pipe','ignore','pipe']});
 const [tables]=await connection.query('SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?',[config.mysql.database]);
 for(const {TABLE_NAME:table}of tables){assert.match(table,/^[a-zA-Z0-9_]+$/);const [[source]]=await connection.query('SELECT COUNT(*) n FROM `'+config.mysql.database+'`.`'+table+'`'),[[restored]]=await connection.query('SELECT COUNT(*) n FROM `'+temporary+'`.`'+table+'`');assert.equal(restored.n,source.n,table+' row count');
  if(table.startsWith('mongo_')){const [original]=await connection.query('SELECT id,sha256 FROM `'+config.mysql.database+'`.`'+table+'` ORDER BY id'),[copy]=await connection.query('SELECT id,sha256 FROM `'+temporary+'`.`'+table+'` ORDER BY id');assert.deepEqual(copy,original,table+' document hashes')}
 }
 console.log('PASS: MySQL backup restored into isolated temporary database; all table counts and all canonical document hashes match. Backup retained at '+dir);
}finally{if(created)await connection.query('DROP DATABASE `'+temporary+'`');await connection.end()}
