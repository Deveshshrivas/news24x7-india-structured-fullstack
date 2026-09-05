import {Router} from "express";
import {db} from "../database.js";
import {requirePermission} from "../security.js";
import {asyncRoute,objectId,routeParam} from "../utils.js";
import {breakingSchema} from "../validation.js";

export const breakingRouter=Router();
breakingRouter.get("/",asyncRoute(async(_request,response)=>{const rows=await db.collection("breaking_news").find({}).sort({created_at:1}).toArray();response.json({items:rows.map(item=>({id:String(item._id),text:item.text,articleSlug:item.article_slug??null,active:item.active}))})}));
breakingRouter.post("/",requirePermission("breaking"),asyncRoute(async(request,response)=>{const body=breakingSchema.parse(request.body);await db.collection("breaking_news").insertOne({...body,created_at:new Date()});response.json({ok:true})}));
breakingRouter.patch("/:itemId",requirePermission("breaking"),asyncRoute(async(request,response)=>{const body=breakingSchema.parse(request.body);await db.collection("breaking_news").updateOne({_id:objectId(routeParam(request.params.itemId))},{$set:body});response.json({ok:true})}));
breakingRouter.delete("/:itemId",requirePermission("breaking"),asyncRoute(async(request,response)=>{await db.collection("breaking_news").deleteOne({_id:objectId(routeParam(request.params.itemId))});response.json({ok:true})}));
