const fs = require('fs');
let code = fs.readFileSync('app/layout.tsx', 'utf8');

// Replace Script with GoogleAdScript
code = code.replace(
  'import Script from "next/script";',
  'import GoogleAdScript from "./ads/GoogleAdScript";'
);

code = code.replace(
  '<Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1979035915333459" crossOrigin="anonymous" strategy="afterInteractive" />',
  '<GoogleAdScript />'
);

fs.writeFileSync('app/layout.tsx', code);
console.log("Updated layout.tsx to use GoogleAdScript");
