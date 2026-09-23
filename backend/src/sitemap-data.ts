import {db} from './database.js';

const cache = new Map<number, {items:unknown[]; expires:number}>();
const pendingMap = new Map<number, Promise<unknown[]>>();
let countCache = {count: 0, expires: 0};
let pendingCount: Promise<number>|undefined;

export async function sitemapArticleCount() {
  if (countCache.expires > Date.now()) return countCache.count;
  return pendingCount ??= db.collection('articles').countDocuments({status:'published'}).then(c => {
    countCache = {count: c, expires: Date.now() + 600000}; // 10 mins cache
    return c;
  }).finally(() => { pendingCount = undefined; });
}

export async function sitemapArticles(page: number = 0){
  const limit = 40000;
  const skip = page * limit;
  const cached = cache.get(page);
  
  if(cached && cached.expires > Date.now()) return cached.items;
  
  let pending = pendingMap.get(page);
  if (!pending) {
    pending = db.collection('articles')
      .find({status:'published'},{projection:{_id:1,slug:1,category:1,published_at:1,updated_at:1,image_url:1,image_file_id:1}})
      .sort({published_at:-1})
      .skip(skip)
      .limit(limit)
      .toArray()
      .then(rows => {
        const items = rows.map(row=>({
          slug: row.slug,
          category: row.category,
          publishedAt: row.published_at,
          updatedAt: row.updated_at,
          imageUrl: row.image_url || (row.image_file_id ? "/api/backend/articles/"+row._id+"/image" : undefined)
        }));
        cache.set(page, {items, expires: Date.now() + 300000}); // 5 mins cache
        return items;
      })
      .finally(() => { pendingMap.delete(page); });
    pendingMap.set(page, pending);
  }
  return pending;
}
