import assert from "node:assert/strict";
import test from "node:test";
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("standard Next.js renders production Hindi HTML", async context => {
  process.env.NODE_ENV='production';
  // Isolated API fixture: migration tests never write to the production database.
  const api=createServer((request,response)=>{
    response.setHeader('Content-Type','application/json');
    if(request.url==='/auth/me'){response.statusCode=401;response.end('{"detail":"Not authenticated"}');return}
    response.end(JSON.stringify(request.url==='/health'?{ok:true}:{items:[],total:0}));
  });
  await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
  const previousBackend=process.env.BACKEND_URL;
  process.env.BACKEND_URL=`http://127.0.0.1:${api.address().port}`;
  context.after(async()=>{api.closeAllConnections();await new Promise(resolve=>api.close(resolve));if(previousBackend===undefined)delete process.env.BACKEND_URL;else process.env.BACKEND_URL=previousBackend});
  const {default:next}=await import('next');
  const app=next({dev:false,dir:fileURLToPath(new URL('../',import.meta.url))});
  await app.prepare();
  const server=createServer(app.getRequestHandler());
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  context.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await app.close()});
  const base=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(`${base}/`,{headers:{accept:'text/html'}});

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
    assert.match(html, /<html\s+lang="hi"/i);
    assert.match(html, /<title>[^<]*NEWS24x7/i);
    assert.match(html, /application\/ld\+json/i);
    assert.doesNotMatch(html, developmentPreviewMeta);
    const css=html.match(/href="([^\"]+\.css[^\"]*)"/);
    assert.ok(css,'Next.js emits a stylesheet URL');
    assert.equal((await fetch(new URL(css[1].replaceAll('&amp;','&'),base))).status,200);
    assert.equal((await fetch(`${base}/login`)).status,200);
    const admin=await fetch(`${base}/admin`,{redirect:'manual'});
    assert.equal(admin.status,307);
    assert.match(admin.headers.get('location'),/\/login/);
    const health=await fetch(`${base}/api/backend/health`);
    assert.equal(health.status,200);
    assert.deepEqual(await health.json(),{ok:true});
});
