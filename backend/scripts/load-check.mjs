import assert from 'node:assert/strict';
const base=process.env.TEST_API_URL||'http://127.0.0.1:8000';
const paths=['/articles?limit=10','/articles?sort=views&limit=10','/articles?sort=engagement&limit=15','/categories/news','/reporters/public'];
const timings=[];
await Promise.all(Array.from({length:5},async()=>{for(const route of paths){const start=performance.now(),r=await fetch(base+route,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,route);await r.arrayBuffer();timings.push(performance.now()-start)}}));
timings.sort((a,b)=>a-b);console.log(JSON.stringify({requests:timings.length,concurrency:5,p50ms:Math.round(timings[Math.floor(timings.length*.5)]),p95ms:Math.round(timings[Math.floor(timings.length*.95)]),note:'Local smoke load check; repeat on production hardware before launch.'}));
