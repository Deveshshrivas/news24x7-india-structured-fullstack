import Link from "next/link";
import BrandLogo from "../BrandLogo";
import ContactForm from "./ContactForm";
import { getSiteSettings } from "../lib/settings";

export default async function Contact() {
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
        <span>संपर्क</span>
        <h1>हमसे संपर्क करें</h1>
        <p>खबर, सुझाव, विज्ञापन या शिकायत—हमारी टीम तक अपना संदेश पहुँचाएँ।</p>
      </section>
      <section className="contactGrid">
        <div>
          <article>
            <span>कार्यालय</span>
            <h3 style={{whiteSpace: "pre-line"}}>{settings.address}</h3>
          </article>
          <article>
            <span>प्रोडक्शन कार्यालय</span>
            <h3>D-304, तृतीय तल, सेक्टर 10</h3>
            <p>नोएडा, दिल्ली NCR</p>
          </article>
          <article>
            <span>फोन और ईमेल</span>
            <h3>{settings.contactPhone || "98062 39561 • 94259 09162"}</h3>
            <p>{settings.contactEmail}</p>
          </article>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
