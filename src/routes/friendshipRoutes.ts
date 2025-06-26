import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as friendshipController from '../controllers/friendshipController';

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/').post(friendshipController.sendFriendRequest);

export default router;
