import { ClsService } from 'nestjs-cls';

export class ClsServiceManager {
  private static clsService: ClsService;

  static setService(service: ClsService) {
    this.clsService = service;
  }

  static get<T>(key: string): T | null {
    return this.clsService?.get(key);
  }
}
