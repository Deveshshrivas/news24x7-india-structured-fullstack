export const siteName = "NEWS24x7 INDIA";
export const siteDescription =
  "देश, प्रदेश, राजनीति, कारोबार, खेल और मनोरंजन की ताज़ा और विश्वसनीय हिंदी खबरें।";

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.FRONTEND_URL ||
  "https://news24x7india.com";
export const siteUrl = configuredUrl.replace(/\/$/, "");
export const defaultSocialImage =
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&h=630&q=85";

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}

export function cleanDescription(value?: string, limit = 160) {
  const text = (value || siteDescription).replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function cleanTitle(value: string, limit = 65) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
