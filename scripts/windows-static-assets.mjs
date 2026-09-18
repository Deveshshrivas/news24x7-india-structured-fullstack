// vinext 0.0.50 uses path.relative() as HTTP cache keys. On Windows this
// produces backslashes, so nested client assets return 404. Normalize only
// those keys; leave path traversal checks and file paths unchanged.
if(process.platform==='win32'){
 const {StaticFileCache}=await import('../node_modules/vinext/dist/server/static-file-cache.js');
 const create=StaticFileCache.create;
 StaticFileCache.create=async function(...args){
  const cache=await create.apply(this,args);
  if(!(cache.entries instanceof Map))throw Error('Unsupported vinext static asset cache; review Windows compatibility adapter');
  cache.entries=new Map([...cache.entries].map(([key,value])=>[key.replaceAll('\\','/'),value]));
  return cache;
 };
}
