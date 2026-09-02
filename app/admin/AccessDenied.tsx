import Link from "next/link";
export default function AccessDenied({email}:{email:string}){return <main className="accessDenied"><div><b>NEWS<span>24x7</span> ADMIN</b><h1>प्रवेश की अनुमति नहीं है</h1><p><strong>{email}</strong> के लिए कोई न्यूज़रूम भूमिका निर्धारित नहीं है। सुपर एडमिन से अपना अकाउंट जोड़ने के लिए कहें।</p><Link href="/">वेबसाइट पर वापस जाएँ</Link></div></main>}
