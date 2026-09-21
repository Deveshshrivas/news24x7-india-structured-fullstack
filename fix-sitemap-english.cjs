const fs = require('fs');
let code = fs.readFileSync('app/sitemap.ts', 'utf8');

const mapping = `
 const categoryMap: Record<string, string> = {
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
`;

code = code.replace(
  'const paths=[',
  mapping + '\n const paths=['
);

code = code.replace(
  '...[...new Set(articles.map(a=>a.category).filter(Boolean))].map(category=>({url: siteUrl + \'/category/\'+category,changeFrequency:\'hourly\' as const,priority:0.8}))',
  `...[...new Set(articles.map(a=>a.category).filter(Boolean))].flatMap(category => {
   const englishSlug = categoryMap[category];
   const urls = [{ url: siteUrl + '/category/' + category, changeFrequency: 'hourly' as const, priority: 0.8 }];
   if (englishSlug) {
     urls.push({ url: siteUrl + '/category/' + englishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
   }
   return urls;
 })`
);

fs.writeFileSync('app/sitemap.ts', code);
console.log("Updated sitemap.ts to output both languages");
