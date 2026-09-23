const fs = require('fs');
let code = fs.readFileSync('app/ads/GoogleAd.tsx', 'utf8');

code = code.replace(
  'fullWidth = true, style }: {',
  'fullWidth = true, style, layoutKey }: {'
);

code = code.replace(
  'client: string; slot: string; format?: string; fullWidth?: boolean; style?: React.CSSProperties;',
  'client: string; slot: string; format?: string; fullWidth?: boolean; style?: React.CSSProperties; layoutKey?: string;'
);

code = code.replace(
  'data-ad-format={format}',
  'data-ad-format={format}\n      data-ad-layout-key={layoutKey}'
);

fs.writeFileSync('app/ads/GoogleAd.tsx', code);
console.log("Updated GoogleAd.tsx");
