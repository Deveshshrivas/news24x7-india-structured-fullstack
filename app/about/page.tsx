import Header from "../Header";
import { getSiteSettings } from "../lib/settings";

export default async function About() {
  const settings = await getSiteSettings();
  return (
    <main className="infoPage">
      <Header />
      <section className="infoHero">
        <span>NEWS24x7 INDIA</span>
        <h1>हमारे बारे में</h1>
        <p>{settings.tagline || "सच दिखाने की हिम्मत"}</p>
      </section>
      <section className="infoContent" style={{whiteSpace: "pre-line"}}>
        {settings.aboutUs}
        <br/><br/>
        <div className="valueGrid">
          <article>
            <b>01</b>
            <h3>सत्य</h3>
            <p>हर खबर की पुष्टि और तथ्य-जाँच हमारी पहली जिम्मेदारी है।</p>
          </article>
          <article>
            <b>02</b>
            <h3>निष्पक्षता</h3>
            <p>हम सभी पक्षों को जगह देते हैं और पाठकों को निर्णय लेने देते हैं।</p>
          </article>
          <article>
            <b>03</b>
            <h3>जनहित</h3>
            <p>हम उन मुद्दों को प्राथमिकता देते हैं जिनका लोगों के जीवन पर असर पड़ता है।</p>
          </article>
        </div>
        <h2>मुख्य संपादक</h2>
        <div className="editorCard">
          <div>DS</div>
          <section>
            <h3>धर्मेंद्र सिंह</h3>
            <p>
              NEWS24x7 INDIA के मुख्य संपादक। स्थानीय पत्रकारिता और जनसरोकारों से जुड़े
              विषयों पर लंबे समय से सक्रिय।
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
