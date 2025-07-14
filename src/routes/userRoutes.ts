import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as uploadMiddleware from '../middlewares/uploadMiddleware';
import * as userController from '../controllers/http/userController';
import { Media_Type } from '../enums/uploadEnums';

const router = express.Router();

router.use(authMiddleware.protect);

router
  .route('/update-me')
  .patch(
    uploadMiddleware.uploadMedia(Media_Type.Image),
    uploadMiddleware.uploadToCloud(Media_Type.Image),
    userController.updateMe
  );

export default router;
