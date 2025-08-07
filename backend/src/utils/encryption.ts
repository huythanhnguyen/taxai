import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class EncryptionService {
  private static getEncryptionKey(): Buffer {
    const secret = process.env['JWT_SECRET'] || 'fallback-secret-key';
    return crypto.scryptSync(secret, 'salt', KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ALGORITHM, key);
      
      cipher.setAAD(Buffer.from('tax-filing-pwa'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const key = this.getEncryptionKey();
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipher(ALGORITHM, key);
      decipher.setAAD(Buffer.from('tax-filing-pwa'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(process.env['BCRYPT_ROUNDS'] || '12');
    return bcrypt.hash(password, rounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate salt for additional security
   */
  static generateSalt(): string {
    return crypto.randomBytes(SALT_LENGTH).toString('hex');
  }

  /**
   * Hash data with SHA-256
   */
  static hashSHA256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create HMAC signature
   */
  static createHMAC(data: string, secret?: string): string {
    const key = secret || process.env['JWT_SECRET'] || 'fallback-secret';
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Encrypt file data
   */
  static encryptFile(buffer: Buffer): { encrypted: Buffer; key: string; iv: string } {
    const key = crypto.randomBytes(KEY_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipher(ALGORITHM, key);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    
    return {
      encrypted,
      key: key.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  /**
   * Decrypt file data
   */
  static decryptFile(encryptedBuffer: Buffer, keyHex: string, ivHex: string): Buffer {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  }
} 