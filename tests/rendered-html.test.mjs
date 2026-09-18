import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders production HTML or Cloudflare preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const handler = typeof worker === "function" ? worker : worker.fetch.bind(worker);
  const response = await handler(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  if (typeof worker === "function") {
    assert.match(html, /<html\s+lang="hi"/i);
    assert.match(html, /<title>[^<]*NEWS24x7/i);
    assert.match(html, /application\/ld\+json/i);
    assert.doesNotMatch(html, developmentPreviewMeta);
  } else {
    assert.match(html, developmentPreviewMeta);
  }
});
