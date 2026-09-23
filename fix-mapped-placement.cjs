const fs = require('fs');
let code = fs.readFileSync('app/ads/AdPlacement.tsx', 'utf8');

code = code.replace(
  "const mappedPlacement = placement === 'homeTop' ? 'homeTop' : placement === 'homeBottom' ? 'homeBottom' : placement.includes('Inline') ? 'midArticle' : 'sidebar';",
  "const mappedPlacement = placement === 'homeTop' ? 'homeTop' : placement === 'homeBottom' ? 'homeBottom' : placement.includes('Inline') ? 'midArticle' : placement.includes('sidebar') || placement.includes('Right') || placement.includes('Left') ? 'sidebar' : null;"
);

fs.writeFileSync('app/ads/AdPlacement.tsx', code);
console.log("Updated mappedPlacement logic");
