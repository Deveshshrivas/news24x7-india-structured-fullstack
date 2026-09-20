import {Router} from "express";
import {db} from "../database.js";
import {passwords,publicUser,requireSuperAdmin,authenticate} from "../security.js";
import type {AuthedRequest,UserDocument} from "../types.js";
import {AppError,asyncRoute,objectId,routeParam} from "../utils.js";
import {createUserSchema,userRoleSchema} from "../validation.js";

export const usersRouter=Router();

// GET: allow super_admin and admin (admin sees read-only)
usersRouter.get("/",authenticate,asyncRoute(async(request:AuthedRequest,response)=>{
  const user=request.user!;
  if(user.role!=="super_admin"&&user.role!=="admin")throw new AppError(403,"Insufficient permission");
  const users=await db.collection<UserDocument>("users").find({}).sort({created_at:1}).toArray();response.json({items:users.map(publicUser)});
}));

// POST: allow both super_admin and admin, but admin can only create reporter/editor/ad_manager
usersRouter.post("/",authenticate,asyncRoute(async(request:AuthedRequest,response)=>{
  const user=request.user!;
  if(user.role!=="super_admin"&&user.role!=="admin")throw new AppError(403,"Only super admin or admin can create users");
  const body=createUserSchema.parse(request.body);
  // Admin cannot create admin or super_admin
  if(user.role==="admin"&&(body.role==="admin"||body.role==="super_admin"))throw new AppError(403,"Admin can only create reporter, editor or ad manager accounts");
  const email=body.email.toLowerCase();
  if(await db.collection("users").findOne({email}))throw new AppError(409,"Email already registered");
  const account={name:body.name,email,password_hash:await passwords.hash(body.password),provider:"email",role:body.role,active:true,created_at:new Date()};
  const inserted=await db.collection("users").insertOne(account);
  response.status(201).json({user:publicUser({...account,_id:inserted.insertedId} as UserDocument)});
}));

// PATCH: only super_admin
usersRouter.patch("/:userId",requireSuperAdmin,asyncRoute(async(request:AuthedRequest,response)=>{const userId=routeParam(request.params.userId),body=userRoleSchema.parse(request.body);if(String(request.user!._id)===userId&&(!body.active||body.role!==request.user!.role))throw new AppError(400,"You cannot deactivate or change the role of your own account");await db.collection("users").updateOne({_id:objectId(userId)},{$set:{role:body.role,active:body.active}});response.json({ok:true})}));
