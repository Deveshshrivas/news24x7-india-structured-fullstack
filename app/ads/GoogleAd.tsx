"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window { adsbygoogle?: Record<string, unknown>[]; }
}

export default function GoogleAd({ client, slot, format = "auto", fullWidth = true, style, layoutKey }: {
  client: string; slot: string; format?: string; fullWidth?: boolean; style?: React.CSSProperties; layoutKey?: string;
}) {
  const element = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Load the adsbygoogle script once
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      const s = document.createElement("script");
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      s.async = true;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    
    if (!element.current) return;
    const ins = element.current;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && ins.offsetWidth > 0 && !ins.dataset.requested) {
        ins.dataset.requested = 'true';
        observer.disconnect();
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
      }
    }, { rootMargin: '200px' });
    
    observer.observe(ins);
    return () => observer.disconnect();
  }, [client]);

  return (
    <ins
      ref={element}
      className="adsbygoogle"
      style={{ display: "block", ...(style || {}) }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-ad-layout-key={layoutKey}
      data-full-width-responsive={fullWidth ? "true" : "false"}
    />
  );
}
