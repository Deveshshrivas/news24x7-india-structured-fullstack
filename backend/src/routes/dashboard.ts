import {Router} from "express";
import {db} from "../database.js";
import {authenticate} from "../security.js";
import {asyncRoute} from "../utils.js";

export const dashboardRouter=Router();

dashboardRouter.get("/stats",authenticate,asyncRoute(async(_request,response)=>{
  const articles=db.collection("articles");
  const reporters=db.collection("reporters");
  const [viewResult,publishedStories,draftStories,reviewStories,totalReporters,activeReporters]=await Promise.all([
    articles.aggregate<{total:number}>([{$group:{_id:null,total:{$sum:{$convert:{input:"$views",to:"long",onError:0,onNull:0}}}}}]).next(),
    articles.countDocuments({status:"published"}),
    articles.countDocuments({status:"draft"}),
    articles.countDocuments({status:"review"}),
    reporters.countDocuments({}),
    reporters.countDocuments({active:true}),
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
