"use client";
import {FormEvent, useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch("/api/backend/auth/login", {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.detail || "लॉगिन नहीं हुआ");
        return;
      }
      const next = new URL(search.get("next") || "/admin", window.location.origin);
      window.location.assign(next.origin === window.location.origin ? next.href : "/admin");
    } catch {
      setError("लॉगिन नहीं हुआ। कृपया दोबारा कोशिश करें।");
    } finally {
      setBusy(false);
    }
  }

  return <main className="loginPage"><section className="loginCard">
    <Link className="loginBrand" href="/"><b>NEWS<span>24×7</span></b><small>INDIA</small></Link>
    <h1>एडमिन लॉगिन</h1>
    <p>केवल अधिकृत टीम के लिए। प्रवेश पाने के लिए सुपर एडमिन से संपर्क करें।</p>
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- OAuth requires a full browser navigation. */}
    <a className="googleLogin" href="/api/backend/auth/google">G&nbsp;&nbsp; Google से जारी रखें</a>
    <div className="loginOr"><span/>या ईमेल से<span/></div>
    <form onSubmit={submit}>
      <label>ईमेल<input required name="email" type="email" autoComplete="username"/></label>
      <label>पासवर्ड<input required name="password" type="password" autoComplete="current-password"/></label>
      {error && <div className="loginError" role="alert">{error}</div>}
      <button className="primary" disabled={busy}>{busy ? "कृपया रुकें…" : "लॉगिन करें"}</button>
    </form>
  </section></main>;
}
