import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { 
  CreateUserRequest, 
  LoginRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  VerifyEmailRequest 
} from '../types/user';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  private authService = new AuthService();

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const userData: CreateUserRequest = req.body;
      const result = await this.authService.register(userData);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          message: 'User registered successfully. Please check your email to verify your account.',
          emailVerificationToken: result.emailVerificationToken // In production, this would be sent via email
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const loginData: LoginRequest = req.body;
      const result = await this.authService.login(loginData);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
          message: 'Login successful'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        data: {
          message: 'Logout successful'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' }
        });
        return;
      }

      const user = await this.authService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify email address
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body as VerifyEmailRequest;
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: { message: 'Verification token is required' }
        });
        return;
      }

      const user = await this.authService.verifyEmail({ token });

      res.status(200).json({
        success: true,
        data: {
          user,
          message: 'Email verified successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request password reset
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const { email }: ForgotPasswordRequest = req.body;
      const result = await this.authService.forgotPassword({ email });

      res.status(200).json({
        success: true,
        data: {
          message: 'If the email exists, a reset link has been sent',
          resetToken: result.resetToken // In production, this would be sent via email
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reset password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
        return;
      }

      const resetData: ResetPasswordRequest = req.body;
      const user = await this.authService.resetPassword(resetData);

      res.status(200).json({
        success: true,
        data: {
          user,
          message: 'Password reset successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password (for authenticated users)
   */
  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' }
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: { message: 'Current password and new password are required' }
        });
        return;
      }

      const success = await this.authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      if (!success) {
        res.status(400).json({
          success: false,
          error: { message: 'Failed to change password' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          message: 'Password changed successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { message: 'Refresh token not provided' }
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          message: 'Token refreshed successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  };
} 