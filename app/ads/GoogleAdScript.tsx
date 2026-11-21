'use client';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function GoogleAdScript() {
  const pathname = usePathname();
  if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/api')) {
    return null;
  }
  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1979035915333459" 
      crossOrigin="anonymous" 
    />
  );
}
