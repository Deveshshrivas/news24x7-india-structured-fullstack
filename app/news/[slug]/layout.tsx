import type { Metadata } from "next";
import { cache } from "react";
import { demoNews } from "../../demo-news";
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

const staticSeo: Record<string, SeoArticle> = {
  "bharat-ki-nayi-udaan": {
    title: "नई ऊर्जा, नया भारत: शहरों से गांवों तक बदलती विकास की तस्वीर",
    category: "देश-दुनिया",
    excerpt:
      "देशभर में बुनियादी सुविधाओं और डिजिटल सेवाओं के विस्तार से लोगों के जीवन में तेजी से बदलाव आ रहा है।",
  },
  "madhya-pradesh-vikas": {
    title:
      "प्रदेश के छोटे शहरों में नए अवसर, युवाओं के लिए खुल रहे रोजगार के द्वार",
    category: "मध्य प्रदेश",
    excerpt:
      "स्थानीय उद्योग, शिक्षा और तकनीक से रोजगार के नए अवसर तैयार हो रहे हैं।",
  },
  "khel-mahotsav": {
    title: "युवा खिलाड़ियों ने राष्ट्रीय प्रतियोगिता में रचा इतिहास",
    category: "खेल",
    excerpt: "शानदार प्रदर्शन के साथ टीम ने फाइनल में जगह बनाई।",
  },
  "shiksha-digital": {
    title: "डिजिटल कक्षाओं से गांव के विद्यार्थियों को मिल रही नई दिशा",
    category: "शिक्षा",
    excerpt:
      "तकनीक आधारित पढ़ाई से दूरस्थ क्षेत्रों तक बेहतर शिक्षा पहुंच रही है।",
  },
  "business-growth": {
    title: "स्थानीय कारोबार को ऑनलाइन बाजार से मिली नई रफ्तार",
    category: "कारोबार",
    excerpt: "छोटे व्यापारियों ने डिजिटल माध्यम से देशभर में ग्राहक बनाए।",
  },
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
    return (
      demoNews.find((article) => article.slug === slug) ??
      staticSeo[slug] ??
      null
    );
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getSeoArticle(slug);
  const canonicalPath = `/news/${encodeURIComponent(slug)}`;
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
  const pageUrl = absoluteUrl(`/news/${encodeURIComponent(slug)}`);
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
          logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.svg") },
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
