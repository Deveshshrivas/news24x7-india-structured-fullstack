export type SeoArticleSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoImageUrl?: string;
};

const fetchPublishedArticles = cache(
  async (limit: number, category?: string): Promise<SeoArticleSummary[]> => {
    const backend = (
      process.env.BACKEND_URL || "http://localhost:8000"
    ).replace(/\/$/, "");
    const query = new URLSearchParams({
      page: "1",
      limit: String(Math.min(50, Math.max(1, limit))),
    });
    if (category) query.set("category", category);
    try {
      const response = await fetch(`${backend}/articles?${query}`, {
        cache: "no-store",
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.items ?? [];
    } catch {
      return [];
    }
  },
);

export function getPublishedArticles({
  limit = 10,
  category,
}: { limit?: number; category?: string } = {}) {
  return fetchPublishedArticles(limit, category);
}
import { cache } from "react";
