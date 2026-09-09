export const CHANNEL_ID='UCCfUJkO2He0O0F7MIL2aVfw';
export type ChannelVideo={id:string;title:string;publishedAt:string};
function decodeXml(value:string){return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(match,entity:string)=>{
  const named:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"};
  if(named[entity])return named[entity];
  const code=entity.startsWith('#x')?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);
  return Number.isFinite(code)&&code>=0&&code<=0x10ffff?String.fromCodePoint(code):match;
})}
export function latestFromFeed(xml:string):ChannelVideo|null{
  const entries=[...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([,entry])=>{
    const id=entry?.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const channel=entry?.match(/<yt:channelId>([^<]+)<\/yt:channelId>/)?.[1];
    const title=entry?.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const publishedAt=entry?.match(/<published>([^<]+)<\/published>/)?.[1];
    if(channel!==CHANNEL_ID||!id||!/^[\w-]{11}$/.test(id)||!title||!publishedAt||!Number.isFinite(Date.parse(publishedAt)))return [];
    return [{id,title:decodeXml(title),publishedAt}];
  });
  return entries.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))[0]??null;
}
let cached:ChannelVideo|null=null;
let expires=0;
let pending:Promise<{video:ChannelVideo|null;stale:boolean}>|null=null;
let stale=false;
export async function latestChannelVideo():Promise<{video:ChannelVideo|null;stale:boolean}>{
  if(Date.now()<expires)return {video:cached,stale};
  if(pending)return pending;
  pending=(async()=>{
    try{
      const response=await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,{signal:AbortSignal.timeout(7000)});
      if(!response.ok)throw new Error('Feed unavailable');
      const video=latestFromFeed(await response.text());
      if(!video)throw new Error('No usable video');
      cached=video;stale=false;expires=Date.now()+600000;
    }catch{stale=true;expires=Date.now()+60000}
    return {video:cached,stale};
  })();
  try{return await pending}finally{pending=null}
}
