import dotenv from "dotenv";
import path from "node:path";
import {fileURLToPath} from "node:url";

const backendRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
dotenv.config({path:path.join(backendRoot,".env"),quiet:true});

const mongodbUri=process.env.MONGODB_URI?.trim();
if(!mongodbUri)throw new Error("MONGODB_URI is required");

export const config={
  mongodbUri,
  databaseName:process.env.MONGODB_DATABASE?.trim()||"news24x7",
  jwtSecret:process.env.JWT_SECRET?.trim()||"dev-only-change-me",
  backendUrl:(process.env.BACKEND_URL||"http://localhost:8000").replace(/\/$/,""),
  frontendUrl:(process.env.FRONTEND_URL||"http://localhost:3000").replace(/\/$/,""),
  googleClientId:process.env.GOOGLE_CLIENT_ID?.trim()||"",
  googleClientSecret:process.env.GOOGLE_CLIENT_SECRET?.trim()||"",
  cookieSecure:process.env.COOKIE_SECURE?.toLowerCase()==="true",
  development:process.env.NODE_ENV!=="production",
  allowedOrigins:(process.env.ALLOWED_ORIGINS||process.env.FRONTEND_URL||"http://localhost:3000").split(",").map(value=>value.trim()).filter(Boolean),
  mongodbDnsServers:(process.env.MONGODB_DNS_SERVERS||(process.platform==="win32"?"8.8.8.8,1.1.1.1":"")).split(",").map(value=>value.trim()).filter(Boolean),
  port:Number(process.env.PORT||8000),
};
