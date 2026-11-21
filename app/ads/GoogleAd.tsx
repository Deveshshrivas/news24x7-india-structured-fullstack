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
    // GoogleAdScript in the root layout owns loading the script once.
    
    if (!element.current) return;
    const ins = element.current;
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && ins.offsetWidth > 0 && !ins.dataset.requested) {
        ins.dataset.requested = 'true';
        observer.disconnect();
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
        catch (error) { console.error('AdSense error:', error); }
      }
    }, { rootMargin: '200px' });
    
    observer.observe(ins);
    return () => observer.disconnect();
  }, [client, slot]);

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
