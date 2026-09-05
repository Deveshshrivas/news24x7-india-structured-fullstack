import type {Request} from "express";
import type {ObjectId} from "mongodb";

export type Role="super_admin"|"admin"|"editor"|"reporter"|"ad_manager";
export type UserDocument={_id:ObjectId;name:string;email:string;password_hash?:string;provider:string;role:Role;active:boolean;avatar?:string;google_sub?:string;created_at:Date};
export type AuthedRequest=Request&{user?:UserDocument};
