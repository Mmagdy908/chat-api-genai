import express from 'express';
import * as authMiddleware from '../middlewares/authMiddleware';
import * as friendshipController from '../controllers/http/friendshipController';

const router = express.Router();

router.use(authMiddleware.protect);

router.route('/send').post(friendshipController.sendFriendRequest);
router.route('/respond').patch(friendshipController.respondToFriendRequest);

export default router;
