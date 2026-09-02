import type {MetadataRoute} from "next";
import {demoNews} from "./demo-news";
import {absoluteUrl} from "./seo";

type SitemapArticle = {slug: string; category: string; publishedAt?: string; updatedAt?: string};
type ArticlePage = {items?: SitemapArticle[]; pages?: number};
const featuredSlugs=["bharat-ki-nayi-udaan","madhya-pradesh-vikas","khel-mahotsav","shiksha-digital","business-growth"];

async function publishedArticles(): Promise<SitemapArticle[]> {
  const backend = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
  try {
    const firstResponse = await fetch(`${backend}/articles?page=1&limit=50`, {cache: "no-store"});
    if (!firstResponse.ok) throw new Error("Article API unavailable");
    const first = await firstResponse.json() as ArticlePage;
    const pages = Math.min(first.pages || 1, 1000);
    const remaining = await Promise.all(Array.from({length: Math.max(0, pages - 1)}, async (_, index) => {
      const response = await fetch(`${backend}/articles?page=${index + 2}&limit=50`, {cache: "no-store"});
      if (!response.ok) return [];
      return ((await response.json()) as ArticlePage).items || [];
    }));
    const articles = [...(first.items || []), ...remaining.flat()];
    if (articles.length) return articles;
  } catch {}
  return demoNews;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await publishedArticles();
  const newest = articles[0]?.updatedAt || articles[0]?.publishedAt || new Date().toISOString();
  const staticPages: MetadataRoute.Sitemap = [
    {url: absoluteUrl("/"), lastModified: newest, changeFrequency: "hourly", priority: 1},
    {url: absoluteUrl("/latest"), lastModified: newest, changeFrequency: "hourly", priority: 0.9},
    {url: absoluteUrl("/live"), changeFrequency: "daily", priority: 0.7},
    {url: absoluteUrl("/e-paper"), changeFrequency: "daily", priority: 0.7},
    {url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.4},
    {url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.4},
    {url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.2},
  ];
  const categoryPages: MetadataRoute.Sitemap = [...new Set(articles.map(article => article.category).filter(Boolean))].map(category => ({
    url: absoluteUrl(`/category/${encodeURIComponent(category)}`),
    lastModified: newest,
    changeFrequency: "hourly",
    priority: 0.8,
  }));
  const articlePages: MetadataRoute.Sitemap = articles.map(article => ({
    url: absoluteUrl(`/news/${encodeURIComponent(article.slug)}`),
    lastModified: article.updatedAt || article.publishedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const knownSlugs=new Set(articles.map(article=>article.slug));
  const featuredPages:MetadataRoute.Sitemap=featuredSlugs.filter(slug=>!knownSlugs.has(slug)).map(slug=>({url:absoluteUrl(`/news/${slug}`),changeFrequency:"weekly",priority:0.7}));
  return [...staticPages, ...categoryPages, ...articlePages, ...featuredPages];
}
