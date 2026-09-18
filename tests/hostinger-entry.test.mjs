import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const entry=fileURLToPath(new URL('../server.mjs',import.meta.url));
for(const [port,apiPort] of [['8000','8000'],['invalid','8001'],['3000','65536'],['0','8000']]) {
  test(`rejects invalid public/private ports ${port}/${apiPort}`,()=>{
    const result=spawnSync(process.execPath,[entry],{encoding:'utf8',env:{...process.env,PORT:port,API_INTERNAL_PORT:apiPort},timeout:5000});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/different valid TCP ports/);
  });
}
