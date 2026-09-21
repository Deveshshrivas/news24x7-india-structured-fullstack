import SiteHeader from "../../SiteHeader";
import Link from "next/link";
import { demoNews } from "../../demo-news";
import { getPublishedArticles } from "../../seo-data";

export default async function Category({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  
  const categoryMap: Record<string, string> = {
    "madhya-pradesh": "मध्य प्रदेश",
    "politics": "राजनीति",
    "crime": "अपराध",
    "business": "कारोबार",
    "education": "शिक्षा",
    "sports": "खेल",
    "entertainment": "मनोरंजन",
    "lifestyle": "लाइफस्टाइल"
  };

  const { slug } = await params;
  let title: string;
  try {
    title = decodeURIComponent(slug);
    if (categoryMap[title.toLowerCase()]) title = categoryMap[title.toLowerCase()];
  } catch {
    title = slug;
    if (categoryMap[title.toLowerCase()]) title = categoryMap[title.toLowerCase()];
  }
  const remote = await getPublishedArticles({ category: title, limit: 30 });
  const articles = remote.length
    ? remote
    : demoNews.filter((article) => article.category === title);
  return (
    <main className="listing">
      <SiteHeader />
      <section>
        <span>NEWS24x7 INDIA</span>
        <h1>{title}</h1>
        {articles.length ? (
          articles.map((article, index) => (
            <Link
              href={`/news/${article.slug}`}
              className="listCard"
              key={article.id}
            >
              <b>{String(index + 1).padStart(2, "0")}</b>
              <div>
                <small>
                  {article.category}
                  {article.publishedAt
                    ? ` • ${new Date(article.publishedAt).toLocaleDateString("hi-IN")}`
                    : ""}
                </small>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
              </div>
            </Link>
          ))
        ) : (
          <p>इस श्रेणी में अभी कोई प्रकाशित समाचार नहीं है।</p>
        )}
      </section>
    </main>
  );
}
