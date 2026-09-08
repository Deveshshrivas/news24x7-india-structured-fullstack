import {db} from "./database.js";
import {escapeRegex, objectId} from "./utils.js";
import type {Document} from "mongodb";

export function publicReporter(row: Document) {
  return {id: String(row._id), name: row.name, designation: row.designation || "Reporter",
    photoUrl: row.photo_file_id ? `/api/backend/reporters/public/${row._id}/photo` : null};
}

export async function resolvePublicReporter(id: string) {
  const key = objectId(id);
  const profile = await db.collection("reporters").findOne({_id: key, active: {$ne: false}});
  if (profile) {
    const user = profile.email ? await db.collection("users").findOne({email: {$regex: `^${escapeRegex(profile.email)}$`, $options: "i"}}) : null;
    return {profile: publicReporter(profile), authorId: user?._id};
  }
  // Only accounts with published work are public; never expose the user record.
  const user = await db.collection("users").findOne({_id: key});
  if (!user || !await db.collection("articles").findOne({author_id: key, status: "published"}, {projection: {_id: 1}})) return null;
  const matched = user.email ? await db.collection("reporters").findOne({email: {$regex: `^${escapeRegex(user.email)}$`, $options: "i"}, active: {$ne: false}}) : null;
  return {profile: matched ? publicReporter(matched) : {id: String(key), name: user.name, designation: "News author", photoUrl: null}, authorId: key};
}
