import {Router} from "express";
import type {Document,WithId} from "mongodb";
import {db} from "../database.js";
import {categoryResponse} from "../serializers.js";
import {articleResponse} from "../serializers.js";
import {requirePermission} from "../security.js";
import {AppError,asyncRoute,escapeRegex,objectId,routeParam,slugifyTitle} from "../utils.js";
import {categorySchema} from "../validation.js";

export const categoriesRouter=Router();
categoriesRouter.get("/news",asyncRoute(async(_request,response)=>{
  const rows=await db.collection("categories").aggregate<WithId<Document>>([
    {$match:{active:{$ne:false}}},
    {$sort:{position:1,name:1}},
    {$lookup:{from:"articles",let:{categoryName:"$name"},pipeline:[
      {$match:{status:"published",$expr:{$eq:["$category","$$categoryName"]}}},
      {$sort:{published_at:-1,_id:-1}},{$limit:7},
      {$project:{body:0,legacy_html:0,legacy_image_urls:0,media:0}}
    ],as:"articles"}},
    {$match:{"articles.0":{$exists:true}}}
  ]).toArray();
  response.set("Cache-Control","no-store").json({items:rows.map(row=>({category:categoryResponse(row),articles:row.articles.map((article:Parameters<typeof articleResponse>[0])=>articleResponse(article))}))});
}));
async function uniqueSlug(name:string,excludeId?:ReturnType<typeof objectId>){const base=slugifyTitle(name);let slug=base,suffix=2;while(await db.collection("categories").findOne({slug,...(excludeId?{_id:{$ne:excludeId}}:{})})){slug=`${base}-${suffix++}`}return slug}
async function parentObjectId(parentId:string|null|undefined,itemId?:ReturnType<typeof objectId>){if(!parentId)return null;const parent=objectId(parentId);if(itemId?.equals(parent))throw new AppError(400,"A category cannot be its own parent");const row=await db.collection("categories").findOne({_id:parent});if(!row)throw new AppError(400,"Parent category not found");if(row.parent_id)throw new AppError(400,"Only one subcategory level is supported");return parent}
categoriesRouter.get("/",asyncRoute(async(_request,response)=>{const items=await db.collection("categories").find({}).sort({position:1,name:1}).toArray();response.json({items:items.map(categoryResponse)})}));
categoriesRouter.post("/",requirePermission("categories"),asyncRoute(async(request,response)=>{const body=categorySchema.parse(request.body),name=body.name.trim();if(await db.collection("categories").findOne({name:{$regex:`^${escapeRegex(name)}$`,$options:"i"}}))throw new AppError(409,"Category already exists");const now=new Date(),document={name,slug:await uniqueSlug(name),parent_id:await parentObjectId(body.parent_id),active:body.active,position:body.position,created_at:now,updated_at:now};const inserted=await db.collection("categories").insertOne(document);response.json(categoryResponse({...document,_id:inserted.insertedId}))}));
categoriesRouter.patch("/:itemId",requirePermission("categories"),asyncRoute(async(request,response)=>{const id=objectId(routeParam(request.params.itemId)),body=categorySchema.parse(request.body),existing=await db.collection("categories").findOne({_id:id});if(!existing)throw new AppError(404,"Category not found");const parentId=await parentObjectId(body.parent_id,id);if(parentId&&await db.collection("categories").countDocuments({parent_id:id}))throw new AppError(409,"A category with subcategories cannot become a subcategory");const name=body.name.trim();if(await db.collection("categories").findOne({_id:{$ne:id},name:{$regex:`^${escapeRegex(name)}$`,$options:"i"}}))throw new AppError(409,"Category already exists");const updates={name,slug:await uniqueSlug(name,id),parent_id:parentId,active:body.active,position:body.position,updated_at:new Date()};await db.collection("categories").updateOne({_id:id},{$set:updates});response.json(categoryResponse({...existing,...updates}))}));
categoriesRouter.delete("/:itemId",requirePermission("categories"),asyncRoute(async(request,response)=>{const id=objectId(routeParam(request.params.itemId)),existing=await db.collection("categories").findOne({_id:id});if(!existing)throw new AppError(404,"Category not found");if(await db.collection("categories").countDocuments({parent_id:id}))throw new AppError(409,"Delete its subcategories first");if(await db.collection("articles").countDocuments({category:existing.name}))throw new AppError(409,"This category is used by news articles");await db.collection("categories").deleteOne({_id:id});response.json({ok:true})}));
