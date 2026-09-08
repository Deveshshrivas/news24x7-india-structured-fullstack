import {newsSlug} from "../backend/src/news-slug";

export const slugifyTitle = newsSlug;

function legacyUnicodeSlug(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("hi-IN")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/g, "");
}

// Sample articles keep their old aliases working, but publish title-based URLs.
export function findTitleArticle<T extends {title: string}>(articles: Record<string, T>, slug: string): (T & {slug: string}) | null {
  const article = Object.hasOwn(articles, slug) ? articles[slug] : Object.values(articles).find(item => slugifyTitle(item.title) === slug || legacyUnicodeSlug(item.title) === slug);
  return article ? {...article, slug: slugifyTitle(article.title)} : null;
}
