"use client";
import { useEffect, useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  
  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: url || window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  }

  if (!url) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="shareButtons">
      <h3>शेयर करें:</h3>
      <div className="shareLinks">
        <a href={`https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="shareBtn whatsapp" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.031 0C5.385 0 0 5.388 0 12.036c0 2.12.553 4.19 1.605 6.014L.495 24l6.096-1.6c1.765.952 3.75 1.455 5.79 1.455h.005c6.645 0 12.031-5.388 12.031-12.036S18.675 0 12.031 0zm0 21.848c-1.785 0-3.53-.48-5.06-1.385l-.36-.215-3.765.99.99-3.67-.235-.375c-.995-1.585-1.52-3.415-1.52-5.3 0-5.46 4.44-9.904 9.9-9.904 2.65 0 5.14 1.035 7.015 2.91 1.875 1.875 2.91 4.365 2.91 7.015-.005 5.46-4.445 9.904-9.865 9.904zm5.41-7.4c-.295-.15-1.76-.87-2.035-.97-.275-.1-.475-.15-.675.15-.2.3-.77.97-.945 1.17-.175.2-.35.225-.645.075-.295-.15-1.255-.465-2.39-1.485-.88-.795-1.475-1.775-1.65-2.075-.175-.3-.02-.465.13-.615.135-.135.295-.345.445-.52.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.24-.585-.485-.505-.675-.515-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.045 1.025-1.045 2.5 0 1.475 1.07 2.9 1.22 3.1.15.2 2.115 3.225 5.12 4.525.715.31 1.27.495 1.705.635.715.225 1.365.195 1.88.12.575-.085 1.76-.72 2.01-1.415.25-.695.25-1.29.175-1.415-.075-.125-.275-.2-.575-.35z"/></svg>
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="shareBtn facebook" aria-label="Facebook">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="shareBtn twitter" aria-label="X (Twitter)">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button onClick={shareNative} className="shareBtn nativeShare" aria-label="Share">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
