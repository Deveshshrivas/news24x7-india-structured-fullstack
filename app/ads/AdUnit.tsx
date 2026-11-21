'use client';
import GoogleAd from './GoogleAd';

export default function AdUnit({client,slot,placement}:{client:string;slot:string;placement:string}){
 const horizontal = placement === 'header' || placement === 'topBanner';
 return (
  <aside className={`siteAd siteAd-${placement}`} aria-label="Advertisement">
   <span>Advertisement</span>
   <GoogleAd
    client={client}
    slot={slot}
    format={horizontal ? 'horizontal' : 'auto'}
    fullWidth={!horizontal}
    style={horizontal ? {height:90} : undefined}
   />
  </aside>
 );
}
