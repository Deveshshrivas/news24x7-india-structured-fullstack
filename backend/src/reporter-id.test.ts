import test from 'node:test';
import assert from 'node:assert/strict';
import {reporterSchema} from './validation.js';
const profile={name:'Test Reporter',designation:'Reporter',phone:'1234567890',email:'reporter@example.com',address:'Test office address',active:true};
test('Reporter ID is optional, normalized and validated',()=>{
 assert.equal(reporterSchema.parse({...profile,reporter_id:' rep-001 '}).reporter_id,'REP-001');
 assert.equal(reporterSchema.parse(profile).reporter_id,undefined);
 assert.equal(reporterSchema.parse({...profile,reporter_id:''}).reporter_id,'');
 assert.equal(reporterSchema.safeParse({...profile,reporter_id:'bad id!'}).success,false);
 assert.equal(reporterSchema.safeParse({...profile,reporter_id:'x'.repeat(41)}).success,false);
});
