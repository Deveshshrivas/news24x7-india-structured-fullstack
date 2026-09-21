const fs = require('fs');
let code = fs.readFileSync('app/sitemap.ts', 'utf8');

const mapping = `
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
`;

code = code.replace(
  /const categoryMap: Record<string, string> = \{[\s\S]*?\};\s*/,
  mapping
);

code = code.replace(
  /const englishSlug = categoryMap\[category\];[\s\S]*?return urls;\n \}\)/,
  `const englishSlug = englishMap[category];
   const hinglishSlug = hinglishMap[category];
   const urls = [{ url: siteUrl + '/category/' + category, changeFrequency: 'hourly' as const, priority: 0.8 }];
   if (englishSlug) urls.push({ url: siteUrl + '/category/' + englishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
   if (hinglishSlug) urls.push({ url: siteUrl + '/category/' + hinglishSlug, changeFrequency: 'hourly' as const, priority: 0.8 });
   return urls;
 })`
);

fs.writeFileSync('app/sitemap.ts', code);
console.log("Updated sitemap.ts to output Hindi, English, and Hinglish");
