import BrandLogo from '../BrandLogo';
import Link from 'next/link';
import {paperData,paperDate,type Edition} from './data';
export default async function Epaper(){
  const data=await paperData<{items:Edition[]}>('');
  return <main className="infoPage"><header className="articleTop"><Link className="brand" href="/"><BrandLogo/></Link><Link href="/">← होम पर वापस</Link></header>
    <section className="infoHero"><span>डिजिटल अखबार</span><h1>NEWS24x7 ई-पेपर</h1><p>प्रकाशित खबरों से स्वतः तैयार दैनिक समाचार संकलन। संस्करण खोलें और PDF के रूप में सहेजें।</p></section>
    <section className="epaperGrid liveEpaper">{data?.items.length?data.items.map(edition=><article key={edition.date}>
      <Link className="paperCover" href={`/e-paper/${edition.date}`}><BrandLogo/><small>{paperDate(edition.date)}</small><h2>{edition.lead?.title}</h2><p>{edition.lead?.excerpt}</p></Link>
      <h3>{paperDate(edition.date)}</h3><p>{edition.count} खबरें • दैनिक संकलन</p><Link className="paperButton" href={`/e-paper/${edition.date}`}>ई-पेपर पढ़ें →</Link>
    </article>):<p>अभी कोई प्रकाशित संस्करण उपलब्ध नहीं है।</p>}</section></main>;
}
