import {spawn} from 'node:child_process';
import {mkdir,writeFile,stat,access,chmod} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {config} from '../src/config.ts';
export const repo=fileURLToPath(new URL('../../',import.meta.url));
export async function tool(name){if(process.env.MYSQL_BIN_DIR)return path.join(process.env.MYSQL_BIN_DIR,name+(process.platform==='win32'?'.exe':''));const installed=path.join('C:/Program Files/MySQL/MySQL Server 8.0/bin',name+'.exe');if(process.platform==='win32'){try{await access(installed);return installed}catch{}}return name}
export function run(binary,args,options={}){return new Promise((resolve,reject)=>{const child=spawn(binary,args,{env:{...process.env,MYSQL_PWD:config.mysql.password},stdio:[options.input?'pipe':'ignore','ignore','pipe'],shell:false});let stderr='';child.stderr?.on('data',chunk=>{stderr+=chunk.toString()});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Backup/restore tool failed: '+stderr)));if(options.input){const input=createReadStream(options.input);input.on('error',reject);child.stdin.on('error',reject);input.pipe(child.stdin)}})}
export async function backup(includeUploads=false){
 if(config.databaseEngine!=='mysql')throw Error('This backup command requires MySQL');
 const dir=path.join(repo,'.backups',new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8));await mkdir(dir,{recursive:true,mode:0o700});
 const sql=path.join(dir,'database.sql'),db=config.mysql;
 await run(await tool('mysqldump'),['--host='+db.host,'--port='+db.port,'--user='+db.user,'--single-transaction','--quick','--hex-blob','--no-tablespaces','--set-gtid-purged=OFF','--default-character-set=utf8mb4','--result-file='+sql,db.database]);
 await chmod(sql,0o600);
 const files=[{name:'database.sql',bytes:(await stat(sql)).size,sha256:''}];
 if(includeUploads){const archive=path.join(dir,'uploads.tar');await run('tar',['-cf',archive,'-C',repo,'uploads']);files.push({name:'uploads.tar',bytes:(await stat(archive)).size,sha256:''})}
 for(const file of files){const hash=createHash('sha256');for await(const chunk of createReadStream(path.join(dir,file.name)))hash.update(chunk);file.sha256=hash.digest('hex')}
 await writeFile(path.join(dir,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),database:db.database,includesUploads:includeUploads,files},null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({backupDirectory:dir,includesUploads:includeUploads,files:files.map(({name,bytes})=>({name,bytes}))}));return dir;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await backup(process.argv.includes('--include-uploads'));
