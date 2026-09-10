/* eslint-disable @next/next/no-img-element -- previews can use local GridFS image streams */
"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { slugifyTitle } from "../slug";
import ArticleMediaEditor, {type ArticleMedia} from "./ArticleMediaEditor";
import ImageRedactor from "./ImageRedactor";
type Item = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  imageUrl?: string;
  youtubeUrl?: string | null;
  media?: ArticleMedia[];
  status: "draft" | "review" | "published";
  featured: boolean;
  author: string;
  updatedAt: string;
};
const fallbackCats = [
  "देश-दुनिया",
  "मध्य प्रदेश",
  "राजनीति",
  "अपराध",
  "कारोबार",
  "शिक्षा",
  "खेल",
  "मनोरंजन",
  "लाइफस्टाइल",
];
type CategoryOption={id:string;name:string;parentId:string|null;active:boolean};
export default function NewsManager({
  mode,
  setTab,
  notify,
}: {
  mode: "list" | "create";
  setTab: (x: string) => void;
  notify: (x: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editing, setEditing] = useState<Item | null>(null);
  const [categoryOptions,setCategoryOptions]=useState<CategoryOption[]>(fallbackCats.map((name,index)=>({id:`fallback-${index}`,name,parentId:null,active:true})));
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRedacting, setCoverRedacting] = useState(false);
  const previewSlug = slugifyTitle(draftSlug || draftTitle || editing?.title || "");
  const load = useCallback(async () => {
    const p = new URLSearchParams({
      admin: "true",
      page: String(page),
      limit: "20",
    });
    if (query) p.set("q", query);
    if (status) p.set("status", status);
    const r = await fetch(`/api/backend/articles?${p}`, { cache: "no-store" });
    const d = await r.json();
    setItems(d.items ?? []);
    setPages(d.pages ?? 1);
  }, [page, query, status]);
  useEffect(() => {
    if (mode !== "list") return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [mode, load]);
  useEffect(()=>{
    let cancelled=false;
    fetch("/api/backend/categories",{cache:"no-store"})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error();return data.items as CategoryOption[]})
      .then(categories=>{if(!cancelled&&categories?.length)setCategoryOptions(categories.filter(category=>category.active))})
      .catch(()=>undefined);
    return()=>{cancelled=true};
  },[]);
  useEffect(() => {
    return () => {
      if (draftImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(draftImagePreview);
      }
    };
  }, [draftImagePreview]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mediaBusy || saving || coverRedacting) return;
    setSaving(true);
    try {
    const form = e.currentTarget;
    const data = new FormData(form);
    if (coverFile) data.set("image", coverFile);
    const featured = (form.elements.namedItem("featured") as HTMLInputElement)
      .checked;
    data.set("featured", String(featured));
    data.set("media_new_order", JSON.stringify(galleryFiles.map(file => file.type.startsWith("video/") ? "videos" : "images")));
    for (const file of galleryFiles) data.append(file.type.startsWith("video/") ? "videos" : "images", file);
    const url = editing
      ? `/api/backend/articles/${editing.id}`
      : "/api/backend/articles";
    const r = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      body: data,
    });
    if (r.ok) {
      notify(editing ? "खबर अपडेट हुई" : "नई खबर सेव हुई");
      setEditing(null);
      setCoverFile(null);
      setCoverRedacting(false);
      setDraftTitle("");
      setDraftSlug("");
      setDraftImagePreview("");
      setDraftImageUrl("");
      setGalleryFiles([]);
      setTab("समाचार");
      await load();
    } else {
      const result = await r.json().catch(() => null);
      notify(result?.detail || "खबर सेव नहीं हुई");
    }
    } catch {
      notify("Upload failed. Check your connection and try again.");
    } finally { setSaving(false); }
  }
  async function remove(x: Item) {
    if (!confirm(`“${x.title}” हटाएँ?`)) return;
    await fetch(`/api/backend/articles/${x.id}`, { method: "DELETE" });
    load();
    notify("खबर हटाई गई");
  }
  if (mode === "create" || editing)
    return (
      <section className="workspace">
        <div className="workspaceHead">
          <div>
            <h2>{editing ? "खबर संपादित करें" : "नई खबर लिखें"}</h2>
            <p>MongoDB में सामग्री सेव और प्रकाशित करें</p>
          </div>
        </div>
        <form className="editorForm" onSubmit={save}>
          <label>
            शीर्षक
            <input
              name="title"
              required
              minLength={5}
              defaultValue={editing?.title}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
            {previewSlug && (
              <small className="slugPreview">
                Public URL: /news/{previewSlug}
              </small>
            )}
          </label>
          <label>
            URL slug / न्यूज़ लिंक
            <input name="slug" value={draftSlug} maxLength={180}
              onChange={event => setDraftSlug(event.target.value)}
              placeholder="Leave blank to generate from title"
              aria-describedby="slug-help"/>
            <small id="slug-help">Titles and SEO can be Hindi, English or Hinglish. URLs use Roman letters (Hindi becomes Hinglish). Leave blank to generate automatically. Old links redirect after a change.</small>
            <button type="button" onClick={() => setDraftSlug(slugifyTitle(draftTitle || editing?.title || ""))}>Generate from title / शीर्षक से बनाएँ</button>
          </label>
          <div>
            <label>
              श्रेणी
              <select name="category" defaultValue={editing?.category}>
                {categoryOptions.map((category) => {
                  const parent=categoryOptions.find(item=>item.id===category.parentId);
                  return <option value={category.name} key={category.id}>{parent?`↳ ${parent.name} / ${category.name}`:category.name}</option>;
                })}
              </select>
            </label>
            <label>
              स्थिति
              <select name="status" defaultValue={editing?.status || "draft"}>
                <option value="draft">ड्राफ्ट</option>
                <option value="review">समीक्षा</option>
                <option value="published">प्रकाशित</option>
              </select>
            </label>
          </div>
          <section className="newsYoutubeEditor" aria-labelledby="youtube-editor-title">
            <h3 id="youtube-editor-title">▶ YouTube Video / यूट्यूब वीडियो</h3>
            <label htmlFor="news-youtube-url">Paste YouTube link / YouTube लिंक डालें (वैकल्पिक)</label>
            <input id="news-youtube-url" name="youtube_url" type="url" maxLength={2048}
              defaultValue={editing?.youtubeUrl || ""}
              placeholder="https://www.youtube.com/watch?v=..."
              aria-describedby="youtube-help" />
            <small id="youtube-help">YouTube, youtu.be, Shorts या Live लिंक डालें। खाली छोड़ने पर वीडियो नहीं दिखेगा। लिंक हटाकर सेव करने से वीडियो हट जाएगा।</small>
          </section>
          <label>
            संक्षिप्त विवरण
            <textarea
              name="excerpt"
              required
              minLength={10}
              rows={3}
              defaultValue={editing?.excerpt}
            />
          </label>
          <label>
            पूरी खबर
            <textarea
              name="body"
              required
              minLength={20}
              rows={14}
              defaultValue={editing?.body || ""}
            />
          </label>
          <section className="newsImageEditor" aria-labelledby="news-image-title">
            <div className="newsImageFields">
              <div>
                <strong id="news-image-title">मुख्य फोटो</strong>
                <p>JPG, PNG या WebP · अधिकतम 8 MB</p>
              </div>
              <label className="newsImageUpload">
                <span>फोटो चुनें</span>
                <input
                  name="image"
                  type="file"
                  disabled={coverRedacting || saving}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setCoverFile(null);
                    if (file && file.size > 8 * 1024 * 1024) {
                      event.target.value = "";
                      setDraftImagePreview("");
                      notify("फोटो 8 MB या उससे छोटी होनी चाहिए");
                      return;
                    }
                    setDraftImagePreview(file ? URL.createObjectURL(file) : "");
                    setCoverFile(file || null);
                  }}
                />
              </label>
              <label>
                या फोटो URL
                <input
                  name="image_url"
                  type="url"
                  defaultValue={
                    editing?.imageUrl?.startsWith("/api/")
                      ? ""
                      : editing?.imageUrl
                  }
                  onChange={(event) => setDraftImageUrl(event.target.value)}
                  placeholder="https://example.com/news-photo.jpg"
                />
              </label>
              {editing?.imageUrl && (
                <small>
                  नयी फोटो न चुनने पर मौजूदा फोटो सुरक्षित रहेगी।
                </small>
              )}
            </div>
            <div className="newsImagePreview">
              {draftImagePreview || draftImageUrl || editing?.imageUrl ? (
                <img
                  src={draftImagePreview || draftImageUrl || editing?.imageUrl}
                  alt="News photo preview"
                />
              ) : (
                <span>फोटो प्रीव्यू</span>
              )}
            </div>
          </section>
          {coverFile && !coverRedacting && <button type="button" disabled={saving} onClick={() => setCoverRedacting(true)}>Blur faces / number plates</button>}
          {coverFile && coverRedacting && <ImageRedactor file={coverFile} onCancel={() => setCoverRedacting(false)} onApply={file => {
            setCoverFile(file);
            setDraftImagePreview(URL.createObjectURL(file));
            setCoverRedacting(false);
          }}/>}
          <ArticleMediaEditor key={editing?.id || "new"} initial={editing?.media || []} onFiles={setGalleryFiles} onBusy={setMediaBusy}/>
          <label>
            <input
              name="featured"
              type="checkbox"
              defaultChecked={editing?.featured}
            />{" "}
            होमपेज पर फीचर्ड करें
          </label>
          <div className="formActions">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCoverFile(null);
                setCoverRedacting(false);
                setMediaBusy(false);
                setDraftTitle("");
                setDraftSlug("");
                setDraftImagePreview("");
                setDraftImageUrl("");
                setGalleryFiles([]);
                setTab("समाचार");
              }}
            >
              रद्द करें
            </button>
            <button className="primary" disabled={mediaBusy || saving || coverRedacting}>
              {editing ? "अपडेट करें" : "खबर सेव करें"}
            </button>
          </div>
        </form>
      </section>
    );
  return (
    <section className="workspace">
      <div className="workspaceHead">
        <div>
          <h2>सभी समाचार</h2>
          <p>खोजें, फ़िल्टर करें और बड़ी न्यूज़ लाइब्रेरी प्रबंधित करें</p>
        </div>
        <button className="primary" onClick={() => setTab("नई पोस्ट")}>
          ＋ नई खबर
        </button>
      </div>
      <form
        className="adminNewsFilters"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="खबर खोजें…"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">सभी स्थितियाँ</option>
          <option value="published">प्रकाशित</option>
          <option value="review">समीक्षा</option>
          <option value="draft">ड्राफ्ट</option>
        </select>
        <button>खोजें</button>
      </form>
      <div className="adminNewsList">
        {items.map((x) => (
          <article key={x.id}>
            <div>
              <span>
                {x.category} • {x.author}
              </span>
              <h3>{x.title}</h3>
              <code className="savedSlug">/news/{x.slug}</code>
              <small>{new Date(x.updatedAt).toLocaleDateString("hi-IN")}</small>
            </div>
            <em className={`status ${x.status}`}>{x.status}</em>
            <button
              onClick={() => {
                setEditing(x);
                setCoverFile(null);
                setCoverRedacting(false);
                setMediaBusy(false);
                setGalleryFiles([]);
                setDraftTitle(x.title);
                setDraftSlug(x.slug);
                setDraftImagePreview("");
                setDraftImageUrl(
                  x.imageUrl?.startsWith("/api/") ? "" : x.imageUrl || "",
                );
              }}
            >
              संपादित
            </button>
            <button className="danger" onClick={() => remove(x)}>
              हटाएँ
            </button>
          </article>
        ))}
      </div>
      <div className="adminPager">
        <button disabled={page === 1} onClick={() => setPage((x) => x - 1)}>
          ←
        </button>
        <b>
          {page} / {pages}
        </b>
        <button disabled={page >= pages} onClick={() => setPage((x) => x + 1)}>
          →
        </button>
      </div>
    </section>
  );
}
