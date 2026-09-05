/* eslint-disable @next/next/no-img-element -- previews can use local GridFS image streams */
"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { slugifyTitle } from "../slug";
const seoPreviewHost = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://news24x7india.com"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
type Item = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  imageUrl?: string;
  status: "draft" | "review" | "published";
  featured: boolean;
  author: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoImageUrl?: string;
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
  const [draftExcerpt, setDraftExcerpt] = useState("");
  const [draftSeoTitle, setDraftSeoTitle] = useState("");
  const [draftSeoDescription, setDraftSeoDescription] = useState("");
  const [draftImagePreview, setDraftImagePreview] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const previewSlug = editing?.slug || slugifyTitle(draftTitle);
  const previewSeoTitle =
    draftSeoTitle || draftTitle || editing?.title || "SEO title preview";
  const previewSeoDescription =
    draftSeoDescription ||
    draftExcerpt ||
    editing?.excerpt ||
    "SEO description will be generated from the article summary.";
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
    const form = e.currentTarget;
    const data = new FormData(form);
    const featured = (form.elements.namedItem("featured") as HTMLInputElement)
      .checked;
    data.set("featured", String(featured));
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
      setDraftTitle("");
      setDraftExcerpt("");
      setDraftSeoTitle("");
      setDraftSeoDescription("");
      setDraftImagePreview("");
      setDraftImageUrl("");
      setTab("समाचार");
      await load();
    } else {
      const result = await r.json().catch(() => null);
      notify(result?.detail || "खबर सेव नहीं हुई");
    }
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
          <label>
            संक्षिप्त विवरण
            <textarea
              name="excerpt"
              required
              minLength={10}
              rows={3}
              defaultValue={editing?.excerpt}
              onChange={(event) => setDraftExcerpt(event.target.value)}
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
          <fieldset className="seoEditor">
            <legend>Dynamic SEO</legend>
            <p>
              खाली छोड़ने पर शीर्षक, सारांश और मुख्य फोटो से SEO अपने आप बनेगा।
            </p>
            <label>
              SEO title{" "}
              <small>
                {(draftSeoTitle || editing?.seoTitle || "").length}/70
              </small>
              <input
                name="seo_title"
                maxLength={70}
                defaultValue={editing?.seoTitle}
                onChange={(event) => setDraftSeoTitle(event.target.value)}
                placeholder={
                  draftTitle || editing?.title || "Automatic from article title"
                }
              />
            </label>
            <label>
              SEO description{" "}
              <small>
                {(draftSeoDescription || editing?.seoDescription || "").length}
                /170
              </small>
              <textarea
                name="seo_description"
                maxLength={170}
                rows={3}
                defaultValue={editing?.seoDescription}
                onChange={(event) => setDraftSeoDescription(event.target.value)}
                placeholder={
                  draftExcerpt ||
                  editing?.excerpt ||
                  "Automatic from article summary"
                }
              />
            </label>
            <label>
              SEO keywords
              <input
                name="seo_keywords"
                maxLength={500}
                defaultValue={editing?.seoKeywords}
                placeholder="राजनीति, मध्य प्रदेश, breaking news"
              />
            </label>
            <label>
              Social share image URL
              <input
                name="seo_image_url"
                type="url"
                defaultValue={editing?.seoImageUrl}
                placeholder="Automatic from main photo"
              />
            </label>
            <div className="seoSerpPreview">
              <small>
                {seoPreviewHost}/news/{previewSlug}
              </small>
              <strong>{previewSeoTitle}</strong>
              <p>{previewSeoDescription}</p>
            </div>
          </fieldset>
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
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file && file.size > 8 * 1024 * 1024) {
                      event.target.value = "";
                      setDraftImagePreview("");
                      notify("फोटो 8 MB या उससे छोटी होनी चाहिए");
                      return;
                    }
                    setDraftImagePreview(file ? URL.createObjectURL(file) : "");
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
                setDraftTitle("");
                setDraftExcerpt("");
                setDraftSeoTitle("");
                setDraftSeoDescription("");
                setDraftImagePreview("");
                setDraftImageUrl("");
                setTab("समाचार");
              }}
            >
              रद्द करें
            </button>
            <button className="primary">
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
                setDraftTitle(x.title);
                setDraftExcerpt(x.excerpt);
                setDraftSeoTitle(x.seoTitle || "");
                setDraftSeoDescription(x.seoDescription || "");
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
