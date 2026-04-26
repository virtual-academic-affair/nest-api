import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleGmailGuard extends AuthGuard('google-gmail') {
  getAuthenticateOptions(context: ExecutionContext) {
    return {
      accessType: 'offline',
      prompt: 'consent',
      includeGrantedScopes: false,
      state: context.switchToHttp().getRequest().query.state,
    };
  }
}
