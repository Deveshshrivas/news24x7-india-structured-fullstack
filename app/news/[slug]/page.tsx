import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleReader from "./ArticleReader";
import { demoNews } from "../../demo-news";
type Article = {
  title: string;
  category: string;
  imageUrl?: string;
  excerpt: string;
  body: string;
  author: string;
  publishedAt?: string;
};
const article = (
  title: string,
  category: string,
  imageUrl: string,
  excerpt: string,
  details: string,
): Article => ({
  title,
  category,
  imageUrl,
  excerpt,
  body: `${excerpt}\n\n${details}\n\nइस खबर से जुड़े नए तथ्य और आधिकारिक अपडेट मिलते ही NEWS24x7 INDIA इस रिपोर्ट को अपडेट करेगा।`,
  author: "NEWS24x7 INDIA",
});
const fallback: Record<string, Article> = {
  "bharat-ki-nayi-udaan": article(
    "नई ऊर्जा, नया भारत: शहरों से गांवों तक बदलती विकास की तस्वीर",
    "देश-दुनिया",
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=85",
    "देशभर में बुनियादी सुविधाओं और डिजिटल सेवाओं के विस्तार से लोगों के जीवन में तेजी से बदलाव आ रहा है।",
    "भारत के अलग-अलग हिस्सों में विकास की नई पहलें तेजी से आगे बढ़ रही हैं। आने वाले महीनों में इस अभियान का दायरा और बढ़ाया जाएगा।",
  ),
  "madhya-pradesh-vikas": article(
    "प्रदेश के छोटे शहरों में नए अवसर, युवाओं के लिए खुल रहे रोजगार के द्वार",
    "मध्य प्रदेश",
    "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1400&q=85",
    "स्थानीय उद्योग, शिक्षा और तकनीक से रोजगार के नए अवसर तैयार हो रहे हैं।",
    "प्रदेश के कई छोटे शहरों में कौशल केंद्र, स्थानीय उद्योग और डिजिटल सेवाओं के विस्तार से युवाओं को अपने जिले में रोजगार के विकल्प मिल रहे हैं।",
  ),
  "khel-mahotsav": article(
    "युवा खिलाड़ियों ने राष्ट्रीय प्रतियोगिता में रचा इतिहास",
    "खेल",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=85",
    "शानदार प्रदर्शन के साथ टीम ने फाइनल में जगह बनाई।",
    "युवा खिलाड़ियों ने अनुशासित खेल और लगातार बेहतर प्रदर्शन से राष्ट्रीय प्रतियोगिता के निर्णायक मुकाबले में प्रवेश किया। प्रशिक्षकों ने पूरी टीम की सराहना की।",
  ),
  "shiksha-digital": article(
    "डिजिटल कक्षाओं से गांव के विद्यार्थियों को मिल रही नई दिशा",
    "शिक्षा",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=85",
    "तकनीक आधारित पढ़ाई से दूरस्थ क्षेत्रों तक बेहतर शिक्षा पहुंच रही है।",
    "स्मार्ट स्क्रीन, डिजिटल पाठ्य सामग्री और शिक्षक प्रशिक्षण से ग्रामीण विद्यार्थियों को विषय समझने और अभ्यास करने के अधिक अवसर मिल रहे हैं।",
  ),
  "business-growth": article(
    "स्थानीय कारोबार को ऑनलाइन बाजार से मिली नई रफ्तार",
    "कारोबार",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=85",
    "छोटे व्यापारियों ने डिजिटल माध्यम से देशभर में ग्राहक बनाए।",
    "डिजिटल भुगतान, ऑनलाइन कैटलॉग और ई-कॉमर्स प्रशिक्षण से स्थानीय उत्पाद अब नए शहरों के ग्राहकों तक पहुंच रहे हैं।",
  ),
};
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const r = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:8000"}/articles/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (r.ok) return r.json();
  } catch {}
  const demo = demoNews.find((x) => x.slug === slug);
  return demo
    ? {
        ...demo,
        body: `${demo.title}\n\n${demo.excerpt}\n\nयह NEWS24x7 INDIA की नमूना समाचार सामग्री है। एडमिन डैशबोर्ड से इसे संपादित करके पूरा समाचार, तथ्य और आगे के अपडेट प्रकाशित किए जा सकते हैं।`,
      }
    : (fallback[slug] ?? null);
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();
  const paragraphs = a.body.split(/\n\s*\n/).filter(Boolean);
  const spoken = [a.category, a.title, a.excerpt, ...paragraphs].join("। ");
  return (
    <main className="articlePage">
      <header className="articleTop">
        <Link className="brand" href="/">
          <span className="brand24">
            NEWS<span>24x7</span>
          </span>
          <b>INDIA</b>
          <small>सच दिखाने की हिम्मत</small>
        </Link>
        <Link href="/latest">← सभी समाचार</Link>
      </header>
      <article>
        <div className="breadcrumbs">
          <Link href="/">होम</Link> /{" "}
          <Link href={`/latest?category=${encodeURIComponent(a.category)}`}>
            {a.category}
          </Link>
        </div>
        <span className="category">{a.category}</span>
        <h1>{a.title}</h1>
        <p className="dek">{a.excerpt}</p>
        <div className="byline">
          <b>{a.author}</b>
          <span>
            {a.publishedAt
              ? new Date(a.publishedAt).toLocaleString("hi-IN")
              : "NEWS24x7 INDIA"}
          </span>
        </div>
        <ArticleReader text={spoken} />
        {a.imageUrl && (
          <img className="articleHero" src={a.imageUrl} alt={a.title} />
        )}
        <div className="articleBody">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
      <footer className="articleFooter">
        © 2026 NEWS24x7 INDIA • निष्पक्ष और विश्वसनीय पत्रकारिता
      </footer>
    </main>
  );
}
