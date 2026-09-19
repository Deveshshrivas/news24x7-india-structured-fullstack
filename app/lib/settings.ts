export const DEFAULT_SETTINGS = {
  siteName: "NEWS24x7 INDIA",
  tagline: "सच दिखाने की हिम्मत",
  description: "निष्पक्ष, निर्भीक और विश्वसनीय पत्रकारिता। भारत और दुनिया की हर महत्वपूर्ण खबर, हर पल आपके साथ।",
  contactEmail: "news@news24x7india.com",
  contactPhone: "",
  address: "हनुमान कॉलोनी, गोले का मंदिर\nग्वालियर, मध्य प्रदेश",
  socialFacebook: "https://facebook.com",
  socialYoutube: "https://youtube.com/c/news24x7india",
  socialInstagram: "https://instagram.com",
  socialX: "https://x.com",
  logoUrl: ""
};

export async function getSiteSettings() {
  try {
    const backend = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
    const res = await fetch(`${backend}/settings`, { next: { revalidate: 60 } }); // Cache for 60 seconds
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch settings, using defaults", error);
  }
  return DEFAULT_SETTINGS;
}
