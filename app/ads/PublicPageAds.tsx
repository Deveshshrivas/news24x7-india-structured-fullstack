'use client';
import {usePathname} from 'next/navigation';
import type {ReactNode} from 'react';

// Homepage/articles have their own content-aware placements. Account routes
// never mount an ad unit, including after client-side navigation.
export default function PublicPageAds({children}:{children:ReactNode}){
 const pathname=usePathname();
 const publicRoutes=['/latest','/category','/search','/reporters','/e-paper','/live','/about','/contact','/advertise','/privacy','/grievance'];
 if(!pathname||!publicRoutes.some(route=>pathname===route||pathname.startsWith(route+'/')))return null;
 return <div className="publicPageAd" key={pathname}>{children}</div>;
}
