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

const stories = [
  {
    slug: "bharat-ki-nayi-udaan",
    category: "देश",
    title: "नई ऊर्जा, नया भारत: शहरों से गांवों तक बदलती विकास की तस्वीर",
    excerpt:
      "देशभर में बुनियादी सुविधाओं और डिजिटल सेवाओं के विस्तार से लोगों के जीवन में तेजी से बदलाव आ रहा है।",
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
    time: "12 मिनट पहले",
  },
  {
    slug: "madhya-pradesh-vikas",
    category: "मध्य प्रदेश",
    title:
      "प्रदेश के छोटे शहरों में नए अवसर, युवाओं के लिए खुल रहे रोजगार के द्वार",
    excerpt:
      "स्थानीय उद्योग, शिक्षा और तकनीक से रोजगार के नए अवसर तैयार हो रहे हैं।",
    image:
      "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=900&q=80",
    time: "35 मिनट पहले",
  },
  {
    slug: "khel-mahotsav",
    category: "खेल",
    title: "युवा खिलाड़ियों ने राष्ट्रीय प्रतियोगिता में रचा इतिहास",
    excerpt: "शानदार प्रदर्शन के साथ टीम ने फाइनल में जगह बनाई।",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80",
    time: "1 घंटा पहले",
  },
  {
    slug: "shiksha-digital",
    category: "शिक्षा",
    title: "डिजिटल कक्षाओं से गांव के विद्यार्थियों को मिल रही नई दिशा",
    excerpt:
      "तकनीक आधारित पढ़ाई से दूरस्थ क्षेत्रों तक बेहतर शिक्षा पहुंच रही है।",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80",
    time: "2 घंटे पहले",
  },
  {
    slug: "business-growth",
    category: "कारोबार",
    title: "स्थानीय कारोबार को ऑनलाइन बाजार से मिली नई रफ्तार",
    excerpt: "छोटे व्यापारियों ने डिजिटल माध्यम से देशभर में ग्राहक बनाए।",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
    time: "3 घंटे पहले",
  },
];
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
  const seoArticles = await getPublishedArticles({ limit: 10 });
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
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(pageSchema) }}
      />
      <div className="topline">
        <div className="shell topinner">
          <span>सोमवार, 24 अगस्त 2026</span>
          <span>ग्वालियर • 29°C</span>
          <div className="toplinks">
            <Link href="/about">हमारे बारे में</Link>
            <Link href="/contact">संपर्क</Link>
            <Link href="/e-paper">ई-पेपर</Link>
          </div>
        </div>
      </div>
      <header>
        <div className="shell brandrow">
          <Link className="brand" href="/">
            <span className="brand24">
              NEWS<span>24x7</span>
            </span>
            <b>INDIA</b>
            <small>सच दिखाने की हिम्मत</small>
          </Link>
          <Link href="/advertise" className="headerad">
            <span>विज्ञापन</span>
            <strong>आपका ब्रांड, पूरे भारत तक</strong>
            <small>Advertisement space • 728 × 90</small>
          </Link>
          <HeaderSearch />
        </div>
        <nav>
          <div className="shell navinner">
            <Link className="homeicon" href="/">
              ⌂
            </Link>
            {categories.map((item) => (
              <Link href={`/category/${encodeURIComponent(item)}`} key={item}>
                {item}
              </Link>
            ))}
            <Link href="/latest">सभी खबरें</Link>
            <Link className="live" href="/live">
              <i /> LIVE TV
            </Link>
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
      <section className="shell leadgrid">
        <Link
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
            <small>NEWS24x7 INDIA • {stories[0].time}</small>
          </div>
        </Link>
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
      <section className="shell contentgrid">
        <div>
          <div className="sectionhead">
            <div>
              <span>ताज़ा खबरें</span>
              <h2>लेटेस्ट न्यूज़</h2>
            </div>
            <Link href="/latest">सभी खबरें →</Link>
          </div>
          <div className="storylist">
            {stories.slice(1).map((s) => (
              <article key={s.slug}>
                <Link href={`/news/${s.slug}`} className="thumb">
                  <img src={s.image} alt="" />
                </Link>
                <div>
                  <span className="category">{s.category}</span>
                  <h3>
                    <Link href={`/news/${s.slug}`}>{s.title}</Link>
                  </h3>
                  <p>{s.excerpt}</p>
                  <small>NEWS24x7 INDIA • {s.time}</small>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside>
          <div className="sidebox">
            <div className="boxtitle">सबसे ज्यादा पढ़ी गई</div>
            {stories.slice(0, 4).map((s, i) => (
              <Link className="rank" href={`/news/${s.slug}`} key={s.slug}>
                <b>0{i + 1}</b>
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
      <CategoryNewsRows fallback={stories} />
      <section id="video" className="videoband">
        <div className="shell">
          <div className="sectionhead light">
            <div>
              <span>वीडियो</span>
              <h2>NEWS24x7 वीडियो</h2>
            </div>
            <Link href="/live">लाइव देखें →</Link>
          </div>
          <div className="videogrid">
            <Link href="/live" className="mainvideo">
              <img
                src="https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80"
                alt="न्यूज़रूम"
              />
              <span className="playButton">▶</span>
              <h3>
                दिनभर की बड़ी खबरें: देखिए NEWS24x7 इंडिया का विशेष बुलेटिन
              </h3>
            </Link>
            <div className="videoitems">
              {stories.slice(2, 5).map((s) => (
                <Link href={`/news/${s.slug}`} key={s.slug}>
                  <img src={s.image} alt="" />
                  <div>
                    <span>▶ वीडियो</span>
                    <h4>{s.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <footer>
        <div className="shell footergrid">
          <div>
            <div className="brand inverse">
              <span className="brand24">
                NEWS<span>24x7</span>
              </span>
              <b>INDIA</b>
              <small>सच दिखाने की हिम्मत</small>
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
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
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
