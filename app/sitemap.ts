import type {MetadataRoute} from 'next';
import {absoluteUrl} from './seo';
type Article={slug:string;category:string;publishedAt?:string;updatedAt?:string};
export const revalidate=300;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const backend=(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'');
 const response=await fetch(backend+'/articles/sitemap',{signal:AbortSignal.timeout(60000),cache:'no-store'});
 if(!response.ok)throw Error('Published sitemap data is unavailable');
 const {items:articles}=await response.json() as {items:Article[]};
 const newest=articles[0]?.updatedAt||articles[0]?.publishedAt;
 const paths=['/','/latest','/e-paper','/about','/reporters','/contact','/privacy'];
 return [...paths.map(path=>({url:absoluteUrl(path),lastModified:newest,changeFrequency:path==='/'?'hourly' as const:'weekly' as const,priority:path==='/'?1:0.5})),...[...new Set(articles.map(a=>a.category).filter(Boolean))].map(category=>({url:absoluteUrl('/category/'+encodeURIComponent(category)),changeFrequency:'hourly' as const,priority:0.8})),...articles.filter(a=>a.slug).map(a=>({url:absoluteUrl('/news/'+encodeURIComponent(a.slug)),lastModified:a.updatedAt||a.publishedAt,changeFrequency:'daily' as const,priority:0.8}))];
}
