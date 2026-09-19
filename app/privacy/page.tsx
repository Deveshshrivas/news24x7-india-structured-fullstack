import BrandLogo from "../BrandLogo";
import Link from "next/link";
import { getSiteSettings } from "../lib/settings";

export default async function Privacy() {
  const settings = await getSiteSettings();
  return (
    <main className="infoPage">
      <header className="articleTop">
        <Link className="brand" href="/">
          <BrandLogo />
        </Link>
        <Link href="/">← होम पर वापस</Link>
      </header>
      <section className="infoHero">
        <span>NEWS24x7 INDIA</span>
        <h1>गोपनीयता नीति</h1>
        <p>अंतिम अपडेट: 24 सितम्बर 2026</p>
      </section>
      <section className="infoContent legal" style={{whiteSpace: "pre-line"}}>
        {settings.privacyPolicy}
      </section>
    </main>
  );
}
