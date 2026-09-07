import {ObjectId} from "mongodb";
import {db} from "./database.js";
import {AppError, slugifyTitle} from "./utils.js";

export async function chooseArticleSlug(title: string, custom?: string | null, excludeId?: ObjectId) {
  if (custom?.trim() && !/[\p{L}\p{N}]/u.test(custom)) throw new AppError(422, "Slug must contain letters or numbers");
  const base = slugifyTitle(custom?.trim() || title);
  const taken = (slug: string) => db.collection("articles").findOne({
    ...(excludeId ? {_id: {$ne: excludeId}} : {}),
    $or: [{slug}, {slug_keys: slug}],
  });
  if (custom?.trim()) {
    if (await taken(base)) throw new AppError(409, "This slug is already used by another article. Choose a different slug.");
    return base;
  }
  let slug = base, suffix = 2;
  while (await taken(slug)) slug = `${base}-${suffix++}`;
  return slug;
}
