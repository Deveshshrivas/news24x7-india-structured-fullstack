export function GET(){
 const client=process.env.ADSENSE_CLIENT_ID||'';
 if(!/^ca-pub-\d{16}$/.test(client))return new Response('# AdSense publisher not configured\n',{headers:{'Content-Type':'text/plain'}});
 return new Response(`google.com, ${client.slice(3)}, DIRECT, f08c47fec0942fa0\n`,{headers:{'Content-Type':'text/plain','Cache-Control':'public, max-age=3600'}});
}
