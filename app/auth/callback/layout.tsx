import {Suspense} from 'react';
export default function CallbackLayout({children}:{children:React.ReactNode}) {
  return <Suspense fallback={<main className="loginPage" aria-busy="true">Completing sign in…</main>}>{children}</Suspense>;
}
