export async function readApiResponse(response:Response){
  const text=await response.text();
  let data;try{data=text?JSON.parse(text):{}}catch{
    throw new Error(response.status===413?'Upload too large. MP3: maximum 25 MB; photos: 5–8 MB; videos: 40 MB. The hosting server may have a lower limit.':`Request failed (${response.status}). Please retry or contact the administrator.`);
  }
  if(!response.ok)throw new Error(data?.detail||data?.error||`Request failed (${response.status})`);
  return data;
}
