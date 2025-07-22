import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as notificationController from '../controllers/http/notificationController';

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/').get(notificationController.getAllNotifications);
router.route('/unread-notifications-count').get(notificationController.getUnreadNotificationsCount);

export default router;
