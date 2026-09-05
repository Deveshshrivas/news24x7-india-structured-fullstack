import {Router} from "express";
import {db} from "../database.js";
import {passwords,publicUser,requireSuperAdmin} from "../security.js";
import type {AuthedRequest,UserDocument} from "../types.js";
import {AppError,asyncRoute,objectId,routeParam} from "../utils.js";
import {createUserSchema,userRoleSchema} from "../validation.js";

export const usersRouter=Router();
usersRouter.use(requireSuperAdmin);
usersRouter.get("/",asyncRoute(async(_request,response)=>{const users=await db.collection<UserDocument>("users").find({}).sort({created_at:1}).toArray();response.json({items:users.map(publicUser)})}));
usersRouter.post("/",asyncRoute(async(request,response)=>{const body=createUserSchema.parse(request.body);const email=body.email.toLowerCase();if(await db.collection("users").findOne({email}))throw new AppError(409,"Email already registered");const account={name:body.name,email,password_hash:await passwords.hash(body.password),provider:"email",role:body.role,active:true,created_at:new Date()};const inserted=await db.collection("users").insertOne(account);response.status(201).json({user:publicUser({...account,_id:inserted.insertedId} as UserDocument)})}));
usersRouter.patch("/:userId",asyncRoute(async(request:AuthedRequest,response)=>{const userId=routeParam(request.params.userId),body=userRoleSchema.parse(request.body);if(String(request.user!._id)===userId&&(!body.active||body.role!==request.user!.role))throw new AppError(400,"You cannot deactivate or change the role of your own account");await db.collection("users").updateOne({_id:objectId(userId)},{$set:{role:body.role,active:body.active}});response.json({ok:true})}));
