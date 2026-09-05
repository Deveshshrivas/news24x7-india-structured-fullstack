import bcrypt from "bcryptjs";
import type {CookieOptions,NextFunction,Response} from "express";
import jwt from "jsonwebtoken";
import {ObjectId} from "mongodb";
import {config} from "./config.js";
import {db} from "./database.js";
import type {AuthedRequest,Role,UserDocument} from "./types.js";
import {AppError} from "./utils.js";

export const rolePermissions:Record<Role,Set<string>>={super_admin:new Set(["*"]),admin:new Set(["articles","categories","breaking","audio","ads"]),editor:new Set(["articles","categories","breaking","audio"]),reporter:new Set(["articles"]),ad_manager:new Set(["ads"])};
export function publicUser(user:UserDocument){return{id:String(user._id),name:user.name,email:user.email,role:user.role,active:user.active??true,avatar:user.avatar}}
export function createToken(user:UserDocument){return jwt.sign({sub:String(user._id),email:user.email},config.jwtSecret,{algorithm:"HS256",expiresIn:"7d"})}
const cookieOptions:CookieOptions={httpOnly:true,secure:config.cookieSecure,sameSite:config.cookieSecure?"none":"lax",path:"/",maxAge:7*24*60*60*1000};
export function setSessionCookie(response:Response,token:string){response.cookie("news_token",token,cookieOptions)}
export function clearSessionCookie(response:Response){response.clearCookie("news_token",{httpOnly:true,secure:config.cookieSecure,sameSite:config.cookieSecure?"none":"lax",path:"/"})}
export async function getCurrentUser(request:AuthedRequest){
  const header=request.headers.authorization;
  const raw=request.cookies?.news_token||(header?.startsWith("Bearer ")?header.slice(7):undefined);
  if(!raw)throw new AppError(401,"Authentication required");
  let payload:jwt.JwtPayload;
  try{const decoded=jwt.verify(raw,config.jwtSecret,{algorithms:["HS256"]});if(typeof decoded==="string"||!decoded.sub)throw new Error();payload=decoded}catch{throw new AppError(401,"Invalid session")}
  if(!ObjectId.isValid(String(payload.sub)))throw new AppError(401,"Invalid session");
  const user=await db.collection<UserDocument>("users").findOne({_id:new ObjectId(String(payload.sub))});
  if(!user)throw new AppError(401,"Invalid session");
  if(user.active===false)throw new AppError(403,"Account disabled");
  return user;
}
export async function authenticate(request:AuthedRequest,_response:Response,next:NextFunction){try{request.user=await getCurrentUser(request);next()}catch(error){next(error)}}
export function requirePermission(section:string){return async(request:AuthedRequest,_response:Response,next:NextFunction)=>{try{const user=await getCurrentUser(request);const allowed=rolePermissions[user.role]??new Set();if(!allowed.has("*")&&!allowed.has(section))throw new AppError(403,"Insufficient permission");request.user=user;next()}catch(error){next(error)}}}
export async function requireSuperAdmin(request:AuthedRequest,_response:Response,next:NextFunction){try{const user=await getCurrentUser(request);if(user.role!=="super_admin")throw new AppError(403,"Only the super admin can manage users");request.user=user;next()}catch(error){next(error)}}
export const passwords={hash:(value:string)=>bcrypt.hash(value,12),verify:(value:string,hash:string)=>bcrypt.compare(value,hash)};
