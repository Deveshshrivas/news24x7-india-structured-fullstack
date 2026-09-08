import Link from "next/link";
import BrandLogo from "../BrandLogo";
import type {PublicReporter} from "./data";

export const metadata = {title:"हमारे रिपोर्टर",description:"NEWS24x7 INDIA की रिपोर्टिंग टीम और उनकी प्रकाशित खबरें।",alternates:{canonical:"/reporters"}};
export default async function ReportersPage() {
  let items: PublicReporter[] = [];
  let unavailable = false;
  try {
    const response = await fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/reporters/public`, {cache:"no-store"});
    if(!response.ok) throw new Error("Unavailable");
    items = (await response.json()).items;
  } catch { unavailable = true; }
  return <main className="publicReporters">
    <header className="articleTop"><Link href="/" className="brand"><BrandLogo/></Link><Link href="/">← होम</Link></header>
    <h1>हमारे रिपोर्टर</h1><p>हमारी टीम से मिलें और उनकी प्रकाशित खबरें पढ़ें।</p>
    {unavailable ? <p role="status">रिपोर्टर सूची अभी उपलब्ध नहीं है। कृपया दोबारा प्रयास करें।</p> : !items.length ? <p>अभी कोई रिपोर्टर उपलब्ध नहीं है।</p> : <div className="reporterDirectory">
      {items.map(reporter=><Link className="reporterCard" key={reporter.id} href={`/reporters/${reporter.id}`}>
        {reporter.photoUrl ? <img className="reporterAvatar" src={reporter.photoUrl} alt={reporter.name} width={80} height={80} loading="lazy"/> : <span className="reporterAvatar" aria-hidden="true">{reporter.name?.slice(0,1)}</span>}
        <h2>{reporter.name}</h2><p>{reporter.designation}</p><span className="reporterProfileLink">प्रोफ़ाइल और खबरें →</span>
      </Link>)}
    </div>}
  </main>;
}
