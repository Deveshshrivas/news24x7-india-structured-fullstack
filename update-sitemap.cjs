const fs = require('fs');
let code = fs.readFileSync('app/sitemap.ts', 'utf8');

code = code.replace(
  'type Article={slug:string;category:string;publishedAt?:string;updatedAt?:string};',
  'type Article={slug:string;category:string;publishedAt?:string;updatedAt?:string;imageUrl?:string};'
);

code = code.replace(
  "...articles.filter(a=>a.slug).map(a=>({url: siteUrl + '/news/'+a.slug,lastModified:a.updatedAt||a.publishedAt,changeFrequency:'daily' as const,priority:0.8}))",
  "...articles.filter(a=>a.slug).map(a=>({url: siteUrl + '/news/'+a.slug,lastModified:a.updatedAt||a.publishedAt,changeFrequency:'daily' as const,priority:0.8,images:a.imageUrl?[a.imageUrl.startsWith('http')?a.imageUrl:(siteUrl+a.imageUrl)]:[]}))"
);

fs.writeFileSync('app/sitemap.ts', code);
console.log("Updated app/sitemap.ts");
