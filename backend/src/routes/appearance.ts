import {Router} from 'express';
import {ObjectId} from 'mongodb';
import {z} from 'zod';
import {db} from '../database.js';
import {authenticate} from '../security.js';
import type {AuthedRequest} from '../types.js';
import {AppError,asyncRoute} from '../utils.js';
export const appearanceRouter=Router();
const schema=z.object({theme:z.enum(['light','black','charcoal','warm'])}).strict();
appearanceRouter.get('/',asyncRoute(async(_req,res)=>{
  const row=await db.collection('site_settings').findOne({key:'appearance'});
  res.set('Cache-Control','no-store').json({theme:row?.theme??null,darkPalette:row?.darkPalette??(row?.theme!=='light'?row?.theme:null)??'black'});
}));
appearanceRouter.put('/',authenticate,asyncRoute(async(req:AuthedRequest,res)=>{
  if(!['admin','super_admin'].includes(req.user?.role??''))throw new AppError(403,'Only admins and super admins can change the website theme');
  const {theme}=schema.parse(req.body);
  await db.collection('site_settings').updateOne({_id:new ObjectId('000000000000000000000001')},{$set:{key:'appearance',theme,...(theme!=='light'?{darkPalette:theme}:{}),updated_at:new Date(),updated_by:req.user!._id}},{upsert:true});
  res.set('Cache-Control','no-store').json({theme});
}));
