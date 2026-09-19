import BrandLogo from "../../BrandLogo";
import {youtubeVideoId} from "../../../backend/src/youtube";
import {getReporter} from "../../reporters/data";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import ArticleReader from "./ArticleReader";
import ReadingTracker from "./ReadingTracker";
import AdPlacement, {adConfigured} from "../../ads/AdPlacement";
type Article = {
  id?: string;
  slug?: string;
  title: string;
  category: string;
  imageUrl?: string;
  youtubeUrl?: string | null;
  media?: {id: string; type: "image" | "video"; name: string; url: string}[];
  excerpt: string;
  body: string;
  author: string;
  authorId?: string;
  publishedAt?: string;
};
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const r = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:8000"}/articles/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (r.ok) return r.json();
  } catch {}
  return null;
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();
  if (a.slug && a.slug !== slug) permanentRedirect(`/news/${encodeURIComponent(a.slug)}`);
  const paragraphs = a.body.split(/\n\s*\n/).filter(Boolean);
  const readingMinutes = Math.max(1, Math.ceil(a.body.trim().split(/\s+/).length / 180));
  const wordCount = a.body.trim().split(/\s+/).length;
  const extendedAds = wordCount >= 600;
  const leftAds = true; // Forced for all articles
  const rightAds = true; // Forced for all articles
  const publishedDate = a.publishedAt ? new Date(a.publishedAt) : null;
  const youtubeId = youtubeVideoId(a.youtubeUrl);
  const reporter = a.authorId ? await getReporter(a.authorId).catch(() => null) : null;
  const spoken = [a.category, a.title, a.excerpt, ...paragraphs].join("। ");
  return (
    <main className="articlePage">
      {a.id && <ReadingTracker articleId={a.id}/>}
      <header className="articleTop">
        <Link className="brand" href="/">
          <BrandLogo/>
        </Link>
        <Link href="/latest">← सभी समाचार</Link>
      </header>
      <div className={`articleAdLayout${leftAds?' hasLeftAds':''}${rightAds?' hasRightAds':''}`}>
      {leftAds && <aside className="articleAdRail articleAdRailLeft" aria-label="Advertisements"><AdPlacement placement="articleLeftTop"/>{extendedAds && <AdPlacement placement="articleLeftBottom"/>}{wordCount>=1000 && <AdPlacement placement="articleLeftExtra"/>}</aside>}
      <article>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">होम</Link> /{" "}
          <Link href={`/latest?category=${encodeURIComponent(a.category)}`}>
            {a.category}
          </Link>
        </nav>
        <span className="category">{a.category}</span>
        <h1>{a.title}</h1>
        <p className="dek">{a.excerpt}</p>
        <div className="byline">
          <b>{a.author}</b>
          {publishedDate && !Number.isNaN(publishedDate.getTime()) && <time dateTime={publishedDate.toISOString()}>{publishedDate.toLocaleString("hi-IN", {timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short"})} IST</time>}
          <span>लगभग {readingMinutes} मिनट में पढ़ें</span>
        </div>
        <ArticleReader text={spoken} />
        {a.imageUrl && (
          <a className="articleImageLink" href={a.imageUrl} target="_blank" rel="noopener noreferrer" aria-label="मुख्य फोटो पूरे आकार में खोलें"><img className="articleHero" src={a.imageUrl} alt={a.title} fetchPriority="high"/><span>फोटो बड़े आकार में देखें ↗</span></a>
        )}
        <div className="articleBody">
          {paragraphs.map((p, i) => (
            <div key={i}><p>{p}</p>{i===3 && paragraphs.length>=8 && <AdPlacement placement="articleInline"/>}</div>
          ))}
        </div>
        {youtubeId && <section className="articleYoutube" aria-label="समाचार का YouTube वीडियो">
          <h2>वीडियो देखें</h2>
          <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
            title={`${a.title} — YouTube वीडियो`} loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
          <a href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noopener noreferrer">YouTube पर देखें ↗</a>
        </section>}
        {!!a.media?.length && <section aria-label="Photos and videos" className="articleMediaGrid">
          {a.media.map((media, index) => <figure key={media.id}>
            {media.type === "video" ? <video controls playsInline preload="none" src={media.url} aria-label={`${a.title} — video ${index + 1}`}/> : <a href={media.url} target="_blank" rel="noreferrer"><img src={media.url} alt={`${a.title} — photo ${index + 1}`} loading="lazy" decoding="async"/></a>}
          </figure>)}
        </section>}
        <AdPlacement placement="articleBottom"/>
        <footer className="articleReporter" aria-label="Post reporter">
          {reporter?.profile.photoUrl ? <img className="reporterAvatar" src={reporter.profile.photoUrl} alt={reporter.profile.name} width={80} height={80} loading="lazy"/> : <span className="articleReporterIcon" aria-hidden="true">✎</span>}
          <div>
            <span className="articleReporterLabel">इस खबर के लेखक</span>
            <strong>{reporter?.profile.name?.trim() || a.author?.trim() || "NEWS24x7 न्यूज़ डेस्क"}</strong>
            <span className="articleReporterPublication">NEWS24x7 INDIA</span>
            {reporter?.profile.designation && <span className="articleReporterPublication">{reporter.profile.designation}</span>}
          </div>
          <nav className="articleReporterActions" aria-label="Reporter links">
            {reporter && <Link className="reporterProfileLink reporterProfilePrimary" href={`/reporters/${reporter.profile.id}`}>प्रोफ़ाइल और खबरें →</Link>}
            <Link className="reporterProfileLink" href="/reporters">सभी रिपोर्टर →</Link>
          </nav>
        </footer>
        <AdPlacement placement="articleFooter"/>
      </article>
      {rightAds && <aside className="articleAdRail articleAdRailRight" aria-label="Advertisements"><AdPlacement placement="articleRightTop"/>{extendedAds && <AdPlacement placement="articleRightBottom"/>}{wordCount>=1000 && <AdPlacement placement="articleRightExtra"/>}</aside>}
      </div>
      <footer className="articleFooter">
        © 2026 NEWS24x7 INDIA • निष्पक्ष और विश्वसनीय पत्रकारिता
      </footer>
    </main>
  );
}
