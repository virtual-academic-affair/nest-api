import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleGmailGuard extends AuthGuard('google-gmail') {
  getAuthenticateOptions() {
    return {
      accessType: 'offline',
      prompt: 'consent',
      includeGrantedScopes: false,
    };
  }
}
