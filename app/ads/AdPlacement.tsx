import AdUnit from './AdUnit';
const units={homeTop:'ADSENSE_HOME_TOP_SLOT',homeBottom:'ADSENSE_HOME_BOTTOM_SLOT',articleInline:'ADSENSE_ARTICLE_INLINE_SLOT',articleBottom:'ADSENSE_ARTICLE_BOTTOM_SLOT',publicBottom:'ADSENSE_PUBLIC_BOTTOM_SLOT',articleLeftTop:'ADSENSE_ARTICLE_LEFT_TOP_SLOT',articleLeftBottom:'ADSENSE_ARTICLE_LEFT_BOTTOM_SLOT',articleRightTop:'ADSENSE_ARTICLE_RIGHT_TOP_SLOT',articleRightBottom:'ADSENSE_ARTICLE_RIGHT_BOTTOM_SLOT',articleFooter:'ADSENSE_ARTICLE_FOOTER_SLOT',articleLeftExtra:'ADSENSE_ARTICLE_LEFT_EXTRA_SLOT',articleRightExtra:'ADSENSE_ARTICLE_RIGHT_EXTRA_SLOT'} as const;
export function adConfigured(placement:keyof typeof units){return process.env.ADSENSE_ENABLED==='true'&&/^ca-pub-\d{16}$/.test(process.env.ADSENSE_CLIENT_ID||'')&&/^\d{10}$/.test(process.env[units[placement]]||'')}
export default function AdPlacement({placement}:{placement:keyof typeof units}){
 const client=process.env.ADSENSE_CLIENT_ID||'',slot=process.env[units[placement]]||'';
 if(process.env.ADSENSE_ENABLED!=='true'||!/^ca-pub-\d{16}$/.test(client)||!/^\d{10}$/.test(slot))return null;
 return <AdUnit client={client} slot={slot} placement={placement}/>;
}
