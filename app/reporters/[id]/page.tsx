import Link from "next/link";
import {notFound} from "next/navigation";
import {getReporter} from "../data";

export async function generateMetadata({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const result=await getReporter(id);
  return {title:result ? result.profile.name : "Reporter not found",alternates:{canonical:`/reporters/${result?.profile.id || id}`}};
}
export default async function ReporterPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}) {
  const {id}=await params;
  const query=await searchParams;
  const page=Math.max(1,Math.floor(Number(query.page)||1));
  const result=await getReporter(id,page);
  if(!result) notFound();
  const {profile,items}=result;
  return <main className="publicReporters">
    <nav><Link href="/">होम</Link> / <Link href="/reporters">सभी रिपोर्टर</Link></nav>
    <header className="reporterProfileHeader">
      {profile.photoUrl ? <img className="reporterAvatar" src={profile.photoUrl} alt={profile.name} width={80} height={80}/> : <span className="reporterAvatar" aria-hidden="true">{profile.name?.slice(0,1)}</span>}
      <div><h1>{profile.name}</h1><p>{profile.designation} · NEWS24x7 INDIA</p></div>
    </header>
    <h2>प्रकाशित खबरें ({result.total})</h2>
    {!items.length && <p>अभी कोई प्रकाशित खबर उपलब्ध नहीं है।</p>}
    <div className="reporterDirectory">{items.map(item=><Link key={item.id} className="reporterCard" href={`/news/${encodeURIComponent(item.slug)}`}>
      {item.imageUrl && <img className="reporterNewsImage" src={item.imageUrl} alt="" loading="lazy"/>}<h3>{item.title}</h3>
    </Link>)}</div>
    {result.pages>1 && <nav className="reporterPagination" aria-label="News pages">
      {page>1 && <Link href={`/reporters/${id}?page=${page-1}`}>← पिछला</Link>}<span>{page} / {result.pages}</span>
      {page<result.pages && <Link href={`/reporters/${id}?page=${page+1}`}>अगला →</Link>}
    </nav>}
  </main>;
}
