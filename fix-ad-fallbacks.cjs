const fs = require('fs');
let code = fs.readFileSync('app/ads/AdPlacement.tsx', 'utf8');

code = code.replace(
  "const client = 'ca-pub-1979035915333459'; const slot = '5942153390';",
  "const client = 'ca-pub-1979035915333459';\n let slot = '5942153390';\n if (placement.includes('Inline') || placement.includes('home')) slot = '8651402161';\n else if (placement.includes('Right') || placement.includes('sidebar')) slot = '2924343470';"
);

fs.writeFileSync('app/ads/AdPlacement.tsx', code);
console.log("Updated AdPlacement fallbacks");
