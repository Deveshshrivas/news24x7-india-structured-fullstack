import {Readable} from "node:stream";
import {pipeline} from "node:stream/promises";
import multer from "multer";
import type {RequestHandler} from "express";
import {ObjectId, type Document} from "mongodb";
import {articleImages, db} from "./database.js";
import {AppError, asyncRoute, objectId, routeParam} from "./utils.js";
import {getCurrentUser, rolePermissions} from "./security.js";
import type {AuthedRequest} from "./types.js";

type Media = {id: string; file_id: ObjectId; type: "image" | "video"; content_type: string; name: string};
const images = new Set(["image/jpeg", "image/png", "image/webp"]);
const videos = new Set(["video/mp4", "video/webm"]);
export const uploadArticleMedia = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 40 * 1024 * 1024, files: 11, fields: 30, fieldSize: 1024 * 1024},
  fileFilter: (_req, file, cb) => {
    const valid = file.fieldname === "videos" ? videos.has(file.mimetype) : images.has(file.mimetype);
    if(valid) cb(null,true); else cb(new AppError(415, "Use JPG, PNG, WebP images or MP4, WebM videos"));
  },
}).fields([{name: "image", maxCount: 1}, {name: "images", maxCount: 8}, {name: "videos", maxCount: 2}]);

export const validateArticleMedia: RequestHandler = (req, _res, next) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const all = Object.values(files || {}).flat();
  if (all.reduce((total, file) => total + file.size, 0) > 80 * 1024 * 1024) return next(new AppError(413, "Combined media must be 80 MB or smaller"));
  if (all.some(file => file.fieldname !== "videos" && file.size > 8 * 1024 * 1024)) return next(new AppError(413, "Each photo must be 8 MB or smaller"));
  req.file = files?.image?.[0];
  next();
};

export async function prepareGallery(request: AuthedRequest, existing?: Document) {
  const old: Media[] = existing?.media || [];
  let keep = old.map(item => item.id);
  if (request.body.media_keep !== undefined) {
    try { keep = JSON.parse(request.body.media_keep); } catch { throw new AppError(422, "Invalid media order"); }
    if (!Array.isArray(keep) || new Set(keep).size !== keep.length || keep.some(id => !old.some(item => item.id === id))) throw new AppError(422, "Invalid media selection");
  }
  const retained = keep.map(id => old.find(item => item.id === id)!);
  const files = request.files as Record<string, Express.Multer.File[]> | undefined;
  let incoming = [...(files?.images || []), ...(files?.videos || [])];
  if (request.body.media_new_order !== undefined) {
    let order: string[];
    try { order = JSON.parse(request.body.media_new_order); } catch { throw new AppError(422, "Invalid upload order"); }
    const queues: Record<string, Express.Multer.File[]> = {images: [...(files?.images || [])], videos: [...(files?.videos || [])]};
    if (!Array.isArray(order) || order.length !== incoming.length || order.some(type => type !== "images" && type !== "videos")) throw new AppError(422, "Invalid upload order");
    incoming = order.map(type => {const file = queues[type]!.shift(); if (!file) throw new AppError(422, "Invalid upload order"); return file;});
  }
  if (retained.filter(m => m.type === "image").length + (files?.images?.length || 0) > 8 || retained.filter(m => m.type === "video").length + (files?.videos?.length || 0) > 2) throw new AppError(422, "An article supports 8 gallery photos and 2 videos");
  const added: Media[] = [];
  const remove = async (items: Media[]) => { for (const item of items) await articleImages.delete(item.file_id).catch(() => undefined); };
  try {
    for (const file of incoming) {
      const stream = articleImages.openUploadStream(file.originalname, {contentType: file.mimetype});
      try { await pipeline(Readable.from(file.buffer), stream); } catch(error) { await articleImages.delete(stream.id).catch(() => undefined); throw error; }
      added.push({id: String(stream.id), file_id: stream.id, type: file.fieldname === "videos" ? "video" : "image", content_type: file.mimetype, name: file.originalname});
    }
  } catch(error) { await remove(added); throw error; }
  return {media: [...retained, ...added], rollback: () => remove(added), cleanup: () => remove(old.filter(item => !keep.includes(item.id)))};
}

export const streamArticleMedia = asyncRoute(async(request: AuthedRequest, response) => {
  const row = await db.collection("articles").findOne({_id: objectId(routeParam(request.params.itemId))});
  const media: Media | undefined = row?.media?.find((item: Media) => item.id === routeParam(request.params.mediaId));
  if (!row || !media) throw new AppError(404, "Media not found");
  if (row.status !== "published") {
    const user = await getCurrentUser(request);
    const permissions = rolePermissions[user.role];
    if (!permissions?.has("*") && !permissions?.has("articles")) throw new AppError(403, "Insufficient permission");
  }
  const file = await articleImages.find({_id: media.file_id}).next();
  if (!file) throw new AppError(404, "Media not found");
  response.set({"Content-Type": media.content_type, "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes", "Cache-Control": "private, no-cache"});
  let start = 0, end = file.length - 1;
  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1] && !match[2])) { response.set("Content-Range", `bytes */${file.length}`).status(416).end(); return; }
    start = match[1] ? Number(match[1]) : Math.max(0, file.length - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= file.length) { response.set("Content-Range", `bytes */${file.length}`).status(416).end(); return; }
    response.status(206).set("Content-Range", `bytes ${start}-${end}/${file.length}`);
  }
  response.set("Content-Length", String(end - start + 1));
  if (request.method === "HEAD") { response.end(); return; }
  const stream = articleImages.openDownloadStream(media.file_id, {start, end: end + 1});
  response.on("close", () => stream.destroy());
  stream.on("error", error => response.destroy(error)).pipe(response);
});
