import {test} from 'node:test';
import assert from 'node:assert/strict';
import {repairFilename,audioDisposition} from './filenames.js';
test('repairs Hindi multipart filenames and preserves valid names',()=>{
 const name='आज की खबरें.mp3';
 assert.equal(repairFilename(Buffer.from(name).toString('latin1')),name);
 for(const value of [name,'news.mp3','café.mp3','Hindi English 123.mp3','🎵.mp3'])assert.equal(repairFilename(value),value);
});
test('stream headers stay ASCII while retaining Unicode filename',()=>{
 const header=audioDisposition('आज की खबरें.mp3');
 assert.match(header,/filename\*=UTF-8''/);
 assert.ok([...header].every(c=>c.charCodeAt(0)<128));
 assert.ok(!audioDisposition('a\r\n.mp3').includes('\r'));
});
