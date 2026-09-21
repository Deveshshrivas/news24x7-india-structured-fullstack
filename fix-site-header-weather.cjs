const fs = require('fs');
let code = fs.readFileSync('app/SiteHeader.tsx', 'utf8');

if (!code.includes('import WeatherWidget')) {
  code = code.replace(
    'import BrandLogo from "./BrandLogo";',
    'import BrandLogo from "./BrandLogo";\nimport WeatherWidget from "./WeatherWidget";'
  );
  
  code = code.replace(
    '<Link className="brand" href="/">\n            <BrandLogo />\n          </Link>',
    '<div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>\n            <Link className="brand" href="/">\n              <BrandLogo />\n            </Link>\n            <WeatherWidget />\n          </div>'
  );
  
  fs.writeFileSync('app/SiteHeader.tsx', code);
}
