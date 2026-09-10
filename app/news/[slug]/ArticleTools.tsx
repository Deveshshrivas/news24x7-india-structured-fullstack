'use client';
import {useState} from 'react';

export default function ArticleTools() {
  const [large, setLarge] = useState(false);
  const [message, setMessage] = useState('');
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setMessage('लिंक कॉपी हो गया'); }
    catch { setMessage('ब्राउज़र के एड्रेस बार से लिंक कॉपी करें'); }
  }
  return <div className="articleTools">
    <button type="button" aria-pressed={large} onClick={event => {
      const next = !large; setLarge(next);
      event.currentTarget.closest('article')?.classList.toggle('articleLargeText', next);
    }}>अक्षर {large ? 'छोटे करें' : 'बड़े करें'}</button>
    <button type="button" onClick={copyLink}>लिंक कॉपी करें ↗</button>
    <span role="status">{message}</span>
  </div>;
}
