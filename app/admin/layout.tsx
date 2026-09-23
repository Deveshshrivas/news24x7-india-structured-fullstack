import type {Metadata} from "next";
// Admin-specific CSS (only loaded on /admin routes)
import "./admin-base.css";
import "../admin-polish.css";
import "../roles.css";
import "../news-admin.css";
import "../audio-admin.css";
import "../reader.css";

export const metadata:Metadata={title:"एडमिन डैशबोर्ड",robots:{index:false,follow:false,nocache:true}};
export default function AdminLayout({children}:{children:React.ReactNode}){return children;}
