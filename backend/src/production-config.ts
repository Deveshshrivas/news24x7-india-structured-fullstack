type Settings={development:boolean;jwtSecret:string;cookieSecure:boolean;frontendUrl:string;backendUrl:string;allowedOrigins:string[];databaseEngine:string;mysql:{user:string;password:string};googleClientId:string;googleClientSecret:string};
export function validateProductionConfig(settings:Settings){
 if(settings.development)return;
 if(settings.jwtSecret.length<32||/dev-only|replace-with|change-me/i.test(settings.jwtSecret))throw Error('Production requires a strong, unique JWT_SECRET (at least 32 characters)');
 if(!settings.cookieSecure)throw Error('Production requires COOKIE_SECURE=true');
 const publicUrl=new URL(settings.frontendUrl);
 if(publicUrl.protocol!=='https:'||['localhost','127.0.0.1','::1'].includes(publicUrl.hostname))throw Error('Production FRONTEND_URL must be the public HTTPS domain');
 if(!settings.allowedOrigins.length||settings.allowedOrigins.some(origin=>{try{return new URL(origin).protocol!=='https:'||new URL(origin).origin!==origin}catch{return true}}))throw Error('Production ALLOWED_ORIGINS must contain exact HTTPS origins, without paths or wildcards');
 if(settings.databaseEngine==='mysql'&&(!settings.mysql.password||settings.mysql.user==='root'))throw Error('Production MySQL requires a password-protected application user, not root');
 if(Boolean(settings.googleClientId)!==Boolean(settings.googleClientSecret))throw Error('Set both Google OAuth credentials, or neither');
}
