import test from "node:test";
import assert from "node:assert/strict";

const site = process.env.TEST_SITE_URL || "http://127.0.0.1:5173";
const api = process.env.TEST_BACKEND_URL || "http://127.0.0.1:8000";
test("homepage top and latest sections include the newest published post", async () => {
  const [response, page] = await Promise.all([fetch(`${api}/articles?limit=1`), fetch(site)]);
  assert.equal(response.status, 200);
  assert.equal(page.status, 200);
  const {items} = await response.json();
  const html = await page.text();
  if(!items.length) return;
  const path = `/news/${items[0].slug}`;
  assert.ok(html.includes(`href="${path}" class="hero"`));
  assert.ok(html.includes(`href="${path}" class="thumb"`));
  assert.equal(items[0].status, "published");
});
test("most-read cards follow the API's view-ranked published results", async () => {
  const [response, page] = await Promise.all([fetch(`${api}/articles?sort=views&limit=10`), fetch(site)]);
  assert.equal(response.status, 200);
  const {items} = await response.json();
  const html = await page.text();
  const links = [...html.matchAll(/<a\b[^>]*class="rank"[^>]*>/g)].map(match => match[0].match(/href="([^"]+)"/)[1]);
  assert.deepEqual(links, items.map(item => `/news/${item.slug}`));
  const ranks = [...html.matchAll(/<a\b[^>]*class="rank"[^>]*>\s*<b>(.*?)<\/b>/g)].map(match => match[1]);
  assert.deepEqual(ranks, items.map((_, index) => String(index + 1).padStart(2, "0")));
  assert.ok(items.every(item => item.status === "published"));
});
