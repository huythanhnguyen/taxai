import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { auditAuthOperation } from '../middleware/auditLog';

const router = Router();
const authController = new AuthController();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('role').optional().isIn(['individual', 'business', 'consultant']).withMessage('Invalid role'),
  auditAuthOperation('REGISTER')
], authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required'),
  auditAuthOperation('LOGIN')
], authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', [
  authenticateToken,
  auditAuthOperation('LOGOUT')
], authController.logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', [
  authenticateToken,
  auditAuthOperation('GET_CURRENT_USER')
], authController.getCurrentUser);

// @route   POST /api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post('/verify-email', [
  body('token').exists().withMessage('Verification token is required'),
  auditAuthOperation('VERIFY_EMAIL')
], authController.verifyEmail);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  auditAuthOperation('FORGOT_PASSWORD')
], authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', [
  body('token').exists().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  auditAuthOperation('RESET_PASSWORD')
], authController.resetPassword);

// @route   POST /api/auth/change-password
// @desc    Change password (for authenticated users)
// @access  Private
router.post('/change-password', [
  authenticateToken,
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  auditAuthOperation('CHANGE_PASSWORD')
], authController.changePassword);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public (requires refresh token in cookie)
router.post('/refresh-token', [
  auditAuthOperation('REFRESH_TOKEN')
], authController.refreshToken);

export default router; 