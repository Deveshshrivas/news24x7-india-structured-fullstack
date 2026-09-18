const BACKEND=(process.env.BACKEND_URL||"http://localhost:8000").replace(/\/$/,"");
const MAX_BODY=82*1024*1024;
async function boundedBody(request:Request){
 const declared=Number(request.headers.get('content-length')||0);
 if(declared>MAX_BODY)throw new RangeError('Payload too large');
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();
 const chunks:Uint8Array[]=[];let total=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>MAX_BODY){await reader.cancel();throw new RangeError('Payload too large')}chunks.push(value)}}finally{reader.releaseLock()}
 const body=new Uint8Array(total);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}return body;
}
async function proxy(request:Request,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;if(path.some(part=>part==='.'||part==='..'||part.includes('/')||part.includes('\\')))return Response.json({detail:'Invalid API path'},{status:400});
 const source=new URL(request.url),target=BACKEND+'/'+path.map(encodeURIComponent).join('/')+source.search;
 const headers=new Headers(request.headers);
 for(const name of ['host','connection','keep-alive','transfer-encoding','upgrade','proxy-authorization','proxy-authenticate','te','trailer','x-forwarded-for','x-forwarded-host','x-forwarded-proto'])headers.delete(name);
 // Only enable when a trusted edge proxy overwrites X-Real-IP and direct access is blocked.
 if(process.env.TRUST_FRONTEND_IP_HEADER==='true'){const ip=request.headers.get('x-real-ip');if(ip&&/^[0-9a-fA-F:.]+$/.test(ip))headers.set('x-forwarded-for',ip)}
 const init:RequestInit={method:request.method,headers,redirect:'manual',signal:AbortSignal.timeout(120000)};
 try{
  if(!['GET','HEAD'].includes(request.method))init.body=await boundedBody(request) as BodyInit;
  const upstream=await fetch(target,init),outHeaders=new Headers(upstream.headers);outHeaders.delete('content-encoding');outHeaders.delete('content-length');
  return new Response(upstream.body,{status:upstream.status,headers:outHeaders});
 }catch(error){return Response.json({detail:error instanceof RangeError?'Media request is too large (maximum 82 MB total).':'The backend is temporarily unavailable. Please retry.'},{status:error instanceof RangeError?413:502,headers:{'Cache-Control':'no-store'}})}
}
export const GET=proxy;export const HEAD=proxy;export const POST=proxy;export const PATCH=proxy;export const PUT=proxy;export const DELETE=proxy;
