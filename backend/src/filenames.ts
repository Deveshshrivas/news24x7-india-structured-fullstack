// Multipart parsers may interpret UTF-8 filename bytes as Latin-1.
// Only repair a lossless, valid UTF-8 round trip; preserve genuine Unicode.
export function repairFilename(value:string):string {
  if(!value || [...value].some(c=>c.codePointAt(0)!>255))return value;
  try {
    const bytes=Buffer.from(value,'latin1');
    const decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    return Buffer.from(decoded,'utf8').equals(bytes)?decoded:value;
  }catch{return value}
}
export function audioDisposition(value:string):string {
  const name=repairFilename(value).replace(/[\r\n\x00]/g,'');
  const encoded=encodeURIComponent(name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
  return `inline; filename="audio.mp3"; filename*=UTF-8''${encoded}`;
}
