"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window { adsbygoogle?: Record<string, unknown>[]; }
}

export default function GoogleAd({ client, slot, format = "auto", fullWidth = true, style }: {
  client: string; slot: string; format?: string; fullWidth?: boolean; style?: React.CSSProperties;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    // Load the adsbygoogle script once
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      const s = document.createElement("script");
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    // Push the ad
    if (!pushed.current) {
      pushed.current = true;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
    }
  }, [client]);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", ...(style || {}) }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidth ? "true" : "false"}
    />
  );
}
