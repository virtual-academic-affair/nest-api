import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export abstract class EncryptionService implements OnModuleInit {
  abstract encrypt(text: string): string;

  abstract decrypt(encryptedText: string): string;

  onModuleInit() {
    EncryptionManager.setService(this);
  }
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
