"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicReporter } from "./data";

export default function ReporterList({ items }: { items: PublicReporter[] }) {
  const [search, setSearch] = useState("");

  const filtered = items.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.designation && r.designation.toLowerCase().includes(search.toLowerCase())) ||
    (r.city && r.city.toLowerCase().includes(search.toLowerCase())) ||
    (r.state && r.state.toLowerCase().includes(search.toLowerCase())) ||
    (r.pincode && r.pincode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="reporterSearchBox" style={{marginBottom: 24}}>
        <input 
          type="search" 
          placeholder="नाम, शहर, राज्य या पिनकोड से खोजें..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", 
            maxWidth: "600px", 
            padding: "12px 16px", 
            borderRadius: "8px", 
            border: "1px solid var(--line)", 
            background: "var(--surface)", 
            color: "var(--text)", 
            fontSize: "16px"
          }}
        />
      </div>

      {!filtered.length ? (
        <p>कोई रिपोर्टर नहीं मिला।</p>
      ) : (
        <div className="reporterDirectory">
          {filtered.map(reporter => (
            <Link className="reporterCard" key={reporter.id} href={`/reporters/${reporter.id}`}>
              {reporter.photoUrl ? (
                <img className="reporterAvatar" src={reporter.photoUrl} alt={reporter.name} width={80} height={80} loading="lazy" />
              ) : (
                <span className="reporterAvatar" aria-hidden="true">{reporter.name?.slice(0,1)}</span>
              )}
              <h2>{reporter.name}</h2>
              <p>{reporter.designation}</p>
              <span className="reporterProfileLink">प्रोफ़ाइल देखें ➔</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
