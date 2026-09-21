const fs = require('fs');
let code = fs.readFileSync('app/SiteHeader.tsx', 'utf8');

const mapping = {
  "मध्य प्रदेश": "madhya-pradesh",
  "राजनीती": "politics",
  "अपराध": "crime",
  "कारोबार": "business",
  "शिक्षा": "education",
  "खेल": "sports",
  "मनोरंजन": "entertainment",
  "लाइफस्टाइल": "lifestyle"
};

code = code.replace(
  /href=\{`\/latest\?category=\$\{encodeURIComponent\(item\.query\)\}`\}/g,
  'href={`/category/${item.query === "मध्य प्रदेश" ? "madhya-pradesh" : item.query === "राजनीती" ? "politics" : item.query === "अपराध" ? "crime" : item.query === "कारोबार" ? "business" : item.query === "शिक्षा" ? "education" : item.query === "खेल" ? "sports" : item.query === "मनोरंजन" ? "entertainment" : item.query === "लाइफस्टाइल" ? "lifestyle" : encodeURIComponent(item.query)}`}'
);

fs.writeFileSync('app/SiteHeader.tsx', code);
console.log("Updated SiteHeader to use clean English category URLs");
