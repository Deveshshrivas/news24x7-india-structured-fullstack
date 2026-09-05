import {Router} from "express";
import {db} from "../database.js";
import {articleResponse} from "../serializers.js";
import {getCurrentUser,requirePermission,rolePermissions} from "../security.js";
import type {AuthedRequest} from "../types.js";
import {AppError,asyncRoute,escapeRegex,objectId,routeParam,slugifyTitle} from "../utils.js";
import {articleSchema} from "../validation.js";

export const articlesRouter=Router();
async function uniqueSlug(value:string){const base=slugifyTitle(value);let slug=base,suffix=2;while(await db.collection("articles").findOne({slug})){slug=`${base}-${suffix++}`}return slug}
articlesRouter.get("/",asyncRoute(async(request:AuthedRequest,response)=>{
  const page=Math.max(1,Number(request.query.page)||1),limit=Math.max(1,Math.min(50,Number(request.query.limit)||12));const query:Record<string,unknown>={};
  if(request.query.admin==="true"){const user=await getCurrentUser(request);const allowed=rolePermissions[user.role]??new Set();if(!allowed.has("*")&&!allowed.has("articles"))throw new AppError(403,"Insufficient permission");if(request.query.status)query.status=String(request.query.status)}else query.status="published";
  if(request.query.category)query.category=String(request.query.category);
  const search=String(request.query.q||"").trim();if(search){const escaped=escapeRegex(search),slugTerm=escapeRegex(search.replace(/[\s_]+/g,"-"));query.$or=["title","excerpt","category","author_name","seo_keywords"].map(field=>({[field]:{$regex:escaped,$options:"i"}})).concat([{slug:{$regex:slugTerm,$options:"i"}}])}
  const collection=db.collection("articles");const [total,items,categories]=await Promise.all([collection.countDocuments(query),collection.find(query).sort({published_at:-1}).skip((page-1)*limit).limit(limit).toArray(),collection.distinct("category",{status:"published"})]);
  response.json({items:items.map(item=>articleResponse(item,request.query.admin==="true")),page,limit,total,pages:Math.max(1,Math.ceil(total/limit)),categories});
}));
articlesRouter.get("/:slug",asyncRoute(async(request,response)=>{const row=await db.collection("articles").findOne({slug:routeParam(request.params.slug),status:"published"});if(!row)throw new AppError(404,"News not found");if(request.query.track_view!=="false")await db.collection("articles").updateOne({_id:row._id},{$inc:{views:1}});response.json(articleResponse(row,true))}));
articlesRouter.post("/",requirePermission("articles"),asyncRoute(async(request:AuthedRequest,response)=>{const body=articleSchema.parse(request.body),now=new Date();const document={...body,slug:await uniqueSlug(body.title),author_id:request.user!._id,author_name:request.user!.name,views:0,created_at:now,updated_at:now,published_at:body.status==="published"?now:null};const inserted=await db.collection("articles").insertOne(document);response.json(articleResponse({...document,_id:inserted.insertedId},true))}));
articlesRouter.patch("/:itemId",requirePermission("articles"),asyncRoute(async(request,response)=>{const id=objectId(routeParam(request.params.itemId)),body=articleSchema.parse(request.body),existing=await db.collection("articles").findOne({_id:id});if(!existing)throw new AppError(404,"News not found");const updates:Record<string,unknown>={...body,updated_at:new Date()};if(body.status==="published"&&!existing.published_at)updates.published_at=new Date();await db.collection("articles").updateOne({_id:id},{$set:updates});response.json({ok:true})}));
articlesRouter.delete("/:itemId",requirePermission("articles"),asyncRoute(async(request,response)=>{await db.collection("articles").deleteOne({_id:objectId(routeParam(request.params.itemId))});response.json({ok:true})}));
