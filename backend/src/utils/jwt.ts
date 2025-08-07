import jwt from 'jsonwebtoken';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private static getAccessTokenSecret(): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return secret;
  }

  private static getRefreshTokenSecret(): string {
    const secret = process.env['JWT_REFRESH_SECRET'];
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    return secret;
  }

  private static getAccessTokenExpiry(): string {
    return process.env['JWT_EXPIRE'] || '15m';
  }

  private static getRefreshTokenExpiry(): string {
    return process.env['JWT_REFRESH_EXPIRE'] || '7d';
  }

  /**
   * Generate access token
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      this.getAccessTokenSecret(),
      {
        expiresIn: this.getAccessTokenExpiry(),
        issuer: 'tax-filing-pwa',
        audience: 'tax-filing-users'
      }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      this.getRefreshTokenSecret(),
      {
        expiresIn: this.getRefreshTokenExpiry(),
        issuer: 'tax-filing-pwa',
        audience: 'tax-filing-users'
      }
    );
  }

  /**
   * Generate both access and refresh tokens
   */
  static generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), {
        issuer: 'tax-filing-pwa',
        audience: 'tax-filing-users'
      }) as any;

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.getRefreshTokenSecret(), {
        issuer: 'tax-filing-pwa',
        audience: 'tax-filing-users'
      }) as any;

      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static refreshAccessToken(refreshToken: string): string {
    const payload = this.verifyRefreshToken(refreshToken);
    return this.generateAccessToken(payload);
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiration time
   */
  static getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(email: string): string {
    return jwt.sign(
      { email, type: 'password-reset' },
      this.getAccessTokenSecret(),
      {
        expiresIn: '1h',
        issuer: 'tax-filing-pwa',
        audience: 'tax-filing-users'
      }
    );
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string): { email: string } {
    try {
      const decoded = jwt.verify(token, this.getAccessTokenSecret(), {
        issuer: 'tax-filing-pwa',
        audience: 'tax-filing-users'
      }) as any;

      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      return { email: decoded.email };
    } catch (error) {
      throw new Error('Invalid password reset token');
    }
  }
} 