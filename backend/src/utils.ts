import {randomBytes} from "node:crypto";
import type {NextFunction,Request,RequestHandler,Response} from "express";
import {ObjectId} from "mongodb";

export class AppError extends Error{constructor(public status:number,message:string){super(message)}}
export const asyncRoute=(handler:(request:Request,response:Response,next:NextFunction)=>Promise<unknown>):RequestHandler=>(request,response,next)=>{void handler(request,response,next).catch(next)};
export function objectId(value:string){if(!ObjectId.isValid(value))throw new AppError(400,"Invalid ID");return new ObjectId(value)}
export function routeParam(value:string|string[]|undefined){const result=Array.isArray(value)?value[0]:value;if(!result)throw new AppError(400,"Missing route parameter");return result}
export function slugifyTitle(value:string,maxLength=180){const normalized=value.normalize("NFKC").toLocaleLowerCase();let output="";for(const character of normalized){if(/[\p{L}\p{M}\p{N}]/u.test(character))output+=character;else if(output&&!output.endsWith("-"))output+="-"}return output.replace(/^-+|-+$/g,"").slice(0,maxLength).replace(/-+$/g,"")||randomBytes(4).toString("hex")}
export function escapeRegex(value:string){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
export function iso(value:unknown){return value instanceof Date?value.toISOString():value?new Date(value as string).toISOString():null}
