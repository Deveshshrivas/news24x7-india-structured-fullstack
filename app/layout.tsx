import type {Metadata, Viewport} from "next";
import "./globals.css";
import "./pages.css";
import "./reader.css";
import "./roles.css";
import "./audio.css";
import "./audio-admin.css";
import "./floating-audio.css";
import "./audio-fix.css";
import "./login.css";
import "./all-news.css";
import "./news-admin.css";
import "./category-rows.css";
import "./theme.css";
import "./dark-fixes.css";
import "./header-search.css";
import "./header-interactions.css";
import "./breaking-link.css";
import "./search-thumb.css";
import "./admin-polish.css";
import {ThemeToggle} from "./features/theme";
import {absoluteUrl, defaultSocialImage, safeJsonLd, siteDescription, siteName, siteUrl} from "./seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {default: `${siteName} | सच दिखाने की हिम्मत`, template: `%s | ${siteName}`},
  description: siteDescription,
  applicationName: siteName,
  authors: [{name: `${siteName} न्यूज़ डेस्क`, url: siteUrl}],
  creator: siteName,
  publisher: siteName,
  keywords: ["हिंदी समाचार", "ताज़ा खबर", "भारत समाचार", "मध्य प्रदेश समाचार", "ब्रेकिंग न्यूज़", "Hindi News"],
  category: "news",
  formatDetection: {email: false, address: false, telephone: false},
  icons: {icon: "/favicon.svg"},
  openGraph: {
    type: "website",
    locale: "hi_IN",
    siteName,
    title: `${siteName} | सच दिखाने की हिम्मत`,
    description: siteDescription,
    images: [{url: defaultSocialImage, width: 1200, height: 630, alt: siteName}],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | सच दिखाने की हिम्मत`,
    description: siteDescription,
    images: [defaultSocialImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1},
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? {google: process.env.GOOGLE_SITE_VERIFICATION} : undefined,
};

export const viewport: Viewport = {width: "device-width", initialScale: 1, themeColor: "#07172b"};

const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "NewsMediaOrganization", "@id": `${siteUrl}/#organization`, name: siteName, url: siteUrl, logo: {"@type": "ImageObject", url: absoluteUrl("/favicon.svg")}},
    {"@type": "WebSite", "@id": `${siteUrl}/#website`, url: siteUrl, name: siteName, inLanguage: "hi-IN", publisher: {"@id": `${siteUrl}/#organization`}, potentialAction: {"@type": "SearchAction", target: `${absoluteUrl("/latest")}?q={search_term_string}`, "query-input": "required name=search_term_string"}},
  ],
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="hi" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html: `try{const t=localStorage.getItem('news-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: safeJsonLd(websiteSchema)}}/></head><body>{children}<ThemeToggle/></body></html>;
}
