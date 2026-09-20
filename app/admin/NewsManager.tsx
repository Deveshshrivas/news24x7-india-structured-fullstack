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
    editArticleItem,
    clearEditArticle,
  mode,
  setTab,
  notify,
  language,
}: {
  mode: "list" | "create";
  setTab: (x: string) => void;
  notify: (x: string) => void;
  language: "hi" | "en";
  editArticleItem?: any;
  clearEditArticle?: () => void;
}) {
  const text = useCallback((hi: string, en: string) => language === "en" ? en : hi, [language]);
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [editing, setEditing] = useState<Item | null>(null);
  useEffect(() => {
    if (editArticleItem) {
      setEditing(editArticleItem);
      if (clearEditArticle) clearEditArticle();
    }
  }, [editArticleItem, clearEditArticle]);
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
      notify(editing ? text("खबर अपडेट हुई", "News updated") : text("नई खबर सेव हुई", "New news saved"));
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
      notify(result?.detail || text("खबर सेव नहीं हुई", "News not saved"));
    }
    } catch {
      notify("Upload failed. Check your connection and try again.");
    } finally { setSaving(false); }
  }
  async function remove(x: Item) {
    if (!confirm(text(`“${x.title}” हटाएँ?`, `Delete “${x.title}”?`))) return;
    await fetch(`/api/backend/articles/${x.id}`, { method: "DELETE" });
    load();
    notify(text("खबर हटाई गई", "News deleted"));
  }
  if (mode === "create" || editing)
    return (
      <section className="workspace">
        <div className="workspaceHead">
          <div>
            <h2>{editing ? text("खबर संपादित करें", "Edit News") : text("नई खबर लिखें", "Write New News")}</h2>
            <p>{text("MongoDB में सामग्री सेव और प्रकाशित करें", "Save and publish content in MongoDB")}</p>
          </div>
        </div>
        <form className="editorForm" onSubmit={save}>
          <label>
            {text("शीर्षक", "Title")}
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
            <button type="button" onClick={() => setDraftSlug(slugifyTitle(draftTitle || editing?.title || ""))}>{text("Generate from title / शीर्षक से बनाएँ", "Generate from title")}</button>
          </label>
          <div>
            <label>
              {text("श्रेणी", "Category")}
              <select name="category" defaultValue={editing?.category}>
                {categoryOptions.map((category) => {
                  const parent=categoryOptions.find(item=>item.id===category.parentId);
                  return <option value={category.name} key={category.id}>{parent?`↳ ${parent.name} / ${category.name}`:category.name}</option>;
                })}
              </select>
            </label>
            <label>
              {text("स्थिति", "Status")}
              <select name="status" defaultValue={editing?.status || "draft"}>
                <option value="draft">{text("ड्राफ्ट", "Draft")}</option>
                <option value="review">{text("समीक्षा", "Review")}</option>
                <option value="published">{text("प्रकाशित", "Published")}</option>
              </select>
            </label>
          </div>
          <section className="newsYoutubeEditor" aria-labelledby="youtube-editor-title">
            <h3 id="youtube-editor-title">{text("▶ YouTube Video / यूट्यूब वीडियो", "▶ YouTube Video")}</h3>
            <label htmlFor="news-youtube-url">{text("Paste YouTube link / YouTube लिंक डालें (वैकल्पिक)", "Paste YouTube link (optional)")}</label>
            <input id="news-youtube-url" name="youtube_url" type="url" maxLength={2048}
              defaultValue={editing?.youtubeUrl || ""}
              placeholder="https://www.youtube.com/watch?v=..."
              aria-describedby="youtube-help" />
            <small id="youtube-help">{text("YouTube, youtu.be, Shorts या Live लिंक डालें। खाली छोड़ने पर वीडियो नहीं दिखेगा। लिंक हटाकर सेव करने से वीडियो हट जाएगा।", "Paste YouTube, youtu.be, Shorts or Live link. Leave empty to show no video. Removing link and saving will remove video.")}</small>
          </section>
          <label>
            {text("संक्षिप्त विवरण", "Excerpt")}
            <textarea
              name="excerpt"
              required
              minLength={10}
              rows={3}
              defaultValue={editing?.excerpt}
            />
          </label>
          <label>
            {text("पूरी खबर", "Full News")}
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
                <strong id="news-image-title">{text("मुख्य फोटो", "Main Photo")}</strong>
                <p>{text("JPG, PNG या WebP · अधिकतम 8 MB", "JPG, PNG or WebP · Max 8 MB")}</p>
              </div>
              <label className="newsImageUpload">
                <span>{text("फोटो चुनें", "Choose Photo")}</span>
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
                      notify(text("फोटो 8 MB या उससे छोटी होनी चाहिए", "Photo must be 8 MB or smaller"));
                      return;
                    }
                    setDraftImagePreview(file ? URL.createObjectURL(file) : "");
                    setCoverFile(file || null);
                  }}
                />
              </label>
              <label>
                {text("या फोटो URL", "Or Photo URL")}
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
                  {text("नयी फोटो न चुनने पर मौजूदा फोटो सुरक्षित रहेगी।", "If no new photo is chosen, the existing photo will be kept.")}
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
                <span>{text("फोटो प्रीव्यू", "Photo Preview")}</span>
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
            {text("होमपेज पर फीचर्ड करें", "Feature on Homepage")}
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
              {text("रद्द करें", "Cancel")}
            </button>
            <button className="primary" disabled={mediaBusy || saving || coverRedacting}>
              {editing ? text("अपडेट करें", "Update") : text("खबर सेव करें", "Save News")}
            </button>
          </div>
        </form>
      </section>
    );
  return (
    <section className="workspace">
      <div className="workspaceHead">
        <div>
          <h2>{text("सभी समाचार", "All News")}</h2>
          <p>{text("खोजें, फ़िल्टर करें और बड़ी न्यूज़ लाइब्रेरी प्रबंधित करें", "Search, filter and manage large news library")}</p>
        </div>
        <button className="primary" onClick={() => setTab("नई पोस्ट")}>
          {text("＋ नई खबर", "＋ New News")}
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
          placeholder={text("खबर खोजें…", "Search news…")}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{text("सभी स्थितियाँ", "All statuses")}</option>
          <option value="published">{text("प्रकाशित", "Published")}</option>
          <option value="review">{text("समीक्षा", "Review")}</option>
          <option value="draft">{text("ड्राफ्ट", "Draft")}</option>
        </select>
        <button>{text("खोजें", "Search")}</button>
      </form>
      <div className="adminNewsList">
        {items.map((x) => (
          <article key={x.id}>
              <div onClick={() => window.open(`/news/${x.slug}`, "_blank")} style={{cursor: "pointer"}} title={text("लेख पढ़ने के लिए नया टैब खोलें", "Open article in new tab")}>
              <span>
                {x.category} • {x.author}
              </span>
              <h3>{x.title}</h3>
              <code className="savedSlug" style={{textDecoration: "underline", color: "#60a5fa"}}>/news/{x.slug}</code>
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
              {text("संपादित", "Edit")}
            </button>
            <button className="danger" onClick={() => remove(x)}>
              {text("हटाएँ", "Delete")}
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
