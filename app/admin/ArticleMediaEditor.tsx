/* eslint-disable @next/next/no-img-element -- local upload previews */
"use client";
import {useEffect, useState} from "react";
import ImageRedactor from "./ImageRedactor";
export type ArticleMedia = {id: string; type: "image" | "video"; name: string; url: string};

async function optimizePhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, {imageOrientation: "from-image"});
  try {
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.82));
    return blob && (blob.size < file.size || scale < 1)
      ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {type: "image/webp"}) : file;
  } finally { bitmap.close(); }
}

export default function ArticleMediaEditor({initial, onFiles, onBusy}: {initial: ArticleMedia[]; onFiles: (files: File[]) => void; onBusy: (busy: boolean) => void}) {
  const [kept, setKept] = useState(initial);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [redacting, setRedacting] = useState<number | null>(null);
  function closeEditor() { setRedacting(null); setBusy(false); onBusy(false); }
  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    const timer = setTimeout(() => setPreviews(urls), 0);
    return () => {clearTimeout(timer); urls.forEach(url => URL.revokeObjectURL(url));};
  }, [files]);
  async function select(selected: File[]) {
    setError(""); setBusy(true); onBusy(true);
    try {
      const types = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
      if (selected.some(file => !types.includes(file.type))) throw Error("Use JPG, PNG, WebP, MP4 or WebM files.");
      if (selected.some(file => file.size > (file.type.startsWith("video/") ? 40 : 8) * 1024 * 1024)) throw Error("Each photo: up to 8 MB. Each video: up to 40 MB.");
      const combined = [...files, ...selected];
      if (combined.filter(file => file.type.startsWith("image/")).length + kept.filter(item => item.type === "image").length > 8 || combined.filter(file => file.type.startsWith("video/")).length + kept.filter(item => item.type === "video").length > 2) throw Error("Maximum 8 gallery photos and 2 videos per article.");
      const optimized: File[] = [];
      for (const file of selected) optimized.push(file.type.startsWith("image/") ? await optimizePhoto(file) : file);
      const next = [...files, ...optimized];
      if(next.reduce((sum,file)=>sum+file.size,0)>72*1024*1024) throw Error("Gallery uploads must total 72 MB or less.");
      setFiles(next); onFiles(next);
    } catch (e) {setError(e instanceof Error ? e.message : "Unable to prepare media.");}
    finally {setBusy(false); onBusy(false);}
  }
  return <fieldset className="seoEditor">
    <legend>Photos and videos / फोटो और वीडियो</legend>
    <p>Add up to 8 gallery photos and 2 videos. Photos are resized to 1920px and compressed when possible. MP4/WebM videos: 40 MB each.</p>
    <input type="hidden" name="media_keep" value={JSON.stringify(kept.map(item => item.id))}/>
    <label>Add media<input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={event => {const selected = Array.from(event.target.files || []); event.target.value = ""; void select(selected);}}/></label>
    {busy && <p role="status">Preparing photos…</p>}
    {error && <p role="alert">{error}</p>}
    {redacting !== null && <ImageRedactor file={files[redacting]} onCancel={closeEditor} onApply={file => {
      const next = files.map((existing, index) => index === redacting ? file : existing);
      if (next.reduce((sum, item) => sum + item.size, 0) > 72 * 1024 * 1024) {
        setError("Edited gallery exceeds 72 MB. Remove a file and try again.");
        closeEditor();
        return;
      }
      setFiles(next); onFiles(next); closeEditor();
    }}/>}
    <div className="articleMediaGrid">
      {kept.map((item,index) => <div key={item.id}>
        {item.type === "image" ? <img src={item.url} alt={item.name} loading="lazy"/> : <video src={item.url} controls preload="none" playsInline/>}
        <small>{item.name}</small>
        <button type="button" disabled={busy || index===0} onClick={()=>setKept(current=>{const next=[...current];[next[index-1],next[index]]=[next[index],next[index-1]];return next;})}>Move up</button>
        <button type="button" disabled={busy} onClick={() => setKept(current => current.filter(m => m.id !== item.id))}>Remove</button>
      </div>)}
      {files.map((file,index) => <div key={`${file.name}-${index}`}>
        {file.type.startsWith("image/") && <button type="button" disabled={busy} onClick={() => {setError("");setRedacting(index);setBusy(true);onBusy(true);}}>Blur faces / number plates</button>}
        {file.type.startsWith("image/") ? <img src={previews[index]} alt={file.name}/> : <video src={previews[index]} controls preload="none" playsInline/>}
        <small>{file.name} · {(file.size/1024/1024).toFixed(1)} MB</small>
        <button type="button" disabled={busy || index===0} onClick={()=>{const next=[...files];[next[index-1],next[index]]=[next[index],next[index-1]];setFiles(next);onFiles(next);}}>Move up</button>
        <button type="button" disabled={busy} onClick={() => {const next=files.filter((_,i)=>i!==index);setFiles(next);onFiles(next);}}>Remove</button>
      </div>)}
    </div>
  </fieldset>;
}
