const fs = require('fs');
let code = fs.readFileSync('app/news/[slug]/page.tsx', 'utf8');

code = code.replace(
  `import BrandLogo from "../../BrandLogo";`,
  `import SiteHeader from "../../SiteHeader";`
);

const oldHeader = `<header className="articleTop">
        <Link className="brand" href="/">
          <BrandLogo/>
        </Link>
        <Link href="/latest">← सभी समाचार</Link>
      </header>`;

code = code.replace(oldHeader, `<SiteHeader />`);

fs.writeFileSync('app/news/[slug]/page.tsx', code);
