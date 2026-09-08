import test from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BACKEND_URL || "http://127.0.0.1:8000";
const fields = ["designation", "id", "name", "photoUrl"];
test("public reporter directory and profiles expose only public fields", async () => {
  const response = await fetch(`${base}/reporters/public`);
  assert.equal(response.status, 200);
  const {items} = await response.json();
  for (const item of items) {
    assert.deepEqual(Object.keys(item).sort(), fields);
    const detailResponse = await fetch(`${base}/reporters/public/${item.id}`);
    assert.equal(detailResponse.status, 200);
    const detail = await detailResponse.json();
    assert.deepEqual(Object.keys(detail.profile).sort(), fields);
    assert.equal(detail.profile.id, item.id);
    assert.ok(detail.items.every(article => article.status === "published"));
    if(item.photoUrl) assert.equal((await fetch(`${base}${item.photoUrl.replace("/api/backend", "")}`)).status, 200);
  }
});
test("private reporter administration remains protected", async () => {
  assert.equal((await fetch(`${base}/reporters`)).status, 401);
});
test("unknown reporter does not expose an account", async () => {
  assert.equal((await fetch(`${base}/reporters/public/000000000000000000000000`)).status, 404);
});
