import type {SeoArticleSummary} from '../seo-data';
export type Edition={date:string;count:number;lead:SeoArticleSummary|null};
export type Paper={date:string;items:SeoArticleSummary[]};
export const paperDate=(day:string)=>new Intl.DateTimeFormat('hi-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${day}T00:00:00+05:30`));
export async function paperData<T>(path:string):Promise<T|null>{
  const backend=(process.env.BACKEND_URL||'http://localhost:8000').replace(/\/$/,'');
  const response=await fetch(`${backend}/epaper${path}`,{cache:'no-store'});
  if(response.status===404||response.status===400)return null;
  if(!response.ok)throw new Error('E-paper is temporarily unavailable');
  return response.json();
}
