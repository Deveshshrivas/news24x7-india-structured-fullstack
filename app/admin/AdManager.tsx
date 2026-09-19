import {useState, useEffect, useCallback, type FormEvent} from "react";
import type {AdminLanguage} from "./AdminDashboard";

export default function AdManager({language, notify}: {language: AdminLanguage, notify: (x: string) => void}) {
  const text = useCallback((hi: string, en: string) => language === "en" ? en : hi, [language]);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/backend/ads", {cache: "no-store"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || text("विज्ञापन लोड करने में विफल", "Failed to load ads"));
      setItems(data.items ?? []);
      setError("");
    } catch(caught) {
      setError(caught instanceof Error ? caught.message : text("विज्ञापन लोड करने में विफल", "Failed to load ads"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [language]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const body = new FormData(form);
    try {
      const response = await fetch("/api/backend/ads", {method: "POST", body});
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || text("अभियान सेव करने में त्रुटि", "Error saving campaign"));
      form.reset();
      await load();
      notify(text("अभियान सफलतापूर्वक सेव हुआ", "Campaign saved successfully"));
    } catch(caught) {
      setError(caught instanceof Error ? caught.message : text("अभियान सेव करने में त्रुटि", "Error saving campaign"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(text("क्या आप वाकई इस विज्ञापन को हटाना चाहते हैं?", "Are you sure you want to delete this ad?"))) return;
    try {
      const response = await fetch(`/api/backend/ads/${id}`, {method: "DELETE"});
      if (!response.ok) throw new Error(text("विज्ञापन हटाने में विफल", "Failed to delete ad"));
      await load();
      notify(text("विज्ञापन हटाया गया", "Ad deleted"));
    } catch(caught) {
      setError(caught instanceof Error ? caught.message : text("विज्ञापन हटाने में विफल", "Failed to delete ad"));
    }
  }

  return (
    <section className="workspace">
      <div className="workspaceHead">
        <div>
          <h2>{text("विज्ञापन अभियान", "Advertising campaigns")}</h2>
          <p>{text("वेबसाइट विज्ञापन बनाएँ और सक्रिय करें", "Create and activate website ads")}</p>
        </div>
      </div>
      
      <form className="editorForm" onSubmit={create}>
        <label>{text("अभियान नाम", "Campaign name")}<input name="name" required placeholder={text("अभियान का नाम", "Campaign name")}/></label>
        <div>
          <label>{text("प्लेसमेंट", "Placement")}
            <select name="placement">
              <option value="homeTop">{text("होमपेज टॉप", "Homepage top")}</option>
              <option value="sidebar">{text("साइडबार", "Sidebar")}</option>
              <option value="midArticle">{text("खबर के बीच", "Mid-article")}</option>
            </select>
          </label>
          <label>{text("लिंक", "Link")}<input name="link" type="url" placeholder="https://"/></label>
        </div>
        <label>{text("बैनर", "Banner")}<input name="banner" type="file" accept="image/*" required/></label>
        <button className="primary" disabled={saving}>{saving ? text("सेव हो रहा है...", "Saving...") : text("अभियान सेव करें", "Save campaign")}</button>
      </form>

      {error && <div className="teamError" role="alert" style={{color: 'red', marginTop: '10px'}}>{error}</div>}

      <div className="tableWrap" style={{marginTop: '30px'}}>
        <h3>{text("सक्रिय विज्ञापन", "Active Ads")}</h3>
        {loading ? <p>{text("लोड हो रहा है...", "Loading...")}</p> : (
          <table>
            <thead>
              <tr>
                <th>{text("नाम", "Name")}</th>
                <th>{text("प्लेसमेंट", "Placement")}</th>
                <th>{text("बैनर", "Banner")}</th>
                <th>{text("कार्रवाई", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4}>{text("कोई विज्ञापन नहीं मिला", "No ads found")}</td></tr>
              ) : items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.placement === 'homeTop' ? text("होमपेज टॉप", "Homepage top") : item.placement === 'sidebar' ? text("साइडबार", "Sidebar") : text("खबर के बीच", "Mid-article")}</td>
                  <td>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{maxHeight: '40px', maxWidth: '100px'}}/> : '-'}</td>
                  <td><button onClick={() => remove(item.id)} style={{background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}>{text("हटाएँ", "Delete")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
