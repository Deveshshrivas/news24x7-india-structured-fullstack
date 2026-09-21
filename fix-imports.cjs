const fs = require('fs');

// Fix page.tsx (home)
let home = fs.readFileSync('app/page.tsx', 'utf8');
if (!home.includes('import BrandLogo')) {
  home = `import BrandLogo from "./BrandLogo";\n` + home;
}
fs.writeFileSync('app/page.tsx', home);

// Fix news/[slug]/page.tsx
let article = fs.readFileSync('app/news/[slug]/page.tsx', 'utf8');
const articleHeaderPattern = /<header className="articleTop">[\s\S]*?<\/header>/;
article = article.replace(articleHeaderPattern, '<SiteHeader />');
fs.writeFileSync('app/news/[slug]/page.tsx', article);

console.log("Fixed imports");
