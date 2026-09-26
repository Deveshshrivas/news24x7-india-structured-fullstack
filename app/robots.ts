import type {MetadataRoute} from "next";
import {absoluteUrl, siteUrl} from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {userAgent: "*", allow: ["/", "/api/backend/articles/*/image"], disallow: ["/admin", "/login", "/auth/", "/api/", "/logout"]},
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
