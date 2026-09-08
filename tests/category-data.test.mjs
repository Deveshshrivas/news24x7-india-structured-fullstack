import test from 'node:test';
import assert from 'node:assert/strict';

const site=process.env.TEST_SITE_URL||'http://127.0.0.1:5173';
test('category panels contain only actual latest published articles in their category',async()=>{
  const response=await fetch(`${site}/api/backend/categories/news`);
  assert.equal(response.status,200);
  const {items}=await response.json();
  for(const group of items){
    assert.ok(group.articles.length>0&&group.articles.length<=7);
    assert.ok(group.articles.every(article=>article.category===group.category.name&&article.status==='published'));
    const list=await fetch(`${site}/api/backend/articles?category=${encodeURIComponent(group.category.name)}&limit=7`);
    assert.equal(list.status,200);
    const expected=await list.json();
    assert.deepEqual(group.articles.map(article=>article.id),expected.items.map(article=>article.id));
  }
});
