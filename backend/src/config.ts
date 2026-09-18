import dotenv from "dotenv";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readFileSync,existsSync} from "node:fs";
import {validateProductionConfig} from './production-config.js';

const backendRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
dotenv.config({path:path.join(backendRoot,".env"),quiet:true});

const mongodbUri=process.env.MONGODB_URI?.trim();
const databaseEngine=process.env.DATABASE_ENGINE?.trim()||'mongodb';
if(!['mongodb','mysql'].includes(databaseEngine))throw new Error('Invalid DATABASE_ENGINE');
if(!mongodbUri&&databaseEngine==='mongodb')throw new Error("MONGODB_URI is required");
const rootEnv=path.join(backendRoot,'..','.env');
const rootSettings=existsSync(rootEnv)?dotenv.parse(readFileSync(rootEnv)):{};
const mysqlSetting=(key:string)=>process.env[key]||rootSettings[key]||'';

export const config={
  mongodbUri:mongodbUri||'mongodb://127.0.0.1:27017',
  databaseEngine,
  mysql:{host:mysqlSetting('MYSQL_HOST')||'127.0.0.1',port:Number(mysqlSetting('MYSQL_PORT')||3306),database:mysqlSetting('MYSQL_DATABASE')||'news24x7',user:mysqlSetting('MYSQL_USER')||'root',password:mysqlSetting('MYSQL_PASSWORD')},
  databaseName:process.env.MONGODB_DATABASE?.trim()||"news24x7",
  jwtSecret:process.env.JWT_SECRET?.trim()||"dev-only-change-me",
  backendUrl:(process.env.BACKEND_URL||"http://localhost:8000").replace(/\/$/,""),
  frontendUrl:(process.env.FRONTEND_URL||"http://localhost:3000").replace(/\/$/,""),
  googleClientId:process.env.GOOGLE_CLIENT_ID?.trim()||"",
  googleClientSecret:process.env.GOOGLE_CLIENT_SECRET?.trim()||"",
  googleRedirectUrl:process.env.GOOGLE_REDIRECT_URL?.trim()||`${(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'')}/auth/google/callback`,
  trustProxy:process.env.TRUST_PROXY==='1'?1:process.env.TRUST_PROXY==='0'?false:process.env.NODE_ENV==='production'?false:1,
  cookieSecure:process.env.COOKIE_SECURE?.toLowerCase()==="true",
  development:process.env.NODE_ENV!=="production",
  allowedOrigins:(process.env.ALLOWED_ORIGINS||process.env.FRONTEND_URL||"http://localhost:3000").split(",").map(value=>value.trim()).filter(Boolean),
  mongodbDnsServers:(process.env.MONGODB_DNS_SERVERS||(process.platform==="win32"?"8.8.8.8,1.1.1.1":"")).split(",").map(value=>value.trim()).filter(Boolean),
  port:Number(process.env.PORT||8000),
  listenHost:process.env.LISTEN_HOST|| (process.env.NODE_ENV==='production'?'127.0.0.1':'0.0.0.0'),
};
validateProductionConfig(config);
