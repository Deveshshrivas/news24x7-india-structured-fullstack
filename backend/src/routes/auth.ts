import {randomBytes} from "node:crypto";
import {Router} from "express";
import jwt from "jsonwebtoken";
import {config} from "../config.js";
import {db} from "../database.js";
import {authenticate,clearSessionCookie,createToken,passwords,publicUser,setSessionCookie} from "../security.js";
import type {AuthedRequest,UserDocument} from "../types.js";
import {AppError,asyncRoute} from "../utils.js";
import {exchangeSchema,loginSchema,registerSchema} from "../validation.js";

export const authRouter=Router();

authRouter.post("/register",asyncRoute(async(request,response)=>{
  const body=registerSchema.parse(request.body);const email=body.email.toLowerCase();
  if(await db.collection("users").findOne({email}))throw new AppError(409,"Email already registered");
  const userCount=await db.collection("users").countDocuments({});
  const account={name:body.name,email,password_hash:await passwords.hash(body.password),provider:"email",role:userCount===0?"super_admin":"reporter",active:true,created_at:new Date()};
  const inserted=await db.collection("users").insertOne(account);const user={...account,_id:inserted.insertedId} as UserDocument;
  setSessionCookie(response,createToken(user));response.json({user:publicUser(user)});
}));
authRouter.post("/login",asyncRoute(async(request,response)=>{
  const body=loginSchema.parse(request.body);const user=await db.collection<UserDocument>("users").findOne({email:body.email.toLowerCase()});
  if(!user?.password_hash||!await passwords.verify(body.password,user.password_hash))throw new AppError(401,"Incorrect email or password");
  if(user.active===false)throw new AppError(403,"Account disabled");setSessionCookie(response,createToken(user));response.json({user:publicUser(user)});
}));
authRouter.get("/google",asyncRoute(async(_request,response)=>{
  if(!config.googleClientId||!config.googleClientSecret)throw new AppError(503,"Google OAuth is not configured");
  const state=jwt.sign({nonce:randomBytes(12).toString("base64url")},config.jwtSecret,{algorithm:"HS256",expiresIn:"10m"});
  const query=new URLSearchParams({client_id:config.googleClientId,redirect_uri:`${config.backendUrl}/auth/google/callback`,response_type:"code",scope:"openid email profile",state,prompt:"select_account"});
  response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
}));
authRouter.get("/google/callback",asyncRoute(async(request,response)=>{
  const code=String(request.query.code||""),state=String(request.query.state||"");
  try{jwt.verify(state,config.jwtSecret,{algorithms:["HS256"]})}catch{throw new AppError(400,"Invalid OAuth state")}
  const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:config.googleClientId,client_secret:config.googleClientSecret,redirect_uri:`${config.backendUrl}/auth/google/callback`,grant_type:"authorization_code"})});
  if(!tokenResponse.ok)throw new AppError(502,"Google token exchange failed");const token=await tokenResponse.json() as {access_token?:string};
  if(!token.access_token)throw new AppError(502,"Google token exchange failed");
  const infoResponse=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{headers:{authorization:`Bearer ${token.access_token}`}});if(!infoResponse.ok)throw new AppError(502,"Google profile request failed");
  const info=await infoResponse.json() as {email:string;name?:string;sub:string;picture?:string};const email=info.email.toLowerCase();let user=await db.collection<UserDocument>("users").findOne({email});
  if(!user){const count=await db.collection("users").countDocuments({});const account={name:info.name||email.split("@")[0]!,email,provider:"google",google_sub:info.sub,avatar:info.picture,role:count===0?"super_admin":"reporter",active:true,created_at:new Date()};const inserted=await db.collection("users").insertOne(account);user={...account,_id:inserted.insertedId} as UserDocument}
  const exchangeCode=randomBytes(32).toString("base64url");await db.collection("oauth_codes").insertOne({code:exchangeCode,user_id:user._id,expires_at:new Date(Date.now()+120_000)});response.redirect(`${config.frontendUrl}/auth/callback?code=${encodeURIComponent(exchangeCode)}`);
}));
authRouter.post("/exchange",asyncRoute(async(request,response)=>{const {code}=exchangeSchema.parse(request.body);const item=await db.collection("oauth_codes").findOneAndDelete({code,expires_at:{$gt:new Date()}});if(!item)throw new AppError(400,"Expired login code");const user=await db.collection<UserDocument>("users").findOne({_id:item.user_id});if(!user)throw new AppError(400,"Expired login code");setSessionCookie(response,createToken(user));response.json({user:publicUser(user)})}));
authRouter.get("/me",authenticate,(request:AuthedRequest,response)=>response.json({user:publicUser(request.user!)}));
authRouter.post("/logout",(_request,response)=>{clearSessionCookie(response);response.json({ok:true})});
