import Link from "next/link";
import BrandLogo from "./BrandLogo";
import WeatherWidget from "./WeatherWidget";
import AdPlacement from "./ads/AdPlacement";
import { HeaderSearch } from "./features/search";
import { BreakingTicker } from "./features/breaking";

const categories = [
  { name: "मध्य प्रदेश", query: "मध्य प्रदेश" },
  { name: "राजनीति", query: "राजनीती" },
  { name: "अपराध", query: "अपराध" },
  { name: "कारोबार", query: "कारोबार" },
  { name: "शिक्षा", query: "शिक्षा" },
  { name: "खेल", query: "खेल" },
  { name: "मनोरंजन", query: "मनोरंजन" },
  { name: "लाइफस्टाइल", query: "लाइफस्टाइल" },
];

export default function SiteHeader() {
  return (
    <>
      <div className="topline">
        <div className="shell topinner">
          <span>{new Date().toLocaleDateString("hi-IN",{timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
          <span>निष्पक्ष • निर्भीक • आपके साथ</span>
          <div className="toplinks">
            <Link href="/reporters">हमारे रिपोर्टर</Link>
            <Link href="/about">हमारे बारे में</Link>
            <Link href="/contact">संपर्क</Link>
            <Link href="/e-paper">ई-पेपर</Link>
          </div>
        </div>
      </div>
      <header>
        <div className="shell brandrow">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
            <Link className="brand" href="/">
              <BrandLogo />
            </Link>
            <WeatherWidget />
          </div>
          <div className="headerAdContainer" style={{ flex: 1, display: 'flex', justifyContent: 'center', overflow: 'hidden', padding: '0 20px', minHeight: '90px', maxHeight: '90px' }}>
            <AdPlacement placement="homeTop" />
          </div>
          <HeaderSearch />
        </div>
        <nav aria-label="मुख्य नेविगेशन">
          <div className="shell navinner">
            <Link className="homeicon" href="/" aria-current="page">
              होम
            </Link>
            {categories.map((item) => (
              <Link href={`/category/${item.query === "मध्य प्रदेश" ? "madhya-pradesh" : item.query === "राजनीती" ? "politics" : item.query === "अपराध" ? "crime" : item.query === "कारोबार" ? "business" : item.query === "शिक्षा" ? "education" : item.query === "खेल" ? "sports" : item.query === "मनोरंजन" ? "entertainment" : item.query === "लाइफस्टाइल" ? "lifestyle" : encodeURIComponent(item.query)}`} key={item.name}>
                {item.name}
              </Link>
            ))}
            <Link href="/latest">सभी खबरें</Link>
            <a className="live" href="https://www.youtube.com/c/news24x7india/videos" target="_blank" rel="noopener noreferrer" aria-label="LIVE TV — YouTube चैनल (नया टैब)">
              <i /> LIVE TV
            </a>
          </div>
        </nav>
      </header>
      <BreakingTicker />
    </>
  );
}
