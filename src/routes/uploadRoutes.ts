import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as uploadMiddleware from '../middlewares/uploadMiddleware';
import * as uploadController from '../controllers/http/uploadController';
import { Media_Type } from '../enums/uploadEnums';

const router = express.Router();

router.use(authMiddleware.protect);

router.post(
  '/images',
  uploadMiddleware.uploadMedia(Media_Type.Image),
  uploadMiddleware.uploadToCloud(Media_Type.Image),
  uploadController.uploadMedia
);

router.post(
  '/videos',
  uploadMiddleware.uploadMedia(Media_Type.Video),
  uploadMiddleware.uploadToCloud(Media_Type.Video),
  uploadController.uploadMedia
);

router.post(
  '/audios',
  uploadMiddleware.uploadMedia(Media_Type.Audio),
  uploadMiddleware.uploadToCloud(Media_Type.Audio),
  uploadController.uploadMedia
);

router.post(
  '/documents',
  uploadMiddleware.uploadMedia(Media_Type.Document),
  uploadMiddleware.uploadToCloud(Media_Type.Document),
  uploadController.uploadMedia
);

export default router;
