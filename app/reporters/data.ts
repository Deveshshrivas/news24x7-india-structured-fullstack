import {cache} from "react";
export type PublicReporter = {id: string; name: string; designation: string; photoUrl: string | null};
export type ReporterDetail = {profile: PublicReporter; items: {id:string;slug:string;title:string;imageUrl?:string}[];page:number;pages:number;total:number};
export const getReporter = cache(async (id: string, page = 1): Promise<ReporterDetail | null> => {
  const response = await fetch(`${process.env.BACKEND_URL || "http://localhost:8000"}/reporters/public/${encodeURIComponent(id)}?page=${page}`, {cache:"no-store"});
  if(response.status === 404 || response.status === 400) return null;
  if(!response.ok) throw new Error("Unable to load reporter profile");
  return response.json();
});
