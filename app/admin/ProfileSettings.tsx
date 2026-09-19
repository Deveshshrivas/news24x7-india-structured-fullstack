"use client";

import { FormEvent, useState } from "react";
import { AdminLanguage } from "./roles";

export default function ProfileSettings({
  language,
  notify,
  localize,
  user
}: {
  language: AdminLanguage;
  notify: (msg: string) => void;
  localize: (lang: AdminLanguage, hi: string, en: string) => string;
  user: { name: string; email: string };
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    if (f.get("name")) body.name = String(f.get("name"));
    if (f.get("email")) body.email = String(f.get("email"));
    if (f.get("password")) body.password = String(f.get("password"));

    try {
      const res = await fetch("/api/backend/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        notify(localize(language, "प्रोफाइल अपडेट हो गई", "Profile updated successfully"));
        if (body.password) {
           (e.target as HTMLFormElement).reset();
        }
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="editorForm settingsForm" onSubmit={updateProfile}>
      <h3>{localize(language, "आपकी प्रोफाइल", "Your Profile")}</h3>
      <label>
        {localize(language, "नाम", "Name")}
        <input name="name" defaultValue={user.name} required minLength={2} />
      </label>
      <label>
        {localize(language, "ईमेल", "Email")}
        <input name="email" type="email" defaultValue={user.email} required />
      </label>
      <label>
        {localize(language, "नया पासवर्ड (अगर बदलना हो)", "New Password (Optional)")}
        <input name="password" type="password" minLength={8} placeholder={localize(language, "नया पासवर्ड दर्ज करें", "Enter new password")} />
      </label>
      {error && <div className="teamError" role="alert">{error}</div>}
      <button className="primary" disabled={loading}>
        {loading ? localize(language, "सेव हो रहा है...", "Saving...") : localize(language, "प्रोफाइल सेव करें", "Save Profile")}
      </button>
    </form>
  );
}
