import AdUnit from './AdUnit';
import type { ReactNode } from 'react';
const units={homeTop:'ADSENSE_HOME_TOP_SLOT',homeBottom:'ADSENSE_HOME_BOTTOM_SLOT',sidebar:'ADSENSE_SIDEBAR_SLOT',articleInline:'ADSENSE_ARTICLE_INLINE_SLOT',articleBottom:'ADSENSE_ARTICLE_BOTTOM_SLOT',publicBottom:'ADSENSE_PUBLIC_BOTTOM_SLOT',articleLeftTop:'ADSENSE_ARTICLE_LEFT_TOP_SLOT',articleLeftBottom:'ADSENSE_ARTICLE_LEFT_BOTTOM_SLOT',articleRightTop:'ADSENSE_ARTICLE_RIGHT_TOP_SLOT',articleRightBottom:'ADSENSE_ARTICLE_RIGHT_BOTTOM_SLOT',articleFooter:'ADSENSE_ARTICLE_FOOTER_SLOT',articleLeftExtra:'ADSENSE_ARTICLE_LEFT_EXTRA_SLOT',articleRightExtra:'ADSENSE_ARTICLE_RIGHT_EXTRA_SLOT'} as const;
export function adConfigured(placement:keyof typeof units){return true;}

export default async function AdPlacement({placement, fallback}: {placement:keyof typeof units, fallback?: ReactNode}){
 try {
  const backend = (process.env.BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
  const res = await fetch(`${backend}/ads`, { cache: 'no-store' });
  if (res.ok) {
   const data = await res.json();
   const mappedPlacement = placement === 'homeTop' ? 'homeTop' : placement === 'homeBottom' ? 'homeBottom' : placement.includes('Inline') ? 'midArticle' : 'sidebar';
   const match = (data.items || []).find((x: any) => x.placement === mappedPlacement);
   if (match && match.imageUrl) {
    const isHeader = placement === 'homeTop';
    const aStyle: React.CSSProperties = isHeader 
      ? {display:'flex',width:'100%',height:'100%',justifyContent:'center',alignItems:'center'} 
      : {display:'block',width:'100%',textAlign:'center',padding:'10px 0'};
    const imgStyle: React.CSSProperties = isHeader
      ? {width:'100%',height:'100%',objectFit:'fill'}
      : {maxWidth:'100%',maxHeight:'250px',objectFit:'contain',margin:'0 auto'};
    return <a href={match.link||"#"} target="_blank" rel="noopener noreferrer" style={aStyle}><img src={match.imageUrl} alt={match.name} style={imgStyle}/></a>;
   }
  }
 } catch (e) {}

 const client = 'ca-pub-1979035915333459'; const slot = '5942153390';
 // Removed env check to force adsense
 return <AdUnit client={client} slot={slot} placement={placement}/>;
}
