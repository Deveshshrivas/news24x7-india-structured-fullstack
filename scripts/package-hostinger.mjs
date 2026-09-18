import {mkdir,readdir,copyFile,lstat,writeFile,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../',import.meta.url));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=path.join(repo,'outputs','hostinger-'+stamp);
const stage=path.join(output,'package');
const excluded=new Set(['node_modules','.git','dist','.next','.wrangler','.sites-runtime','.backups','outputs','uploads','work','coverage','.vscode','.idea','.vercel']);
const omitted=name=>excluded.has(name)||name==='.npmrc'||name.endsWith('.tsbuildinfo')||name.endsWith('.log')||name.endsWith('.sql')||name.endsWith('.pem')||(/^(?:\.env|env\.)/.test(name)&&!name.endsWith('.example')&&name!=='env.example');
async function copy(from,to){await mkdir(to,{recursive:true});for(const entry of await readdir(from,{withFileTypes:true})){if(omitted(entry.name))continue;const source=path.join(from,entry.name),dest=path.join(to,entry.name);if(entry.isSymbolicLink())throw Error('Refusing to package symbolic link: '+source);if(entry.isDirectory())await copy(source,dest);else if(entry.isFile())await copyFile(source,dest)}}
function run(args){return new Promise((resolve,reject)=>{const child=spawn('tar',args,{stdio:'inherit',shell:false});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Packaging tool failed '+code)))})}
await copy(repo,stage);
const code=path.join(output,'news24x7-application.zip');
await run(['--format','zip','-cf',code,'-C',stage,'.']);
console.log('APPLICATION ZIP READY: '+code);
const {backup}=await import('../backend/scripts/backup.mjs');
const snapshot=await backup(false);
await mkdir(path.join(stage,'private-migration'),{recursive:true});
await copyFile(path.join(snapshot,'database.sql'),path.join(stage,'private-migration','database.sql'));
const full=path.join(output,'news24x7-full-private.zip');
console.log('Creating full private ZIP including uploads and current MySQL export.');
if(process.platform==='win32'){
 await new Promise((resolve,reject)=>{const child=spawn('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(repo,'scripts','package-large-zip.ps1'),'-Stage',stage,'-MediaRoot',path.join(repo,'uploads'),'-Target',full],{stdio:'inherit',shell:false});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('ZIP creation failed '+code))) });
}else await run(['--format','zip','--options','zip:compression=store','-cf',full,'-C',stage,'.','-C',repo,'uploads']);
await writeFile(path.join(output,'package-info.json'),JSON.stringify({createdAt:stamp,applicationZip:code,fullPrivateZip:full,fullBytes:(await stat(full)).size,containsSecrets:false,containsPrivateDatabase:true,excludes:['real .env files','node_modules','Git history','local caches','old WordPress SQL dump','backups'],note:'Database export includes account password hashes. Keep full archive private.'},null,2),{flag:'wx'});
console.log('FULL PRIVATE ZIP READY: '+full);
