// Managed hosting entry: one public frontend, with a private loopback API.
import {spawn} from 'node:child_process';
import {access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';

// Upload .env privately beside this entry file. Platform environment values win.
const envFile=new URL('./.env',import.meta.url);
if(existsSync(envFile))process.loadEnvFile(fileURLToPath(envFile));

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||3000);
const apiPort=Number(process.env.API_INTERNAL_PORT||(port===8000?8001:8000));
if (![port,apiPort].every(value=>Number.isInteger(value)&&value>0&&value<65536)||port===apiPort) {
  throw new Error('PORT and API_INTERNAL_PORT must be different valid TCP ports');
}
await Promise.all(['backend/dist/server.js','.next/BUILD_ID'].map(file=>access(new URL(file,import.meta.url))));
const backendUrl=`http://127.0.0.1:${apiPort}`;
const site=process.env.FRONTEND_URL||process.env.NEXT_PUBLIC_SITE_URL;
if (!site) throw new Error('Set FRONTEND_URL and NEXT_PUBLIC_SITE_URL in the hosting environment');
const env={...process.env,NODE_ENV:process.env.NODE_ENV||'production',DEPLOY_TARGET:'node',BACKEND_URL:backendUrl,
  FRONTEND_URL:site,NEXT_PUBLIC_SITE_URL:process.env.NEXT_PUBLIC_SITE_URL||site,
  GOOGLE_REDIRECT_URL:process.env.GOOGLE_REDIRECT_URL||`${site.replace(/\/$/,'')}/api/backend/auth/google/callback`};
const children=new Set();
let stopping=false;
function stop(code=0) {
  if(stopping)return;
  stopping=true;process.exitCode=code;
  for(const child of children)child.kill('SIGTERM');
  const timeout=setTimeout(()=>{for(const child of children)child.kill('SIGKILL')},10000);
  timeout.unref();
}
function launch(file,overrides={},args=[]) {
  const child=spawn(process.execPath,[file,...args],{cwd:root,stdio:'inherit',env:{...env,...overrides}});
  children.add(child);
  child.on('error',()=>{console.error('Application process could not start');stop(1)});
  child.on('exit',code=>{children.delete(child);if(!stopping){console.error('Application process stopped unexpectedly');stop(code||1)}});
  return child;
}
process.on('SIGTERM',()=>stop());process.on('SIGINT',()=>stop());
import http from 'node:http';

launch('backend/dist/server.js',{PORT:String(apiPort),LISTEN_HOST:'127.0.0.1'});
if(!stopping) {
  // Hostinger immediately kills the app if it doesn't listen on PORT within 3 seconds.
  // Next.js might take 4+ seconds to boot up on slow shared nodes.
  // We instantly bind a dummy server to satisfy Hostinger's port detector, then close it.
  const dummy = http.createServer((req, res) => res.end('Starting up...'));
  dummy.listen(port, '0.0.0.0', () => {
    dummy.close(() => {
      const cli=createRequire(import.meta.url).resolve('next/dist/bin/next');
      launch(cli,{},['start','--hostname','0.0.0.0','--port',String(port)]);
    });
  });
}
// Health check in the background just to log when API is ready
(async () => {
  let ready=false;
  for(let attempt=0;attempt<120&&!stopping;attempt++) {
    try {const response=await fetch(`${backendUrl}/health`,{signal:AbortSignal.timeout(1000)});ready=response.ok;await response.body?.cancel()} catch {}
    if(ready) { console.log('Database/API is now healthy!'); break; }
    await delay(500);
  }
  if(!ready) console.error('Database/API did not become healthy within 60 seconds');
})();
