import BrandLogo from "./BrandLogo";
import LatestChannelVideo from "./LatestChannelVideo";
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
  "देश-दुनिया",
  "मध्य प्रदेश",
  "राजनीति",
  "अपराध",
  "कारोबार",
  "शिक्षा",
  "खेल",
  "मनोरंजन",
  "लाइफस्टाइल",
];

export default async function Home() {
  const [seoArticles, mostRead] = await Promise.all([
    getPublishedArticles({ limit: 10 }),
    getPublishedArticles({ limit: 10, sort: "views" }),
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
          <div className="homeBrandNote"><strong>सच दिखाने की हिम्मत</strong><span>आपके शहर से, देश-दुनिया तक।</span></div>
          <Link className="homePaperLink" href="/e-paper">ई-पेपर पढ़ें ↗</Link>
          <HeaderSearch />
        </div>
        <nav aria-label="मुख्य नेविगेशन">
          <div className="shell navinner">
            <Link className="homeicon" href="/" aria-current="page">
              होम
            </Link>
            {categories.map((item) => (
              <Link href={`/latest?category=${encodeURIComponent(item)}`} key={item}>
                {item}
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
      <section className="shell leadgrid" aria-label="प्रमुख समाचार">
        {stories[0] ? <Link
          href={`/news/${stories[0].slug}`}
          className="hero"
          style={{
            backgroundImage: `linear-gradient(0deg,rgba(4,10,20,.9),rgba(4,10,20,.04)),url(${stories[0].image})`,
          }}
        >
          <div>
            <span className="tag">{stories[0].category}</span>
            <h1>{stories[0].title}</h1>
            <p>{stories[0].excerpt}</p>
            <small>{stories[0].author || "NEWS24x7 INDIA"} • {stories[0].time}</small>
          </div>
        </Link> : <p role="status">अभी खबरें उपलब्ध नहीं हैं। कृपया कुछ देर बाद दोबारा देखें।</p>}
        <div className="sidelead">
          {stories.slice(1, 3).map((s) => (
            <Link
              href={`/news/${s.slug}`}
              className="overlaycard"
              key={s.slug}
              style={{
                backgroundImage: `linear-gradient(0deg,rgba(4,10,20,.88),rgba(4,10,20,.08)),url(${s.image})`,
              }}
            >
              <div>
                <span className="tag">{s.category}</span>
                <h2>{s.title}</h2>
                <small>{s.time}</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
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
          <div className="adbox">
            <span>ADVERTISEMENT</span>
            <strong>यहाँ आपका विज्ञापन</strong>
            <p>अपने कारोबार को लाखों पाठकों तक पहुँचाएँ</p>
            <Link href="/advertise">विज्ञापन दें</Link>
          </div>
        </aside>
      </section>
      <CategoryNewsRows />
      <section className="shell homePaperBanner"><div><span>आपका दैनिक समाचार संकलन</span><h2>अखबार का अनुभव। अब डिजिटल।</h2><p>दिनभर की प्रकाशित खबरें एक जगह पढ़ें और PDF के रूप में सहेजें।</p></div><Link href="/e-paper">ई-पेपर खोलें ↗</Link></section>
      <LatestChannelVideo />
      <footer>
        <div className="shell footergrid">
          <div>
            <div className="brand inverse">
              <BrandLogo/>
            </div>
            <p>
              निष्पक्ष, निर्भीक और विश्वसनीय पत्रकारिता। भारत और दुनिया की हर
              महत्वपूर्ण खबर, हर पल आपके साथ।
            </p>
          </div>
          <div>
            <h4>महत्वपूर्ण लिंक</h4>
            <Link href="/about">हमारे बारे में</Link>
            <Link href="/contact">संपर्क करें</Link>
            <Link href="/grievance">शिकायत निवारण</Link>
            <Link href="/privacy">गोपनीयता नीति</Link>
          </div>
          <div>
            <h4>संपर्क</h4>
            <p>
              हनुमान कॉलोनी, गोले का मंदिर
              <br />
              ग्वालियर, मध्य प्रदेश
            </p>
            <p>news@news24x7india.com</p>
          </div>
          <div>
            <h4>हमसे जुड़ें</h4>
            <div className="socials">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                f
              </a>
              <a href="https://www.youtube.com/c/news24x7india/videos" target="_blank" rel="noopener noreferrer" aria-label="NEWS24x7 INDIA YouTube चैनल">
                ▶
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                ◎
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer">
                𝕏
              </a>
            </div>
          </div>
        </div>
        <div className="copyright">
          © 2026 NEWS24x7 INDIA. सर्वाधिकार सुरक्षित।
        </div>
      </footer>
    </main>
  );
}
