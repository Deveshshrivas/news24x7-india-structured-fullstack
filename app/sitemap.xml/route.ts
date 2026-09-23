import {siteUrl} from '../seo';

export async function GET() {
  const backend=(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'');
  const res = await fetch(backend+'/articles/sitemap-count',{signal:AbortSignal.timeout(60000),cache:'no-store'}).catch(()=>null);
  
  let count = 0;
  if(res && res.ok) {
    const data = await res.json();
    count = data.count || 0;
  }
  
  const limit = 40000;
  const numSitemaps = Math.max(1, Math.ceil(count / limit));
  
  const sitemaps = Array.from({ length: numSitemaps }, (_, i) => 
    `<sitemap><loc>${siteUrl}/sitemap/${i}.xml</loc></sitemap>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=300, must-revalidate',
    },
  });
}
