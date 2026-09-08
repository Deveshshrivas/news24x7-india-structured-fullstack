import test from 'node:test';
import assert from 'node:assert/strict';
import {readWordpressRows} from './wordpress-sql.mjs';
test('SQL data parser keeps Unicode, quoting and multiline text without executing SQL',async()=>{
 const rows=[];
 await readWordpressRows(new URL('./wordpress-parser-fixture.sql',import.meta.url),new Set(['wp_posts']),async(table,row)=>rows.push(row));
 assert.equal(rows.length,3);
 assert.equal(rows[0].post_title,'Hindi समाचार');
 assert.equal(rows[0].post_content,"Line one\nLine two, comma and 'quote'");
 assert.equal(rows[1].post_title,"Doubled 'quote'");
 assert.equal(rows[2].post_content,'first\nsecond');
});
