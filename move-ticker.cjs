const fs = require('fs');

// 1. Add BreakingTicker to SiteHeader.tsx
let headerCode = fs.readFileSync('app/SiteHeader.tsx', 'utf8');
if (!headerCode.includes('import { BreakingTicker }')) {
  headerCode = headerCode.replace(
    'import { HeaderSearch } from "./features/search";',
    'import { HeaderSearch } from "./features/search";\nimport { BreakingTicker } from "./features/breaking";'
  );
  headerCode = headerCode.replace(
    '</header>',
    '</header>\n      <BreakingTicker />'
  );
  fs.writeFileSync('app/SiteHeader.tsx', headerCode);
}

// 2. Remove BreakingTicker from page.tsx (Home)
let pageCode = fs.readFileSync('app/page.tsx', 'utf8');
pageCode = pageCode.replace('import { BreakingTicker } from "./features/breaking";\n', '');
pageCode = pageCode.replace('<BreakingTicker />\n', '');
fs.writeFileSync('app/page.tsx', pageCode);

console.log("Moved BreakingTicker to SiteHeader");
