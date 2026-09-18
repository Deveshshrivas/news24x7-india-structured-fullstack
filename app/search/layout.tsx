import {Suspense} from 'react';
export default function SearchLayout({children}:{children:React.ReactNode}) {
  return <Suspense fallback={<main aria-busy="true">Loading search…</main>}>{children}</Suspense>;
}
