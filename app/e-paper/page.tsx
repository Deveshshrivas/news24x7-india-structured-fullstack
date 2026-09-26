import BrandLogo from '../BrandLogo';
export const revalidate = 120;
import Link from 'next/link';
import {paperData,paperDate,type Edition} from './data';

export const metadata = {
  title: 'ई-पेपर — दैनिक समाचार संकलन',
  description: 'NEWS24x7 INDIA का दैनिक डिजिटल अखबार। प्रकाशित खबरों से स्वतः तैयार समाचार संकलन।',
  alternates: { canonical: '/e-paper' },
};

export default async function Epaper(){
  const data=await paperData<{items:Edition[]}>('');
  const editions = data?.items || [];
  const today = editions[0];

  return <main className="epaperListing">
    {/* Hero */}
    <header className="epaperHero">
      <Link className="brand" href="/"><BrandLogo/></Link>
      <div className="epaperHeroContent">
        <span className="epaperLabel">डिजिटल अखबार</span>
        <h1>NEWS24x7 ई-पेपर</h1>
        <p>प्रकाशित खबरों से स्वतः तैयार दैनिक समाचार संकलन। संस्करण खोलें और PDF के रूप में सहेजें।</p>
      </div>
      <Link className="epaperBackLink" href="/">← होम पर वापस</Link>
    </header>

    {/* Featured Today's Edition */}
    {today && <section className="epaperFeatured">
      <h2>आज का अंक</h2>
      <Link className="epaperFeaturedCard" href={`/e-paper/${today.date}`}>
        <div className="epaperFeaturedCover">
          <div className="epaperMasthead">
            <BrandLogo/>
            <time>{paperDate(today.date)}</time>
          </div>
          <div className="epaperFeaturedBody">
            <h3>{today.lead?.title}</h3>
            <p>{today.lead?.excerpt}</p>
          </div>
          {today.lead?.imageUrl && <img src={today.lead.imageUrl} alt="" loading="eager"/>}
          <span className="epaperBadge">{today.count} खबरें</span>
        </div>
        <span className="epaperReadBtn">आज का ई-पेपर पढ़ें →</span>
      </Link>
    </section>}

    {/* Archive Grid */}
    {editions.length > 1 && <section className="epaperArchive">
      <h2>पिछले संस्करण</h2>
      <div className="epaperGrid">
        {editions.slice(1).map(edition => <article key={edition.date} className="epaperCard">
          <Link href={`/e-paper/${edition.date}`}>
            <div className="epaperCardCover">
              <div className="epaperCardMast">
                <strong>NEWS<span>24x7</span></strong>
                <time>{paperDate(edition.date)}</time>
              </div>
              <h3>{edition.lead?.title}</h3>
              {edition.lead?.imageUrl && <img src={edition.lead.imageUrl} alt="" loading="lazy"/>}
              <span className="epaperBadge">{edition.count} खबरें</span>
            </div>
            <span className="epaperReadBtn">ई-पेपर पढ़ें →</span>
          </Link>
        </article>)}
      </div>
    </section>}

    {!editions.length && <p className="epaperEmpty">अभी कोई प्रकाशित संस्करण उपलब्ध नहीं है।</p>}
  </main>;
}
