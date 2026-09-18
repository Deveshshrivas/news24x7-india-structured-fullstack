import type {Document} from 'mongodb';
import type {UserDocument,AuthedRequest} from './types.js';
import {AppError,asyncRoute,objectId,routeParam} from './utils.js';
import {db} from './database.js';
export function assertArticleAccess(user:UserDocument,article:Document){if(user.role==='reporter'&&String(article.author_id)!==String(user._id))throw new AppError(403,'Reporters can only manage their own articles')}
export const restrictArticle=asyncRoute(async(req:AuthedRequest,_res,next)=>{const row=await db.collection('articles').findOne({_id:objectId(routeParam(req.params.itemId))},{projection:{_id:1,author_id:1}});if(!row)throw new AppError(404,'News not found');assertArticleAccess(req.user!,row);next()});
