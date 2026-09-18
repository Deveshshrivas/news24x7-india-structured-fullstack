import type { Metadata } from "next";
import { cache } from "react";
import {
  absoluteUrl,
  cleanDescription,
  cleanTitle,
  defaultSocialImage,
  safeJsonLd,
  siteName,
  siteUrl,
} from "../../seo";

type SeoArticle = {
  title: string;
  slug?: string;
  category: string;
  excerpt: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoImageUrl?: string;
};

const getSeoArticle = cache(
  async (slug: string): Promise<SeoArticle | null> => {
    try {
      const backend = (
        process.env.BACKEND_URL || "http://localhost:8000"
      ).replace(/\/$/, "");
      const response = await fetch(
        `${backend}/articles/${encodeURIComponent(slug)}?track_view=false`,
        { cache: "no-store" },
      );
      if (response.ok) return await response.json();
    } catch {}
    return null;
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getSeoArticle(slug);
  const canonicalPath = `/news/${encodeURIComponent(article?.slug || slug)}`;
  if (!article)
    return {
      title: "समाचार",
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: true },
    };
  const seoTitle = cleanTitle(article.seoTitle?.trim() || article.title);
  const description = cleanDescription(
    article.seoDescription || article.excerpt,
  );
  const image = article.seoImageUrl || article.imageUrl || defaultSocialImage;
  const keywords = [
    ...(article.seoKeywords || "")
      .split(/[,\n]/)
      .map((value) => value.trim())
      .filter(Boolean),
    article.category,
    "हिंदी समाचार",
    "ताज़ा खबर",
  ];
  return {
    title: seoTitle,
    description,
    keywords: [...new Set(keywords)],
    authors: [{ name: article.author || `${siteName} न्यूज़ डेस्क` }],
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      locale: "hi_IN",
      siteName,
      url: absoluteUrl(canonicalPath),
      title: seoTitle,
      description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt || article.publishedAt,
      section: article.category,
      authors: [article.author || `${siteName} न्यूज़ डेस्क`],
      tags: keywords,
      images: [{ url: image, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function NewsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getSeoArticle(slug);
  if (!article) return children;
  const pageUrl = absoluteUrl(`/news/${encodeURIComponent(article.slug || slug)}`);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${pageUrl}#article`,
        headline: article.title,
        alternativeHeadline: article.seoTitle || undefined,
        description: cleanDescription(
          article.seoDescription || article.excerpt,
        ),
        keywords: article.seoKeywords || article.category,
        image: [article.seoImageUrl || article.imageUrl || defaultSocialImage],
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        inLanguage: "hi-IN",
        articleSection: article.category,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        author: {
          "@type": "Person",
          name: article.author || `${siteName} न्यूज़ डेस्क`,
        },
        publisher: {
          "@type": "NewsMediaOrganization",
          "@id": `${siteUrl}/#organization`,
          name: siteName,
          logo: { "@type": "ImageObject", url: absoluteUrl("/news24x7-icon.svg") },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "होम",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: article.category,
            item: absoluteUrl(
              `/category/${encodeURIComponent(article.category)}`,
            ),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: pageUrl,
          },
        ],
      },
    ],
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
