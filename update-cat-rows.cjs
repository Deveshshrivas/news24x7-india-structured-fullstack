const fs = require('fs');
let code = fs.readFileSync('app/CategoryNewsRows.tsx', 'utf8');

if (!code.includes('import { Fragment }')) {
  code = code.replace(
    'import {useEffect,useState} from "react";',
    'import {useEffect,useState,Fragment} from "react";\nimport GoogleAd from "./ads/GoogleAd";'
  );
}

code = code.replace(
  'return <section id={`category-${index}`}',
  'return <Fragment key={row.category.id}>\n          <section id={`category-${index}`}'
);

code = code.replace(
  '        </section>;',
  '        </section>\n          {(index === 2 || index === 5) && (\n            <div style={{gridColumn: "1 / -1", width: "100%", margin: "20px 0"}}>\n              <GoogleAd client="ca-pub-1979035915333459" slot="8651402161" format="fluid" layoutKey="-6r+di+5g-2m-8y" />\n            </div>\n          )}\n        </Fragment>;'
);

// wait, the key was on the <section> originally! 
code = code.replace('} key={row.category.id}>', '}>'); // remove it from section since it's on Fragment now

fs.writeFileSync('app/CategoryNewsRows.tsx', code);
console.log("Updated CategoryNewsRows.tsx");
