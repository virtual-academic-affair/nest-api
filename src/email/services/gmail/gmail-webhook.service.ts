import { Injectable } from '@nestjs/common';

export type PubSubPushPayload = {
  emailAddress?: string;
  historyId?: string | number;
};

@Injectable()
export class GmailWebhookService {
  parsePayload(payload: PubSubPushPayload): PubSubPushPayload {
    return {
      emailAddress: payload?.emailAddress,
      historyId: payload?.historyId,
    };
  }

  isSvSender(emailAddress?: string): boolean {
    if (!emailAddress?.includes('@')) {
      return false;
    }
    const domain = emailAddress.toLowerCase().split('@')[1];
    return !!domain && domain.includes('sv');
  }
}
