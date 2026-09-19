import {randomBytes} from "node:crypto";
import {Router} from "express";
import {z} from "zod";
import {objectId} from "../utils.js";
import jwt from "jsonwebtoken";
import {config} from "../config.js";
import {db} from "../database.js";
import {authenticate,clearSessionCookie,createToken,passwords,publicUser,setSessionCookie} from "../security.js";
import type {AuthedRequest,UserDocument} from "../types.js";
import {AppError,asyncRoute} from "../utils.js";
import {exchangeSchema,loginSchema} from "../validation.js";

export const authRouter=Router();

authRouter.post("/register",(_request,response)=>{
  response.status(403).json({detail:"Public signup is disabled. Contact the super admin for access."});
});
authRouter.post("/login",asyncRoute(async(request,response)=>{
  const body=loginSchema.parse(request.body);const user=await db.collection<UserDocument>("users").findOne({email:body.email.toLowerCase()});
  if(!user?.password_hash||!await passwords.verify(body.password,user.password_hash))throw new AppError(401,"Incorrect email or password");
  if(user.active===false)throw new AppError(403,"Account disabled");setSessionCookie(response,createToken(user));response.json({user:publicUser(user)});
}));
authRouter.get("/google",asyncRoute(async(_request,response)=>{
  if(!config.googleClientId||!config.googleClientSecret)throw new AppError(503,"Google OAuth is not configured");
  const state=jwt.sign({nonce:randomBytes(32).toString("base64url"),purpose:'google-login'},config.jwtSecret,{algorithm:"HS256",expiresIn:"10m"});
  response.cookie('news_oauth_state',state,{httpOnly:true,secure:config.cookieSecure,sameSite:'lax',path:'/',maxAge:600000,domain:'.' + new URL(config.frontendUrl).hostname.replace(/^www\./,'')});
  const query=new URLSearchParams({client_id:config.googleClientId,redirect_uri:config.googleRedirectUrl,response_type:"code",scope:"openid email profile",state,prompt:"select_account"});
  response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${query}`);
}));
authRouter.get("/google/callback",asyncRoute(async(request,response)=>{
  const code=String(request.query.code||""),state=String(request.query.state||"");
  response.clearCookie('news_oauth_state',{httpOnly:true,secure:config.cookieSecure,sameSite:'lax',path:'/',domain:'.' + new URL(config.frontendUrl).hostname.replace(/^www\./,'')});
  if(!code||!state||request.cookies?.news_oauth_state!==state)throw new AppError(400,'Invalid OAuth state');
  try{const payload=jwt.verify(state,config.jwtSecret,{algorithms:["HS256"]});if(typeof payload==='string'||payload.purpose!=='google-login')throw Error()}catch{throw new AppError(400,"Invalid OAuth state")}
  const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",signal:AbortSignal.timeout(15000),headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:config.googleClientId,client_secret:config.googleClientSecret,redirect_uri:config.googleRedirectUrl,grant_type:"authorization_code"})});
  if(!tokenResponse.ok)throw new AppError(502,"Google token exchange failed");const token=await tokenResponse.json() as {access_token?:string};
  if(!token.access_token)throw new AppError(502,"Google token exchange failed");
  const infoResponse=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{signal:AbortSignal.timeout(15000),headers:{authorization:`Bearer ${token.access_token}`}});if(!infoResponse.ok)throw new AppError(502,"Google profile request failed");
  const info=await infoResponse.json() as {email?:string;email_verified?:boolean;sub:string};
  if(!info.email||info.email_verified!==true)throw new AppError(403,"A verified Google email is required");
  const user=await db.collection<UserDocument>("users").findOne({email:info.email.toLowerCase()});
  if(!user)throw new AppError(403,"Contact the super admin for access. Public signup is disabled.");
  if(user.active===false)throw new AppError(403,"Account disabled");
  const exchangeCode=randomBytes(32).toString("base64url");await db.collection("oauth_codes").insertOne({code:exchangeCode,user_id:user._id,expires_at:new Date(Date.now()+120_000)});response.redirect(`${config.frontendUrl}/auth/callback?code=${encodeURIComponent(exchangeCode)}`);
}));
authRouter.post("/exchange",asyncRoute(async(request,response)=>{const {code}=exchangeSchema.parse(request.body);const item=await db.collection("oauth_codes").findOneAndDelete({code,expires_at:{$gt:new Date()}});if(!item)throw new AppError(400,"Expired login code");const user=await db.collection<UserDocument>("users").findOne({_id:item.user_id});if(!user)throw new AppError(400,"Expired login code");if(user.active===false)throw new AppError(403,"Account disabled");setSessionCookie(response,createToken(user));response.json({user:publicUser(user)})}));
authRouter.get("/me",authenticate,(request:AuthedRequest,response)=>response.json({user:publicUser(request.user!)}));

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional()
});

authRouter.patch("/profile", authenticate, asyncRoute(async (request: AuthedRequest, response) => {
  const body = updateProfileSchema.parse(request.body);
  const updates: any = { updated_at: new Date() };
  if (body.name) updates.name = body.name;
  if (body.email) {
    const email = body.email.toLowerCase();
    if (email !== request.user?.email) {
      if (await db.collection("users").findOne({ email })) throw new AppError(409, "Email already registered");
      updates.email = email;
    }
  }
  if (body.password) {
    updates.password_hash = await passwords.hash(body.password);
  }
  
  await db.collection("users").updateOne(
    { _id: objectId(request.user!._id) },
    { $set: updates }
  );
  
  const updatedUser = await db.collection("users").findOne({ _id: objectId(request.user!._id) });
  response.json({ user: publicUser(updatedUser as UserDocument) });
}));

authRouter.post("/logout",(_request,response)=>{clearSessionCookie(response);response.json({ok:true})});
