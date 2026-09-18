// Copy the project to /srv/news24x7 (or set NEWS_PROJECT_DIR). Install PM2 separately.
const path=require('node:path');
const root=process.env.NEWS_PROJECT_DIR||'/srv/news24x7';
module.exports={apps:[
 {name:'news24x7-api',cwd:path.join(root,'backend'),script:'dist/server.js',instances:1,exec_mode:'fork',env:{NODE_ENV:'production',PORT:'8000',LISTEN_HOST:'127.0.0.1',TRUST_PROXY:'1'},max_memory_restart:'600M',kill_timeout:15000,time:true},
 {name:'news24x7-web',cwd:root,script:'scripts/frontend.mjs',args:'start --hostname 127.0.0.1 --port 3000',instances:1,exec_mode:'fork',env:{NODE_ENV:'production',DEPLOY_TARGET:'node'},max_memory_restart:'600M',kill_timeout:15000,time:true}
]};
