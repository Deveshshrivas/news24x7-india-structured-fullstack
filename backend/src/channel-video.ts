export const CHANNEL_ID='UCCfUJkO2He0O0F7MIL2aVfw';
export type ChannelVideo={id:string;title:string;publishedAt:string};

export function extractFromRss(xml: string): ChannelVideo | null {
  const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryMatch || !entryMatch[1]) return null;
  
  const entryXml = entryMatch[1] as string;
  const idMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
  const titleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
  const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);

  if (idMatch && idMatch[1]) {
    // Decode HTML entities in the title if any
    let title = (titleMatch && titleMatch[1]) ? titleMatch[1] : "Video";
    title = title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    return {
      id: idMatch[1],
      title: title,
      publishedAt: (publishedMatch && publishedMatch[1]) ? publishedMatch[1] : new Date().toISOString()
    };
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
      const response=await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,{
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal:AbortSignal.timeout(10000)
      });
      if(!response.ok)throw new Error('Feed unavailable');
      const xml = await response.text();
      
      const video = extractFromRss(xml);
      if (!video) throw new Error('No usable video');
      
      cached = video;
      stale = false;
      expires = Date.now()+600000;
    }catch{
      stale=true;
      expires=Date.now()+60000;
    }
    return {video:cached,stale};
  })();
  try{return await pending}finally{pending=null}
}
