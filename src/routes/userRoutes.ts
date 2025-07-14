import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as uploadMiddleware from '../middlewares/uploadMiddleware';
import * as userController from '../controllers/http/userController';

const router = express.Router();

router.use(authMiddleware.protect);

router
  .route('/update-me')
  .post(uploadMiddleware.uploadPhoto, uploadMiddleware.uploadToCloud, userController.updateMe);

export default router;
