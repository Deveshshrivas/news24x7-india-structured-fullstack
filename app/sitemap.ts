import type {MetadataRoute} from 'next';
import {siteUrl} from './seo';
type Article={slug:string;category:string;publishedAt?:string;updatedAt?:string;imageUrl?:string};
export const revalidate=300;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const backend=(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'');
 const response=await fetch(backend+'/articles/sitemap',{signal:AbortSignal.timeout(60000),cache:'no-store'});
 if(!response.ok)throw Error('Published sitemap data is unavailable');
 const {items:articles}=await response.json() as {items:Article[]};
 const newest=articles[0]?.updatedAt||articles[0]?.publishedAt;
 
 
 const englishMap: Record<string, string> = {
  "मध्य प्रदेश": "madhya-pradesh",
  "राजनीति": "politics",
  "राजनीती": "politics",
  "अपराध": "crime",
  "कारोबार": "business",
  "शिक्षा": "education",
  "खेल": "sports",
  "मनोरंजन": "entertainment",
  "लाइफस्टाइल": "lifestyle"
 };
 
 const hinglishMap: Record<string, string> = {
  "राजनीति": "rajneeti",
  "राजनीती": "rajneeti",
  "अपराध": "apradh",
  "कारोबार": "karobar",
  "शिक्षा": "shiksha",
  "खेल": "khel",
  "मनोरंजन": "manoranjan"
 };
const paths=['/','/latest','/e-paper','/about','/reporters','/contact','/privacy'];
 return [...paths.map(path=>({url: siteUrl + path,lastModified:newest,changeFrequency:path==='/'?'hourly' as const:'weekly' as const,priority:path==='/'?1:0.5})),...[...new Set(articles.map(a=>a.category).filter(Boolean))].flatMap(category => {
   const englishSlug = englishMap[category];
   const hinglishSlug = hinglishMap[category];
   const urls = [{ url: siteUrl + '/category/' + category, changeFrequency: 'hourly' as const, priority: 0.8 }];
   if (englishSlug) urls.push({ url: siteUrl + '/category/' + englishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
   if (hinglishSlug) urls.push({ url: siteUrl + '/category/' + hinglishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
   return urls;
 }),...articles.filter(a=>a.slug).map(a=>({url: siteUrl + '/news/'+a.slug,lastModified:a.updatedAt||a.publishedAt,changeFrequency:'daily' as const,priority:0.8,images:a.imageUrl?[a.imageUrl.startsWith('http')?a.imageUrl:(siteUrl+a.imageUrl)]:[]}))];
}
