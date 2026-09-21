const fs = require('fs');
let code = fs.readFileSync('app/category/[slug]/page.tsx', 'utf8');

const mapping = `
  const categoryMap: Record<string, string> = {
    // English
    "madhya-pradesh": "मध्य प्रदेश",
    "politics": "राजनीति",
    "crime": "अपराध",
    "business": "कारोबार",
    "education": "शिक्षा",
    "sports": "खेल",
    "entertainment": "मनोरंजन",
    "lifestyle": "लाइफस्टाइल",
    
    // Hinglish
    "rajneeti": "राजनीति",
    "apradh": "अपराध",
    "karobar": "कारोबार",
    "shiksha": "शिक्षा",
    "khel": "खेल",
    "manoranjan": "मनोरंजन"
  };
`;

code = code.replace(
  /const categoryMap: Record<string, string> = \{[\s\S]*?\};\s*/,
  mapping
);

fs.writeFileSync('app/category/[slug]/page.tsx', code);
console.log("Updated category page to handle Hinglish slugs");
