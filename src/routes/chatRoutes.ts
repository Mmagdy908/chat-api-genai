import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as chatMiddleware from '../middlewares/chatMiddleware';
import * as chatController from '../controllers/http/chatController';
import messageRouter from './messageRoutes';

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/').get(chatController.getAllUserChats);
router.route('/group').post(chatController.createGroup);

router.use('/:chatId/messages', chatMiddleware.isChatMember, messageRouter);

router
  .route('/:chatId/members')
  .post(chatMiddleware.isGroupChatAdmin, chatController.addGroupMember);
router.route('/:chatId/admins').post(chatMiddleware.isGroupChatAdmin, chatController.addGroupAdmin);
router
  .route('/:chatId/admins/:adminId')
  .delete(chatMiddleware.isGroupChatAdmin, chatController.removeGroupAdmin);

export default router;
