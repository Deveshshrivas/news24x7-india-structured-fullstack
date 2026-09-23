import type {MetadataRoute} from 'next';
import {siteUrl} from './seo';

type Article={slug:string;category:string;publishedAt?:string;updatedAt?:string;imageUrl?:string};
export const revalidate=300;

export async function generateSitemaps() {
  const backend=(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'');
  const res = await fetch(backend+'/articles/sitemap-count',{signal:AbortSignal.timeout(60000),cache:'no-store'}).catch(()=>null);
  if(!res || !res.ok) return [{ id: 0 }];
  const {count} = await res.json();
  const limit = 40000;
  const numSitemaps = Math.max(1, Math.ceil(count / limit));
  return Array.from({ length: numSitemaps }, (_, id) => ({ id }));
}

export default async function sitemap({ id = 0 }: { id?: number }): Promise<MetadataRoute.Sitemap> {
 const backend=(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'');
 const response=await fetch(backend+'/articles/sitemap?page='+id,{signal:AbortSignal.timeout(60000),cache:'no-store'});
 if(!response.ok)throw Error('Published sitemap data is unavailable');
 const {items:articles}=await response.json() as {items:Article[]};
 const newest=articles[0]?.updatedAt||articles[0]?.publishedAt;
 
 const englishMap: Record<string, string> = {
  "मध्य प्रदेश": "madhya-pradesh",
  "राजनीति": "politics",
  "राजनीत": "politics",
  "अपराध": "crime",
  "कारोबार": "business",
  "शिक्षा": "education",
  "खेल": "sports",
  "मनोरंजन": "entertainment",
  "लाइफस्टाइल": "lifestyle"
 };
 
 const hinglishMap: Record<string, string> = {
  "राजनीति": "rajneeti",
  "राजनीत": "rajneeti",
  "अपराध": "apradh",
  "कारोबार": "karobar",
  "शिक्षा": "shiksha",
  "खेल": "khel",
  "मनोरंजन": "manoranjan"
 };

 const urls: MetadataRoute.Sitemap = [];

 if (id === 0) {
   const paths=['/','/latest','/e-paper','/about','/reporters','/contact','/privacy'];
   urls.push(...paths.map(path=>({url: siteUrl + path,lastModified:newest,changeFrequency:path==='/'?'hourly' as const:'weekly' as const,priority:path==='/'?1:0.5})));
   
   urls.push(...[...new Set(articles.map(a=>a.category).filter(Boolean))].flatMap(category => {
     const englishSlug = englishMap[category];
     const hinglishSlug = hinglishMap[category];
     const categoryUrls = [{ url: siteUrl + '/category/' + category, changeFrequency: 'hourly' as const, priority: 0.8 }];
     if (englishSlug) categoryUrls.push({ url: siteUrl + '/category/' + englishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
     if (hinglishSlug) categoryUrls.push({ url: siteUrl + '/category/' + hinglishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
     return categoryUrls as MetadataRoute.Sitemap;
   }));
 }

 urls.push(...articles.filter(a=>a.slug).map(a=>({
   url: siteUrl + '/news/'+a.slug,
   lastModified:a.updatedAt||a.publishedAt,
   changeFrequency:'daily' as const,
   priority:0.8,
   images:a.imageUrl?[a.imageUrl.startsWith('http')?a.imageUrl:(siteUrl+a.imageUrl)]:[]
 })));

 return urls;
}
