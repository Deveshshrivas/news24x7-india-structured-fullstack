export const CHANNEL_ID='UCCfUJkO2He0O0F7MIL2aVfw';
export type ChannelVideo={id:string;title:string;publishedAt:string};

export function latestFromHtml(html:string):ChannelVideo|null{
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!match) return null;
  try {
    const stringData = match[1];
    const idMatch = stringData.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const titleMatch = stringData.match(/"title":\{"runs":\[\{"text":"([^"]+)"\}\]/);
    if (idMatch && idMatch[1]) {
      return {
        id: idMatch[1],
        title: titleMatch ? titleMatch[1] : "Video",
        publishedAt: new Date().toISOString()
      };
    }
  } catch(e) {
    console.error(e);
  }
  return null;
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
      const response=await fetch(`https://www.youtube.com/c/news24x7india/videos`,{
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal:AbortSignal.timeout(10000)
      });
      if(!response.ok)throw new Error('Feed unavailable');
      const html = await response.text();
      const video=latestFromHtml(html);
      if(!video)throw new Error('No usable video');
      cached=video;stale=false;expires=Date.now()+600000;
    }catch{stale=true;expires=Date.now()+60000}
    return {video:cached,stale};
  })();
  try{return await pending}finally{pending=null}
}
