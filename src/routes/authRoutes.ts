import express from 'express';
import * as authController from '../controllers/authController';
import * as authMiddleware from '../middlewares/authMiddleware';

const router = express.Router();

router.route('/register').post(authController.register);
router.route('/verify-email').post(authController.verifyEmail);
router.route('/login').post(authController.login);
router.route('/refresh-token').post(authController.refreshToken);
router.route('/change-password').post(authMiddleware.protect, authController.changePassword);
router.route('/forgot-password').post(authController.forgotPassword);
router.route('/reset-password').post(authController.resetPassword);

router.get('/hello', authMiddleware.protect, (req, res) => {
  res.status(200).send('Hello from protect');
});
export default router;
