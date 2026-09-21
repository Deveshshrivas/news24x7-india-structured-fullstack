const fs = require('fs');
let code = fs.readFileSync('app/latest/page.tsx', 'utf8');

if (!code.includes('import SiteHeader')) {
  code = code.replace(
    `import BrandLogo from "../BrandLogo";`,
    `import SiteHeader from "../SiteHeader";`
  );
  
  const oldHeader = /<header className="articleTop">[\s\S]*?<\/header>/;
  code = code.replace(oldHeader, '<SiteHeader />');
  
  fs.writeFileSync('app/latest/page.tsx', code);
}
