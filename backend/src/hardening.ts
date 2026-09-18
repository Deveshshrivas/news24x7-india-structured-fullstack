import type {RequestHandler} from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {randomUUID} from 'node:crypto';
import {config} from './config.js';
import {AppError} from './utils.js';
export const securityHeaders=helmet({contentSecurityPolicy:false,crossOriginResourcePolicy:{policy:'cross-origin'},strictTransportSecurity:config.development?false:{maxAge:31536000}});
export const loginLimiter=rateLimit({windowMs:15*60*1000,limit:20,skipSuccessfulRequests:true,standardHeaders:'draft-8',legacyHeaders:false,message:{detail:'Too many login attempts. Try again in 15 minutes.'}});
export const exchangeLimiter=rateLimit({windowMs:60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{detail:'Too many authentication requests. Try again shortly.'}});
export const mutationLimiter=rateLimit({windowMs:60*1000,limit:120,skip:req=>['GET','HEAD','OPTIONS'].includes(req.method),standardHeaders:'draft-8',legacyHeaders:false,message:{detail:'Too many write requests. Try again shortly.'}});
export const requestContext:RequestHandler=(req,res,next)=>{
 const id=randomUUID();res.set('X-Request-ID',id);
 res.on('finish',()=>{if(res.statusCode>=500)console.error(JSON.stringify({event:'request_failed',requestId:id,method:req.method,path:req.path,status:res.statusCode}))});
 if(req.cookies?.news_token&&!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers['sec-fetch-site']==='cross-site'&&!config.allowedOrigins.includes(String(req.headers.origin||'')))return next(new AppError(403,'Cross-site request rejected'));
 if(req.cookies?.news_token||req.headers.authorization)res.set('Cache-Control','private, no-store');
 next();
};
