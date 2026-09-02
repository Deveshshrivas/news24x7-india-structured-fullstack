import type { Metadata } from "next";
import {
  absoluteUrl,
  cleanDescription,
  defaultSocialImage,
  safeJsonLd,
  siteName,
} from "../../seo";
import { getPublishedArticles } from "../../seo-data";

function categoryName(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryName(slug);
  const articles = await getPublishedArticles({ category, limit: 5 });
  const lead = articles[0];
  const title = `${category} समाचार`;
  const description = cleanDescription(
    lead?.seoDescription ||
      lead?.excerpt ||
      `${category} की ताज़ा खबरें, ब्रेकिंग न्यूज़, प्रमुख अपडेट और विश्लेषण NEWS24x7 INDIA पर पढ़ें।`,
  );
  const image = lead?.seoImageUrl || lead?.imageUrl || defaultSocialImage;
  const path = `/category/${encodeURIComponent(category)}`;
  const articleKeywords = articles
    .flatMap((article) => (article.seoKeywords || "").split(/[,\n]/))
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    title,
    description,
    keywords: [
      ...new Set([
        category,
        `${category} समाचार`,
        "ताज़ा खबर",
        ...articleKeywords,
      ]),
    ],
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: image, alt: lead?.title || title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryName(slug);
  const articles = await getPublishedArticles({ category, limit: 10 });
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category} समाचार`,
    url: absoluteUrl(`/category/${encodeURIComponent(category)}`),
    inLanguage: "hi-IN",
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    publisher: { "@type": "NewsMediaOrganization", name: siteName },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/news/${encodeURIComponent(article.slug)}`),
        name: article.title,
      })),
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      {children}
    </>
  );
}
