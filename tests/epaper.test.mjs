import test from 'node:test';
import assert from 'node:assert/strict';
const api=process.env.TEST_BACKEND_URL||'http://127.0.0.1:8000';
const site=process.env.TEST_SITE_URL||'http://127.0.0.1:5173';
test('daily editions use published news and Indian publication dates',async()=>{
  const response=await fetch(`${api}/epaper`);
  assert.equal(response.status,200);
  const {items}=await response.json();
  assert.ok(items.length);
  assert.deepEqual(items.map(x=>x.date),items.map(x=>x.date).sort().reverse());
  const edition=items[0];
  const paper=await (await fetch(`${api}/epaper/${edition.date}`)).json();
  assert.equal(paper.items.length,edition.count);
  assert.equal(paper.items[0].id,edition.lead.id);
  for(const item of paper.items){
    assert.equal(item.status,'published');
    assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date(item.publishedAt)),edition.date);
    assert.equal(item.legacy_html,undefined);
  }
  const page=await fetch(`${site}/e-paper/${edition.date}`);
  assert.equal(page.status,200);
  const html=await page.text();
  assert.ok(html.includes(edition.lead.title));
  assert.ok(html.includes('PDF सहेजें'));
});
test('invalid dates and empty editions do not produce fake news',async()=>{
  assert.equal((await fetch(`${api}/epaper/2026-02-31`)).status,400);
  assert.equal((await fetch(`${api}/epaper/1900-01-01`)).status,404);
});
