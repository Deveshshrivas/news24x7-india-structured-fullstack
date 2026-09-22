import {Router} from "express";
import {db} from "../database.js";
import {authenticate} from "../security.js";
import {asyncRoute} from "../utils.js";
import type {AuthedRequest} from "../types.js";

export const dashboardRouter=Router();

dashboardRouter.get("/stats",authenticate,asyncRoute(async(request: AuthedRequest,response)=>{
  const articles=db.collection("articles");
  const reporters=db.collection("reporters");
  const user=request.user!;
  const isLimited=user.role==="reporter"||user.role==="ad_manager";
  const authorFilter=isLimited?{author:user.name}:{};
  const [viewResult,publishedStories,draftStories,reviewStories,totalReporters,activeReporters]=await Promise.all([
    articles.aggregate<{total:number}>([{$match:authorFilter},{$group:{_id:null,total:{$sum:{$convert:{input:"$views",to:"long",onError:0,onNull:0}}}}}]).next(),
    articles.countDocuments({status:"published",...authorFilter}),
    articles.countDocuments({status:"draft",...authorFilter}),
    articles.countDocuments({status:"review",...authorFilter}),
    isLimited?0:db.collection("users").countDocuments({role:"reporter"}),
    isLimited?0:db.collection("users").countDocuments({role:"reporter", active:true}),
  ]);
  response.json({
    totalViews:Number(viewResult?.total??0),
    publishedStories,
    draftStories,
    reviewStories,
    totalReporters,
    activeReporters,
  });
}));
