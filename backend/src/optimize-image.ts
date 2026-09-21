import sharp from "sharp";
import type { Express } from "express";
import path from "node:path";

export async function optimizeImage(file: Express.Multer.File): Promise<Express.Multer.File> {
  // Only optimize JPEG, PNG, WEBP. Skip GIF, AVIF, Video, Audio.
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    try {
      const optimizedBuffer = await sharp(file.buffer)
        .resize({ width: 1600, withoutEnlargement: true }) // Max 1600px width
        .webp({ quality: 80, effort: 4 }) // Convert to highly compressed WebP
        .toBuffer();

      // Update file metadata to reflect the new optimized WebP
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      
      file.buffer = optimizedBuffer;
      file.mimetype = 'image/webp';
      file.size = optimizedBuffer.length;
      file.originalname = `${name}.webp`;
      
    } catch (err) {
      console.error("Image optimization failed, proceeding with original:", err);
    }
  }
  return file;
}
