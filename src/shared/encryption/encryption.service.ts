import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class EncryptionService {
  abstract encrypt(text: string): string;

  abstract decrypt(encryptedText: string): string;
}

export class EncryptionManager {
  private static instance: EncryptionService;

  static setService(service: EncryptionService) {
    this.instance = service;
  }

  static getService(): EncryptionService {
    return this.instance;
  }
}
