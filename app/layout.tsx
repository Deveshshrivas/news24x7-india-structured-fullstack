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
import "./article-media.css";
import "./article-youtube.css";
import "./article-reporter.css";
import "./article-reader-theme.css";
import "./reporters.css";
import "./brand-logo.css";
import "./category-rows.css";
import "./theme.css";
import "./dark-fixes.css";
import "./header-search.css";
import "./header-interactions.css";
import "./breaking-link.css";
import "./search-thumb.css";
import "./admin-polish.css";
import "./home-editorial.css";
import "./dark-contrast.css";
import "./site-palettes.css";
import "./news-image-fit.css";
import "./article-editorial.css";
import "./ads/ads.css";
import SiteAppearance from "./SiteAppearance";
import PublicPageAds from "./ads/PublicPageAds";
import AdPlacement from "./ads/AdPlacement";
import {ThemeToggle} from "./features/theme";
import {absoluteUrl, defaultSocialImage, safeJsonLd, siteDescription, siteName, siteUrl} from "./seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName;
  const tagline = settings.tagline;
  const siteDescription = settings.description;

  return {
    metadataBase: new URL(siteUrl),
    title: {default: `${siteName} | ${tagline}`, template: `%s | ${siteName}`},
    description: siteDescription,
    icons: {icon: {url: "/news24x7-icon.svg", type: "image/svg+xml"}},
    openGraph: {
      type: "website",
      locale: "hi_IN",
      url: siteUrl,
      title: `${siteName} | ${tagline}`,
      description: siteDescription,
      siteName,
      images: [{url: defaultSocialImage, width: 1920, height: 1080, alt: siteName}],
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} | ${tagline}`,
      description: siteDescription,
      images: [defaultSocialImage],
    }
  };
}
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="hi" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html: `try{const t=localStorage.getItem('news-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch{}`}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html: safeJsonLd(websiteSchema)}}/></head><body>{children}<PublicPageAds><AdPlacement placement="publicBottom"/></PublicPageAds><ThemeToggle/><SiteAppearance/></body></html>;
}
