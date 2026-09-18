import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdtemp,readdir,lstat,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {backup,repo,run} from './backup.mjs';

async function digest(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex')}
async function* walk(root,relative=''){
 for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})){
  const name=path.join(relative,entry.name);
  if(entry.isSymbolicLink())throw Error('Symbolic links are not supported in the media restore verification');
  if(entry.isDirectory())yield* walk(root,name);
  else if(entry.isFile())yield name;
 }
}
// Only extract a fresh archive created by our own backup command, never an
// arbitrary uploaded archive. Retain the isolated restore for inspection.
console.log('Creating full SQL/media backup. Avoid uploading or editing files during this test.');
const directory=await backup(true);
const manifest=JSON.parse(await readFile(path.join(directory,'manifest.json'),'utf8'));
for(const file of manifest.files){assert.ok(['database.sql','uploads.tar'].includes(file.name));assert.equal(await digest(path.join(directory,file.name)),file.sha256,file.name+' archive checksum')}
const restored=await mkdtemp(path.join(directory,'restore-check-'));
await run('tar',['-xf',path.join(directory,'uploads.tar'),'-C',restored]);
const original=path.join(repo,'uploads'),copy=path.join(restored,'uploads');
let files=0,bytes=0;
for await(const relative of walk(original)){
 const source=path.join(original,relative),target=path.join(copy,relative),a=await lstat(source),b=await lstat(target);
 assert.ok(b.isFile()&&!b.isSymbolicLink(),relative+' restored file type');assert.equal(b.size,a.size,relative+' size');
 assert.equal(await digest(target),await digest(source),relative+' content hash');files++;bytes+=a.size;
 if(files%10000===0)console.log('Verified '+files+' restored media files');
}
let restoredFiles=0;for await(const relative of walk(copy))restoredFiles++;
assert.equal(restoredFiles,files,'restored file count');
const result={result:'PASS',verifiedAt:new Date().toISOString(),files,bytes,backupDirectory:directory,isolatedRestore:restored,offServerVerified:false};
await writeFile(path.join(directory,'media-verification.json'),JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
console.log(JSON.stringify(result));
