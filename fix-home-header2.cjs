const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
  `import BrandLogo from "./BrandLogo";`,
  `import SiteHeader from "./SiteHeader";`
);

const topHeaderPattern = /<div className="topline">[\s\S]*?<\/header>/;
code = code.replace(topHeaderPattern, '<SiteHeader />');

fs.writeFileSync('app/page.tsx', code);
console.log("Fixed page.tsx properly");
