import {Router} from "express";
import {db, adBanners} from "../database.js";
import {requirePermission} from "../security.js";
import {asyncRoute, objectId, routeParam, AppError} from "../utils.js";
import multer from "multer";
import type {AuthedRequest} from "../types.js";
import {Readable} from "node:stream";
import {ObjectId} from "mongodb";

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
    const stream = adBanners.openUploadStream(req.file.originalname, { contentType: req.file.mimetype });
    await new Promise<void>((resolve, reject) => Readable.from(req.file!.buffer).pipe(stream).once("error", reject).once("finish", () => resolve()));
    imageId = stream.id;
  }
  const result = await db.collection("ads").insertOne({name, placement, link, imageId, active: true, created_at: new Date()});
  if (imageId) {
    imageUrl = `/api/backend/ads/${result.insertedId}/image`;
    await db.collection("ads").updateOne({ _id: result.insertedId }, { $set: { imageUrl } });
  }
  res.json({ok: true});
}));
