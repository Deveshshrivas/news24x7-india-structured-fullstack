import type {MetadataRoute} from "next";
import {absoluteUrl, siteUrl} from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/auth/", "/api/", "/logout"]},
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
