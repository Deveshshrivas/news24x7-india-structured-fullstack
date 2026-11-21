import AdUnit from './AdUnit';
import type { ReactNode } from 'react';
const units={homeTop:'ADSENSE_HOME_TOP_SLOT',homeBottom:'ADSENSE_HOME_BOTTOM_SLOT',sidebar:'ADSENSE_SIDEBAR_SLOT',articleInline:'ADSENSE_ARTICLE_INLINE_SLOT',articleBottom:'ADSENSE_ARTICLE_BOTTOM_SLOT',publicBottom:'ADSENSE_PUBLIC_BOTTOM_SLOT',articleLeftTop:'ADSENSE_ARTICLE_LEFT_TOP_SLOT',articleLeftBottom:'ADSENSE_ARTICLE_LEFT_BOTTOM_SLOT',articleRightTop:'ADSENSE_ARTICLE_RIGHT_TOP_SLOT',articleRightBottom:'ADSENSE_ARTICLE_RIGHT_BOTTOM_SLOT',articleFooter:'ADSENSE_ARTICLE_FOOTER_SLOT',articleLeftExtra:'ADSENSE_ARTICLE_LEFT_EXTRA_SLOT',articleRightExtra:'ADSENSE_ARTICLE_RIGHT_EXTRA_SLOT'} as const;
export function adConfigured(_placement:keyof typeof units){return true;}

type Banner = {name?: string; placement: string; imageUrl?: string; link?: string};

export default async function AdPlacement({placement, header = false}: {placement:keyof typeof units, fallback?: ReactNode, header?: boolean}){
 let campaign: Banner | undefined;
 try {
  const backend = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backend}/ads`, {cache: 'no-store'});
  if (res.ok) {
   const data: {items?: Banner[]} = await res.json();
   const mappedPlacement = placement === 'homeTop' ? 'homeTop' : placement === 'homeBottom' ? 'homeBottom' : placement.includes('Inline') ? 'midArticle' : placement === 'sidebar' || placement.includes('Right') || placement.includes('Left') ? 'sidebar' : null;
   // The public endpoint returns active campaigns, newest first. Skip entries
   // without an image so an incomplete campaign cannot mask a usable banner.
   campaign = data.items?.find(item => item.placement === mappedPlacement && item.imageUrl?.trim());
  }
 } catch {
  // Keep the Google fallback available if the campaign service is unavailable.
 }

 if (campaign?.imageUrl) {
  return <a className={header ? 'headerCampaign' : undefined} href={campaign.link || '#'} target="_blank" rel="noopener noreferrer" style={header ? undefined : {display:'block',width:'100%',textAlign:'center',padding:'10px 0'}}>
   {/* Uploaded banners must preserve their original proportions. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={campaign.imageUrl} alt={campaign.name || 'Advertisement'} style={header ? undefined : {maxWidth:'100%',maxHeight:'250px',objectFit:'contain',margin:'0 auto'}}/>
  </a>;
 }

 const client = 'ca-pub-1979035915333459';
 let slot = '5942153390';
 if (placement.includes('Inline') || placement.includes('home')) slot = '8651402161';
 else if (placement.includes('Right') || placement === 'sidebar') slot = '2924343470';
 return <AdUnit client={client} slot={slot} placement={header ? 'header' : placement}/>;
}
