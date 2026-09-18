import {Router} from 'express';
import {ObjectId} from 'mongodb';
import {z} from 'zod';
import {db} from '../database.js';
import {asyncRoute,AppError} from '../utils.js';
export const engagementRouter=Router();
const schema=z.object({articleId:z.string().regex(/^[a-f0-9]{24}$/),session:z.string().uuid()}).strict();
engagementRouter.post('/',asyncRoute(async(req,res)=>{
 const {articleId,session}=schema.parse(req.body),now=new Date();
 const article=await db.collection('articles').findOne({_id:new ObjectId(articleId),status:'published'},{projection:{_id:1}});
 if(!article)throw new AppError(404,'Article not found');
 const records=db.collection<{_id:string;article_id:ObjectId;seconds:number;last_seen:Date;expires_at:Date}>('reading_sessions');
 const id=articleId+':'+session;
 const previous=await records.findOneAndUpdate({_id:id,last_seen:{$lte:new Date(now.getTime()-25000)},seconds:{$lt:1800}},{$set:{last_seen:now},$inc:{seconds:30}},{returnDocument:'before'});
 if(previous)await db.collection('articles').updateOne({_id:article._id},{$inc:{reading_seconds:30}});
 else {try{await records.insertOne({_id:id,article_id:article._id,seconds:0,last_seen:now,expires_at:new Date(now.getTime()+86400000)})}catch(error){if((error as {code?:number}).code!==11000)throw error}}
 res.json({ok:true});
}));
