"use client";
import { FormEvent, useEffect, useState } from "react";
import AppearanceSettings from "./AppearanceSettings";
function localize(lang: "hi"|"en", hi: string, en: string) { return lang === "en" ? en : hi; }

interface SettingsData {
  siteName: string;
  tagline: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialFacebook: string;
  socialYoutube: string;
  socialInstagram: string;
  socialX: string;
  privacyPolicy: string;
  aboutUs: string;
}

export default function GlobalContentManager({
  language,
  setLanguage,
  notify,
}: {
  language: "hi" | "en";
  setLanguage: (lang: "hi" | "en") => void;
  notify: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<SettingsData | null>(null);

  useEffect(() => {
    fetch("/api/backend/settings")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const f = new FormData(e.currentTarget);
    const payload = Object.fromEntries(f.entries());

    try {
      const response = await fetch("/api/backend/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Error saving settings");
      }
      setData(result);
      notify(localize(language, "सेटिंग्स सेव हो गईं", "Settings saved"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="workspace"><div className="workspaceHead"><div><h2>{localize(language, "वेबसाइट कंटेंट", "Website Content")}</h2></div></div><div style={{padding: 20}}>{localize(language,"लोड हो रहा है…","Loading…")}</div></section>;
  }

  return (
    <section className="workspace">
      <div className="workspaceHead">
        <div>
          <h2>{localize(language, "वेबसाइट कंटेंट", "Website Content")}</h2>
          <p>
            {localize(
              language,
              "न्यूज़रूम की सामान्य जानकारी",
              "General newsroom preferences"
            )}
          </p>
        </div>
      </div>
      <AppearanceSettings />
      <form className="editorForm settingsForm" onSubmit={save}>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px"}}>
          <div>
            
            <label>
              {localize(language, "वेबसाइट नाम", "Website name")}
              <input name="siteName" defaultValue={data?.siteName} required />
            </label>
            <label>
              {localize(language, "टैगलाइन", "Tagline")}
              <input name="tagline" defaultValue={data?.tagline} />
            </label>
            <label>
              {localize(language, "विवरण / About", "Description")}
              <textarea name="description" defaultValue={data?.description} rows={3} />
            </label>
            <label>
              {localize(language, "संपर्क ईमेल", "Contact email")}
              <input name="contactEmail" type="email" defaultValue={data?.contactEmail} />
            </label>
            <label>
              {localize(language, "संपर्क फ़ोन", "Contact phone")}
              <input name="contactPhone" type="tel" defaultValue={data?.contactPhone} />
            </label>
            <label>
              {localize(language, "कार्यालय का पता", "Office address")}
              <textarea name="address" defaultValue={data?.address} rows={3} />
            </label>
          </div>
          
          <div>
            <label>
              {localize(language, "फेसबुक यूआरएल", "Facebook URL")}
              <input name="socialFacebook" type="url" defaultValue={data?.socialFacebook} />
            </label>
            <label>
              {localize(language, "यूट्यूब यूआरएल", "YouTube URL")}
              <input name="socialYoutube" type="url" defaultValue={data?.socialYoutube} />
            </label>
            <label>
              {localize(language, "इंस्टाग्राम यूआरएल", "Instagram URL")}
              <input name="socialInstagram" type="url" defaultValue={data?.socialInstagram} />
            </label>
            <label>
              {localize(language, "X (ट्विटर) यूआरएल", "X (Twitter) URL")}
              <input name="socialX" type="url" defaultValue={data?.socialX} />
            </label>
          </div>
        </div>
        <div style={{marginTop: "20px"}}>
          <label>
            {localize(language, "हमारे बारे में (About Us) पेज का कंटेंट", "About Us Page Content")}
            <textarea name="aboutUs" defaultValue={data?.aboutUs} rows={6} />
          </label>
          <label style={{marginTop: "15px"}}>
            {localize(language, "गोपनीयता नीति (Privacy Policy) पेज का कंटेंट", "Privacy Policy Page Content")}
            <textarea name="privacyPolicy" defaultValue={data?.privacyPolicy} rows={6} />
          </label>
        </div>
        
        {error && <p style={{color: "var(--red)", marginTop: 10}}>{error}</p>}
        
        <button className="primary" disabled={saving}>
          {saving 
            ? localize(language, "सेव हो रहा है…", "Saving…")
            : localize(language, "सेटिंग्स सेव करें", "Save settings")
          }
        </button>
      </form>
    </section>
  );
}
