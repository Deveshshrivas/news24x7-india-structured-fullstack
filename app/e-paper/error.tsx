'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="infoContent"><h1>ई-पेपर उपलब्ध नहीं है</h1><p>सर्वर से संपर्क नहीं हो सका। कृपया फिर कोशिश करें।</p><button onClick={reset}>दोबारा कोशिश करें</button></main>}
