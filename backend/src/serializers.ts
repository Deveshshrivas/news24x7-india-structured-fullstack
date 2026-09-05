import type {WithId,Document} from "mongodb";
import {iso} from "./utils.js";

export function articleResponse(article:WithId<Document>,full=false){const data:Record<string,unknown>={id:String(article._id),title:article.title,slug:article.slug,excerpt:article.excerpt,category:article.category,imageUrl:article.image_url,status:article.status,featured:article.featured??false,author:article.author_name??"न्यूज़ डेस्क",publishedAt:iso(article.published_at),updatedAt:iso(article.updated_at),seoTitle:article.seo_title,seoDescription:article.seo_description,seoKeywords:article.seo_keywords,seoImageUrl:article.seo_image_url};if(full)data.body=article.body;return data}
export function categoryResponse(item:WithId<Document>){return{id:String(item._id),name:item.name,slug:item.slug,parentId:item.parent_id?String(item.parent_id):null,active:item.active??true,position:item.position??0}}
export function audioResponse(item:WithId<Document>){return{id:String(item._id),title:item.title,filename:item.filename,size:item.size,active:item.active,position:item.position,audioUrl:`/audio/${item._id}/stream`}}
