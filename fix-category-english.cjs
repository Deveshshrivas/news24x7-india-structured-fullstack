const fs = require('fs');
let code = fs.readFileSync('app/category/[slug]/page.tsx', 'utf8');

const mapping = `
  const categoryMap: Record<string, string> = {
    "madhya-pradesh": "मध्य प्रदेश",
    "politics": "राजनीति",
    "crime": "अपराध",
    "business": "कारोबार",
    "education": "शिक्षा",
    "sports": "खेल",
    "entertainment": "मनोरंजन",
    "lifestyle": "लाइफस्टाइल"
  };
`;

code = code.replace(
  'const { slug } = await params;',
  mapping + '\n  const { slug } = await params;'
);

code = code.replace(
  'title = decodeURIComponent(slug);',
  'title = decodeURIComponent(slug);\n    if (categoryMap[title.toLowerCase()]) title = categoryMap[title.toLowerCase()];'
);

code = code.replace(
  'title = slug;',
  'title = slug;\n    if (categoryMap[title.toLowerCase()]) title = categoryMap[title.toLowerCase()];'
);

fs.writeFileSync('app/category/[slug]/page.tsx', code);
console.log("Updated category page to handle English slugs");
