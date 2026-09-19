import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { db } from '../database.js';
import { authenticate } from '../security.js';
import type { AuthedRequest } from '../types.js';
import { AppError, asyncRoute } from '../utils.js';

export const settingsRouter = Router();

const settingsSchema = z.object({
  siteName: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  contactEmail: z.string().email().or(z.literal('')).optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  socialFacebook: z.string().url().or(z.literal('')).optional(),
  socialYoutube: z.string().url().or(z.literal('')).optional(),
  socialInstagram: z.string().url().or(z.literal('')).optional(),
  socialX: z.string().url().or(z.literal('')).optional(),
  logoUrl: z.string().optional(),
});

export const DEFAULT_SETTINGS = {
  siteName: "NEWS24x7 INDIA",
  tagline: "सच दिखाने की हिम्मत",
  description: "निष्पक्ष, निर्भीक और विश्वसनीय पत्रकारिता। भारत और दुनिया की हर महत्वपूर्ण खबर, हर पल आपके साथ।",
  contactEmail: "news@news24x7india.com",
  contactPhone: "",
  address: "हनुमान कॉलोनी, गोले का मंदिर\nग्वालियर, मध्य प्रदेश",
  socialFacebook: "https://facebook.com",
  socialYoutube: "https://youtube.com/c/news24x7india",
  socialInstagram: "https://instagram.com",
  socialX: "https://x.com",
  logoUrl: ""
};

settingsRouter.get('/', asyncRoute(async (_req, res) => {
  const row = await db.collection('site_settings').findOne({ key: 'general' });
  const currentSettings = row?.data || {};
  res.set('Cache-Control', 'no-store').json({ ...DEFAULT_SETTINGS, ...currentSettings });
}));

settingsRouter.put('/', authenticate, asyncRoute(async (req: AuthedRequest, res) => {
  if (!['admin', 'super_admin'].includes(req.user?.role ?? '')) {
    throw new AppError(403, 'Only admins and super admins can change website settings');
  }
  const data = settingsSchema.parse(req.body);
  await db.collection('site_settings').updateOne(
    { _id: new ObjectId('000000000000000000000002') },
    {
      $set: {
        key: 'general',
        data,
        updated_at: new Date(),
        updated_by: req.user!._id
      }
    },
    { upsert: true }
  );
  res.set('Cache-Control', 'no-store').json(data);
}));
