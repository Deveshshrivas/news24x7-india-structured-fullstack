// Managed hosting entry: one public frontend, with a private loopback API.
import {spawn} from 'node:child_process';
import {access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {existsSync, writeFileSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

// Upload .env privately beside this entry file. Platform environment values win.
const envFile=new URL('./.env',import.meta.url);
if(existsSync(envFile)){
  process.loadEnvFile(fileURLToPath(envFile));
} else {
  // Hostinger fallback
  const safeEnv = new URL('../../../../safe_env.txt', import.meta.url);
  if(existsSync(safeEnv)) {
    process.loadEnvFile(fileURLToPath(safeEnv));
    writeFileSync(fileURLToPath(envFile), readFileSync(fileURLToPath(safeEnv)));
  }
}

writeFileSync('env-dump.json', JSON.stringify(process.env, null, 2));

const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||3000);
const apiPort=Number(process.env.API_INTERNAL_PORT||(port===8000?8001:8000));
if (![port,apiPort].every(value=>Number.isInteger(value)&&value>0&&value<65536)||port===apiPort) {
  throw new Error('PORT and API_INTERNAL_PORT must be different valid TCP ports');
}
await Promise.all(['backend/dist/server.js','.next/BUILD_ID'].map(file=>access(new URL(file,import.meta.url))));
const site=process.env.FRONTEND_URL||process.env.NEXT_PUBLIC_SITE_URL;
if (!site) throw new Error('Set FRONTEND_URL and NEXT_PUBLIC_SITE_URL in the hosting environment');
const backendUrl=`http://127.0.0.1:${port}/api/backend`;
Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV||'production',
  DEPLOY_TARGET: 'node',
  BACKEND_URL: backendUrl,
  FRONTEND_URL: site,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL||site,
  GOOGLE_REDIRECT_URL: process.env.GOOGLE_REDIRECT_URL||`${site.replace(/\/$/,'')}/api/backend/auth/google/callback`
});
const children=new Set();
let stopping=false;
function stop(code=0) {
  if(stopping)return;
  stopping=true;process.exitCode=code;
  for(const child of children)child.kill('SIGTERM');
  const timeout=setTimeout(()=>{for(const child of children)child.kill('SIGKILL')},10000);
  timeout.unref();
}
process.on('SIGTERM',()=>stop());process.on('SIGINT',()=>stop());
import http from 'node:http';
import { Readable } from 'node:stream';
import next from 'next';

const { app: backendApp, initializeDatabase } = await import('./backend/dist/server.js');
await initializeDatabase();

async function injectExpress(app, url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = new http.IncomingMessage(new Readable({ read() {} }));
    req.method = method;
    req.url = url;
    req.headers = headers || {};
    req.connection = { remoteAddress: '127.0.0.1' };
    
    if (body) {
      req.push(body);
      req.push(null);
    } else {
      req.push(null);
    }
    
    const res = new http.ServerResponse(req);
    const chunks = [];
    
    res.assignSocket({
      _writableState: {},
      writable: true,
      on: () => {},
      removeListener: () => {},
      destroy: () => {},
      write: (chunk) => { chunks.push(Buffer.from(chunk)); return true; },
      end: (chunk) => {
        if (chunk) chunks.push(Buffer.from(chunk));
      }
    });
    
    res.end = function(chunk) {
      if (chunk) chunks.push(Buffer.from(chunk));
      const bodyBuffer = Buffer.concat(chunks);
      resolve(new Response(bodyBuffer, {
        status: res.statusCode,
        headers: new Headers(res.getHeaders())
      }));
    };
    
    try {
      app(req, res);
    } catch (err) {
      reject(err);
    }
  });
}

const originalFetch = global.fetch;
global.fetch = async (input, init = {}) => {
  const urlStr = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input && input.url ? input.url : ''));
  if (urlStr.startsWith(backendUrl)) {
    const path = urlStr.substring(backendUrl.length) || '/';
    return injectExpress(backendApp, path, init.method || 'GET', init.headers || {}, init.body);
  }
  return originalFetch(input, init);
};

if (!stopping) {
  const dev = false;
  const app = next({ dev, hostname: '0.0.0.0', port });
  const handle = app.getRequestHandler();
  
  app.prepare().then(() => {
    // LiteSpeed Node (Hostinger) will intercept this listen() call!
    const server = http.createServer((req, res) => {
      if (req.url.startsWith('/api/backend')) {
         req.url = req.url.replace('/api/backend', '');
         if (req.url === '') req.url = '/';
         backendApp(req, res);
      } else {
        handle(req, res).catch((err) => {
          console.error('Error handling request', err);
          res.statusCode = 500;
          res.end('Internal Server Error');
        });
      }
    });
    
    server.listen(port, () => {
      console.log(`Next.js natively listening on port ${port}`);
    });
    
    children.add({ kill: () => server.close() });
  });
}

// Optional health check log
(async () => {
  let ready=false;
  for(let attempt=0;attempt<120&&!stopping;attempt++) {
    try {const response=await fetch(`${backendUrl}/health`,{signal:AbortSignal.timeout(1000)});ready=response.ok;await response.body?.cancel()} catch {}
    if(ready) { console.log('Database/API is now healthy!'); break; }
    await delay(500);
  }
})();
