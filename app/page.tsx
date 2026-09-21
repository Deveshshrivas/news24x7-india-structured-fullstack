import BrandLogo from "./BrandLogo";
// News and engagement rankings must be read at request time, not frozen at build.
export const dynamic = 'force-dynamic';
import PopularSlideshow from "./PopularSlideshow";
import LatestChannelVideo from "./LatestChannelVideo";
import AdPlacement from "./ads/AdPlacement";
import GoogleAd from "./ads/GoogleAd";
import type { Metadata } from "next";
import Link from "next/link";
import { BreakingTicker } from "./features/breaking";
import { HomeAudioHighlights } from "./features/audio";
import { CategoryNewsRows } from "./features/news";
import { HeaderSearch } from "./features/search";
import {
  absoluteUrl,
  cleanDescription,
  cleanTitle,
  safeJsonLd,
  siteDescription,
  siteName,
} from "./seo";
import { getPublishedArticles } from "./seo-data";
import { getSiteSettings } from "./lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getPublishedArticles({ limit: 5 });
  const lead = articles[0];
  const title = lead
    ? cleanTitle(`${siteName}: ${lead.seoTitle || lead.title}`)
    : `${siteName} | सच दिखाने की हिम्मत`;
  const description = cleanDescription(
    lead?.seoDescription || lead?.excerpt || siteDescription,
  );
  const image = lead?.seoImageUrl || lead?.imageUrl;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: absoluteUrl("/"),
      title,
      description,
      images: image
        ? [{ url: image, alt: lead?.title || siteName }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

const categories = [
  { name: "देश-दुनिया", query: "देश दुनिया" },
  { name: "मध्य प्रदेश", query: "madhya pradesh" },
  { name: "राजनीति", query: "राजनीती" },
  { name: "अपराध", query: "अपराध" },
  { name: "कारोबार", query: "कारोबार" },
  { name: "शिक्षा", query: "शिक्षा" },
  { name: "खेल", query: "खेल" },
  { name: "मनोरंजन", query: "मनोरंजन" },
  { name: "लाइफस्टाइल", query: "लाइफस्टाइल" },
];

export default async function Home() {
  const settings = await getSiteSettings();
  const [seoArticles, mostRead, popular] = await Promise.all([
    getPublishedArticles({ limit: 10 }),
    getPublishedArticles({ limit: 10, sort: "views" }),
    getPublishedArticles({ limit: 15, sort: "engagement" }),
  ]);
  const stories = seoArticles.map(article => ({
    ...article,
    image: article.imageUrl || "/news24x7-icon.svg",
    time: article.publishedAt ? new Date(article.publishedAt).toLocaleString("hi-IN", {timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "",
  }));
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${siteName} ताज़ा समाचार`,
    url: absoluteUrl("/"),
    inLanguage: "hi-IN",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: seoArticles.length,
      itemListElement: seoArticles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/news/${encodeURIComponent(article.slug)}`),
        name: article.title,
      })),
    },
  };
  return (
    <main className="newsHome">
      <a className="homeSkip" href="#latest-news">सीधे समाचार पढ़ें</a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(pageSchema) }}
      />
      <div className="topline">
        <div className="shell topinner">
          <span>{new Date().toLocaleDateString("hi-IN",{timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
          <span>निष्पक्ष • निर्भीक • आपके साथ</span>
          <div className="toplinks">
            <Link href="/reporters">हमारे रिपोर्टर</Link>
            <Link href="/about">हमारे बारे में</Link>
            <Link href="/contact">संपर्क</Link>
            <Link href="/e-paper">ई-पेपर</Link>
          </div>
        </div>
      </div>
      <header>
        <div className="shell brandrow">
          <Link className="brand" href="/">
            <BrandLogo/>
          </Link>
          <div className="headerAdContainer" style={{flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden', padding: '0 20px', maxHeight: '90px'}}>
            <AdPlacement placement="homeTop"/>
          </div>
          
          <HeaderSearch />
        </div>
        <nav aria-label="मुख्य नेविगेशन">
          <div className="shell navinner">
            <Link className="homeicon" href="/" aria-current="page">
              होम
            </Link>
            {categories.map((item) => (
              <Link href={`/latest?category=${encodeURIComponent(item.query)}`} key={item.name}>
                {item.name}
              </Link>
            ))}
            <Link href="/latest">सभी खबरें</Link>
            <a className="live" href="https://www.youtube.com/c/news24x7india/videos" target="_blank" rel="noopener noreferrer" aria-label="LIVE TV — YouTube चैनल (नया टैब)">
              <i /> LIVE TV
            </a>
          </div>
        </nav>
      </header>
      <BreakingTicker />
      <HomeAudioHighlights
        stories={stories.map(({ title, category, excerpt }) => ({
          title,
          category,
          excerpt,
        }))}
      />
      <div className="shell homeEditionLine"><div><span className="editionDot"/> NEWSROOM <span>/ प्रमुख समाचार</span></div><Link href="/latest">सभी अपडेट देखें ↗</Link></div>
      <PopularSlideshow articles={popular.length?popular:seoArticles}/>
      <div className="shell" style={{textAlign:"center",padding:"16px 0"}}><GoogleAd client="ca-pub-1979035915333459" slot="6277887241"/></div>
      <section id="latest-news" className="shell contentgrid">
        <div>
          <div className="sectionhead">
            <div>
              <span>ताज़ा खबरें</span>
              <h2>लेटेस्ट न्यूज़</h2>
            </div>
            <Link href="/latest">सभी खबरें →</Link>
          </div>
          <div className="storylist">
            {stories.slice(0, 6).map((s) => (
              <article key={s.slug}>
                <Link href={`/news/${s.slug}`} className="thumb">
                  <img src={s.image} alt="" loading="lazy" decoding="async" />
                </Link>
                <div>
                  <span className="category">{s.category}</span>
                  <h3>
                    <Link href={`/news/${s.slug}`}>{s.title}</Link>
                  </h3>
                  <p>{s.excerpt}</p>
                  <small>{s.author || "NEWS24x7 INDIA"} • {s.time}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside>
          <div className="sidebox">
            <div className="boxtitle">सबसे ज्यादा पढ़ी गई</div>
            {mostRead.map((s, i) => (
              <Link className="rank" href={`/news/${s.slug}`} key={s.slug}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <div>
                  <span>{s.category}</span>
                  <h4>{s.title}</h4>
                </div>
              </Link>
            ))}
          </div>
          <AdPlacement placement="sidebar" fallback={
            <div className="adbox">
              <span>ADVERTISEMENT</span>
              <strong>यहाँ आपका विज्ञापन</strong>
              <p>अपने कारोबार को लाखों पाठकों तक पहुँचाएँ</p>
              <Link href="/advertise">विज्ञापन दें</Link>
            </div>
          } />
        </aside>
      </section>
      <CategoryNewsRows />
      <section className="shell homePaperBanner"><div><span>आपका दैनिक समाचार संकलन</span><h2>अखबार का अनुभव। अब डिजिटल।</h2><p>दिनभर की प्रकाशित खबरें एक जगह पढ़ें और PDF के रूप में सहेजें।</p></div><Link href="/e-paper">ई-पेपर खोलें ↗</Link></section>
      <LatestChannelVideo />
      <div className="shell"><AdPlacement placement="homeBottom"/></div>
      <footer>
        <div className="shell footergrid">
          <div>
            <div className="brand inverse">
              <BrandLogo/>
            </div>
            <p>
              {settings.description}
            </p>
          </div>
          <div>
            <h4>महत्वपूर्ण लिंक</h4>
            <Link href="/about">हमारे बारे में</Link>
            <Link href="/contact">संपर्क करें</Link>
            <Link href="/reporters">हमारे रिपोर्टर</Link>
            <Link href="/grievance">शिकायत निवारण</Link>
            <Link href="/privacy">गोपनीयता नीति</Link>
          </div>
          <div>
            <h4>संपर्क</h4>
            <p style={{whiteSpace: "pre-line"}}>
              {settings.address}
            </p>
            <p>{settings.contactEmail}</p>
            {settings.contactPhone && <p>{settings.contactPhone}</p>}
          </div>
          <div>
            <h4>हमसे जुड़ें</h4>
            <div className="socials">
              {settings.socialFacebook && <a href={settings.socialFacebook} target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>}
              {settings.socialYoutube && <a href={settings.socialYoutube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg></a>}
              {settings.socialInstagram && <a href={settings.socialInstagram} target="_blank" rel="noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>}
              {settings.socialX && <a href={settings.socialX} target="_blank" rel="noreferrer" aria-label="X"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.9 3.5h3l-6.5 7.5L23 20.5h-6l-4.7-6.2l-5.4 6.2h-3l6.9-7.9L3 3.5h6.2l4.3 5.7zM16.2 18.5h1.7L6.8 5.5H5l11.2 13z"/></svg></a>}
            </div>
          </div>
        </div>
        <div className="copyright">
          © {new Date().getFullYear()} {settings.siteName}. सर्वाधिकार सुरक्षित।
        </div>
      </footer>
    </main>
  );
}
