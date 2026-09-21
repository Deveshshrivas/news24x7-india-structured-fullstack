const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

if (!code.includes('import SiteHeader')) {
  code = code.replace(
    `import BrandLogo from "./BrandLogo";`,
    `import SiteHeader from "./SiteHeader";`
  );
  
  const topRegex = /<div className="topline">[\s\S]*?<\/div>[\s\S]*?<\/div>/;
  code = code.replace(topRegex, '');
  
  const headerRegex = /<header>[\s\S]*?<\/header>/;
  code = code.replace(headerRegex, '<SiteHeader />');
  
  fs.writeFileSync('app/page.tsx', code);
}
