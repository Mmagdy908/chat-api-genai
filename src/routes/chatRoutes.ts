import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as chatController from '../controllers/http/chatController';

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/').get(chatController.getAllUserChats);
router.route('/group').post(chatController.createGroup);

export default router;
