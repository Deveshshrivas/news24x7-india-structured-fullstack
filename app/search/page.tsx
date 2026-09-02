import type {Metadata} from "next";
import Link from "next/link";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "समाचार खोजें",
  description: "NEWS24x7 INDIA पर शीर्षक, न्यूज़ स्लग, विषय या श्रेणी से समाचार खोजें।",
  robots: {index: false, follow: true},
};

export default function Search() {
  return <main className="infoPage"><header className="articleTop"><Link className="brand" href="/"><span className="brand24">NEWS<span>24x7</span></span><b>INDIA</b><small>सच दिखाने की हिम्मत</small></Link><Link href="/">← होम</Link></header><SearchClient/></main>;
}
