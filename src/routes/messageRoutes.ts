import express from 'express';
import * as messageController from '../controllers/http/messageController';

const router = express.Router({ mergeParams: true });

router.route('/').get(messageController.getAllMessages);
router.route('/unread-messages-count').get(messageController.getUnreadMessagesCount);

export default router;
