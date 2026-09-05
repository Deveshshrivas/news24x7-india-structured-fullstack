import {z} from "zod";

export const registerSchema=z.object({name:z.string().trim().min(2).max(80),email:z.email(),password:z.string().min(8).max(128)});
export const loginSchema=z.object({email:z.email(),password:z.string()});
export const exchangeSchema=z.object({code:z.string().min(1)});
export const roleSchema=z.enum(["super_admin","admin","editor","reporter","ad_manager"]);
export const userRoleSchema=z.object({role:roleSchema,active:z.boolean().default(true)});
export const createUserSchema=registerSchema.extend({role:roleSchema.default("admin")});
export const breakingSchema=z.object({text:z.string().trim().min(3).max(300),article_slug:z.string().nullable().optional(),active:z.boolean().default(true)});
export const articleSchema=z.object({title:z.string().trim().min(5).max(250),excerpt:z.string().trim().min(10).max(600),body:z.string().min(20),category:z.string().trim().min(2).max(80),image_url:z.string().nullable().optional(),status:z.enum(["draft","review","published"]).default("draft"),featured:z.boolean().default(false),seo_title:z.string().max(70).nullable().optional(),seo_description:z.string().max(170).nullable().optional(),seo_keywords:z.string().max(500).nullable().optional(),seo_image_url:z.string().nullable().optional()});
export const categorySchema=z.object({name:z.string().trim().min(2).max(80),parent_id:z.string().nullable().optional(),active:z.boolean().default(true),position:z.number().int().min(0).max(9999).default(0)});
