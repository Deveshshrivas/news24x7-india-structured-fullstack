import {Router} from "express";
import {db, adBanners} from "../database.js";
import {requirePermission} from "../security.js";
import {asyncRoute, objectId, routeParam, AppError} from "../utils.js";
import multer from "multer";
import type {AuthedRequest} from "../types.js";
import {Readable} from "node:stream";
import {ObjectId} from "mongodb";
import {broadcastNotification} from "./notifications.js";
import {optimizeImage} from "../optimize-image.js";

export const adsRouter = Router();
const upload = multer({storage: multer.memoryStorage()}).single("banner");

adsRouter.get("/", asyncRoute(async (req, res) => {
  const items = await db.collection("ads").find({ active: true }).sort({ created_at: -1 }).toArray();
  res.json({ items: items.map(item => ({ id: String(item._id), name: item.name, placement: item.placement, link: item.link, imageUrl: item.imageUrl })) });
}));

adsRouter.get("/:id/image", asyncRoute(async (req, res) => {
  const ad = await db.collection("ads").findOne({ _id: objectId(routeParam(req.params.id)) });
  if (!ad || !ad.imageId) throw new AppError(404, "Ad image not found");
  const file = await adBanners.find({ _id: new ObjectId(ad.imageId) }).next();
  if (!file) throw new AppError(404, "Ad image file not found");
  res.set("Content-Type", file.contentType || "image/jpeg");
  res.set("Cache-Control", "public, max-age=86400");
  adBanners.openDownloadStream(new ObjectId(ad.imageId)).pipe(res);
}));

adsRouter.post("/", requirePermission("ads"), upload, asyncRoute(async (req: AuthedRequest, res) => {
  const {name, placement, link} = req.body;
  let imageId = null;
  let imageUrl = "";
  if (req.file) {
    req.file = await optimizeImage(req.file);
    const stream = adBanners.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
    await new Promise<void>((resolve, reject) => Readable.from(req.file!.buffer).pipe(stream).once("error", reject).once("finish", () => resolve()));
    imageId = stream.id;
  }
  const result = await db.collection("ads").insertOne({name, placement, link, imageId, active: true, owner_id: req.user!._id, created_at: new Date()});
  if (imageId) {
    imageUrl = `/api/backend/ads/${result.insertedId}/image`;
    await db.collection("ads").updateOne({ _id: result.insertedId }, { $set: { imageUrl } });
    import('../media-library.js').then(m => m.syncMediaLibrary().catch(() => {})).catch(() => {});
  }
  broadcastNotification(`Ad configured: ${name} by ${req.user!.name}`, `/`);
  res.json({ok: true});
}));

adsRouter.delete("/:id", requirePermission("ads"), asyncRoute(async (req: AuthedRequest, res) => {
  const ad = await db.collection("ads").findOne({ _id: objectId(routeParam(req.params.id)) });
  if (ad) {
    if (ad.imageId) {
      await adBanners.delete(new ObjectId(ad.imageId)).catch(() => undefined);
    }
    await db.collection("ads").deleteOne({ _id: ad._id });
    import('../media-library.js').then(m => m.syncMediaLibrary().catch(() => {})).catch(() => {});
    broadcastNotification(`Ad removed: ${ad.name} by ${req.user!.name}`);
  }
  res.json({ok: true});
}));
