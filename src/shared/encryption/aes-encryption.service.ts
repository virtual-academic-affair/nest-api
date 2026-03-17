import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Injectable()
export class AesEncryptionService implements EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly defaultKey = 'dev-encryption-key-32-chars-long!!';

  private getHashedKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || this.defaultKey;
    return crypto.createHash('sha256').update(key).digest();
  }

  encrypt(text: string): string {
    const hashedKey = this.getHashedKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, hashedKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, content] = encryptedText.split(':');
    if (!ivHex || !content) {
      return encryptedText;
    }

    const hashedKey = this.getHashedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, hashedKey, iv);
    let decrypted = decipher.update(content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
