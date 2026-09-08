import {notFound,redirect} from 'next/navigation';
import Reader from './Reader';
import {paperData,type Edition,type Paper} from '../data';
export default async function Page({params}:{params:Promise<{edition:string}>}){
  const {edition}=await params;
  if(/^[1-4]$/.test(edition)){
    const data=await paperData<{items:Edition[]}>('');
    if(data?.items[0])redirect(`/e-paper/${data.items[0].date}`);
    notFound();
  }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(edition))notFound();
  const paper=await paperData<Paper>(`/${edition}`);
  if(!paper)notFound();
  return <Reader paper={paper}/>;
}
