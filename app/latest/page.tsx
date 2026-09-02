import type { Metadata } from "next";
import Link from "next/link";
import AllNews from "./AllNews";
import {
  absoluteUrl,
  cleanDescription,
  defaultSocialImage,
  safeJsonLd,
} from "../seo";
import { getPublishedArticles } from "../seo-data";

export async function generateMetadata(): Promise<Metadata> {
  const articles = await getPublishedArticles({ limit: 5 });
  const lead = articles[0];
  const title = "सभी समाचार";
  const description = cleanDescription(
    lead?.seoDescription ||
      lead?.excerpt ||
      "NEWS24x7 INDIA की सभी ताज़ा हिंदी खबरें—शीर्षक, न्यूज़ स्लग, विषय और श्रेणी के अनुसार खोजें।",
  );
  const image = lead?.seoImageUrl || lead?.imageUrl || defaultSocialImage;
  return {
    title,
    description,
    alternates: { canonical: "/latest" },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl("/latest"),
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

export default async function Latest() {
  const articles = await getPublishedArticles({ limit: 20 });
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "सभी समाचार",
    url: absoluteUrl("/latest"),
    inLanguage: "hi-IN",
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
    <main className="listing allNewsPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      <header className="articleTop">
        <Link className="brand" href="/">
          <span className="brand24">
            NEWS<span>24x7</span>
          </span>
          <b>INDIA</b>
          <small>सच दिखाने की हिम्मत</small>
        </Link>
        <Link href="/">← होम</Link>
      </header>
      <AllNews />
    </main>
  );
}
