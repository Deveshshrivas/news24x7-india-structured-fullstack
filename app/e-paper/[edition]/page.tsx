import Reader from "./Reader";
const names=["ग्वालियर संस्करण","मध्य प्रदेश संस्करण","राष्ट्रीय संस्करण","राजस्थान संस्करण"];
export default async function Paper({params}:{params:Promise<{edition:string}>}){const{edition}=await params;return <Reader name={names[Math.max(0,Number(edition)-1)]??names[0]}/>}
