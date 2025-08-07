import { 
  User, 
  CreateUserRequest, 
  LoginRequest, 
  LoginResponse, 
  UserRole,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '../types/user';
import { EncryptionService } from '../utils/encryption';
import { JWTService, TokenPayload } from '../utils/jwt';

// Mock database - In production, this would be replaced with actual database operations
class MockUserDatabase {
  private users: Map<string, User & { password: string }> = new Map();
  private emailVerificationTokens: Map<string, { email: string; expires: Date }> = new Map();
  private passwordResetTokens: Map<string, { email: string; expires: Date }> = new Map();

  async findByEmail(email: string): Promise<(User & { password: string }) | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  async create(userData: User & { password: string }): Promise<User> {
    this.users.set(userData.id, userData);
    const { password, ...userWithoutPassword } = userData;
    return userWithoutPassword;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates, updatedAt: new Date() };
      this.users.set(id, updatedUser);
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    }
    return null;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (user) {
      user.password = hashedPassword;
      user.updatedAt = new Date();
      this.users.set(id, user);
      return true;
    }
    return false;
  }

  storeEmailVerificationToken(token: string, email: string): void {
    this.emailVerificationTokens.set(token, {
      email,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  }

  getEmailVerificationToken(token: string): { email: string; expires: Date } | null {
    return this.emailVerificationTokens.get(token) || null;
  }

  removeEmailVerificationToken(token: string): void {
    this.emailVerificationTokens.delete(token);
  }

  storePasswordResetToken(token: string, email: string): void {
    this.passwordResetTokens.set(token, {
      email,
      expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
  }

  getPasswordResetToken(token: string): { email: string; expires: Date } | null {
    return this.passwordResetTokens.get(token) || null;
  }

  removePasswordResetToken(token: string): void {
    this.passwordResetTokens.delete(token);
  }
}

export class AuthService {
  private db = new MockUserDatabase();

  /**
   * Register a new user
   */
  async register(userData: CreateUserRequest): Promise<{ user: User; emailVerificationToken: string }> {
    // Check if user already exists
    const existingUser = await this.db.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await EncryptionService.hashPassword(userData.password);

    // Create user
    const userId = EncryptionService.generateSecureToken(16);
    const now = new Date();
    
    const newUser: User & { password: string } = {
      id: userId,
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || UserRole.INDIVIDUAL,
      isActive: true,
      isEmailVerified: false,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now
    };

    const user = await this.db.create(newUser);

    // Generate email verification token
    const emailVerificationToken = EncryptionService.generateSecureToken(32);
    this.db.storeEmailVerificationToken(emailVerificationToken, user.email);

    return { user, emailVerificationToken };
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    // Find user by email
    const user = await this.db.findByEmail(loginData.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await EncryptionService.comparePassword(
      loginData.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.db.update(user.id, { lastLogin: new Date() });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const tokens = JWTService.generateTokenPair(tokenPayload);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<User> {
    const tokenData = this.db.getEmailVerificationToken(request.token);
    if (!tokenData) {
      throw new Error('Invalid verification token');
    }

    if (tokenData.expires < new Date()) {
      this.db.removeEmailVerificationToken(request.token);
      throw new Error('Verification token has expired');
    }

    const user = await this.db.findByEmail(tokenData.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Update user as verified
    const updatedUser = await this.db.update(user.id, { isEmailVerified: true });
    if (!updatedUser) {
      throw new Error('Failed to verify email');
    }

    // Remove verification token
    this.db.removeEmailVerificationToken(request.token);

    return updatedUser;
  }

  /**
   * Request password reset
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<{ resetToken: string }> {
    const user = await this.db.findByEmail(request.email);
    if (!user) {
      // Don't reveal if email exists or not
      throw new Error('If the email exists, a reset link has been sent');
    }

    // Generate reset token
    const resetToken = EncryptionService.generateSecureToken(32);
    this.db.storePasswordResetToken(resetToken, user.email);

    return { resetToken };
  }

  /**
   * Reset password
   */
  async resetPassword(request: ResetPasswordRequest): Promise<User> {
    const tokenData = this.db.getPasswordResetToken(request.token);
    if (!tokenData) {
      throw new Error('Invalid reset token');
    }

    if (tokenData.expires < new Date()) {
      this.db.removePasswordResetToken(request.token);
      throw new Error('Reset token has expired');
    }

    const user = await this.db.findByEmail(tokenData.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash new password
    const hashedPassword = await EncryptionService.hashPassword(request.newPassword);

    // Update password
    const success = await this.db.updatePassword(user.id, hashedPassword);
    if (!success) {
      throw new Error('Failed to reset password');
    }

    // Remove reset token
    this.db.removePasswordResetToken(request.token);

    // Get updated user
    const updatedUser = await this.db.findById(user.id);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    return updatedUser;
  }

  /**
   * Change password (for authenticated users)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.db.findByEmail(''); // This needs to be fixed with proper user lookup
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await EncryptionService.comparePassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await EncryptionService.hashPassword(newPassword);

    // Update password
    return await this.db.updatePassword(userId, hashedPassword);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.db.findById(id);
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    return await this.db.update(id, updates);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: string): Promise<boolean> {
    const updatedUser = await this.db.update(id, { isActive: false });
    return updatedUser !== null;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const newAccessToken = JWTService.refreshAccessToken(refreshToken);
      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
} 