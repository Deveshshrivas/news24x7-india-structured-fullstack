import {Suspense} from 'react';
export default function LatestLayout({children}:{children:React.ReactNode}) {
  return <Suspense fallback={<main aria-busy="true">Loading news…</main>}>{children}</Suspense>;
}
