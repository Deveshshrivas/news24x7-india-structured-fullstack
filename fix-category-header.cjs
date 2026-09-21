const fs = require('fs');
let code = fs.readFileSync('app/category/[slug]/page.tsx', 'utf8');

if (!code.includes('import SiteHeader')) {
  code = code.replace(
    `import BrandLogo from "../../BrandLogo";`,
    `import SiteHeader from "../../SiteHeader";`
  );
  
  const oldHeader = /<header className="articleTop">[\s\S]*?<\/header>/;
  code = code.replace(oldHeader, '<SiteHeader />');
  
  fs.writeFileSync('app/category/[slug]/page.tsx', code);
  console.log("Updated category page header");
}
