import {Router} from 'express';
import {db} from '../database.js';
import {articleResponse} from '../serializers.js';
import {AppError,asyncRoute} from '../utils.js';
export const epaperRouter=Router();
export function indianDay(date:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
export function dayBounds(day:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new AppError(400,'Invalid edition date');
  const start=new Date(`${day}T00:00:00+05:30`);
  if(!Number.isFinite(start.getTime())||new Date(`${day}T00:00:00Z`).toISOString().slice(0,10)!==day)throw new AppError(400,'Invalid edition date');
  return {$gte:start,$lt:new Date(start.getTime()+86400000)};
}
epaperRouter.get('/',asyncRoute(async(_req,res)=>{
  const items=await db.collection('articles').aggregate([
    {$match:{status:'published',published_at:{$type:'date',$lte:new Date()}}},
    {$group:{_id:{$dateToString:{date:'$published_at',format:'%Y-%m-%d',timezone:'Asia/Kolkata'}},count:{$sum:1}}},
    {$sort:{_id:-1}},{$limit:30}
  ]).toArray();
  const editions=await Promise.all(items.map(async item=>{
    const lead=await db.collection('articles').findOne({status:'published',published_at:{...dayBounds(item._id),$lte:new Date()}},{sort:{published_at:-1,_id:-1}});
    return {date:item._id,count:item.count,lead:lead?articleResponse(lead):null};
  }));
  res.set('Cache-Control','no-store').json({items:editions});
}));
epaperRouter.get('/:date',asyncRoute(async(req,res)=>{
  const date=String(req.params.date);
  const rows=await db.collection('articles').find({status:'published',published_at:{...dayBounds(date),$lte:new Date()}},{projection:{legacy_html:0,legacy_image_urls:0,media:0}}).sort({published_at:-1,_id:-1}).toArray();
  if(!rows.length)throw new AppError(404,'No published news for this date');
  res.set('Cache-Control','no-store').json({date,items:rows.map(row=>articleResponse(row))});
}));
