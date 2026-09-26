import "../reporters.css";
import Link from "next/link";
export const revalidate = 120;
import BrandLogo from "../BrandLogo";
import type {PublicReporter} from "./data";
import ReporterList from "./ReporterList";

export const metadata = {title:"हमारे रिपोर्टर",description:"NEWS24x7 INDIA की रिपोर्टिंग टीम और उनकी प्रकाशित खबरें।",alternates:{canonical:"/reporters"}};
export default async function ReportersPage() {
  let items: PublicReporter[] = [];
  let unavailable = false;
  try {
    const response = await fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/reporters/public`, {next:{revalidate:120}});
    if(!response.ok) throw new Error("Unavailable");
    items = (await response.json()).items;
  } catch { unavailable = true; }
  return <main className="publicReporters">
    <header className="articleTop"><Link href="/" className="brand"><BrandLogo/></Link><Link href="/">← होम</Link></header>
    <h1>हमारे रिपोर्टर</h1><p>हमारी टीम से मिलें और उनकी प्रकाशित खबरें पढ़ें।</p>
    {unavailable ? <p role="status">रिपोर्टर सूची अभी उपलब्ध नहीं है। कृपया दोबारा प्रयास करें।</p> : !items.length ? <p>अभी कोई रिपोर्टर उपलब्ध नहीं है।</p> : <ReporterList items={items} />}
  </main>;
}
