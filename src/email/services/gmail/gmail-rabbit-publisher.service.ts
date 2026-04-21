import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBIT_SERVICE } from '@shared/config/constants';

export const INGESTED = 'ingested';

export type IngestedMessageEvent = {
  messageId: number;
  subject?: string;
  senderEmail?: string;
  senderName?: string;
  content: string;
};

@Injectable()
export class GmailRabbitPublisherService {
  constructor(@Inject(RABBIT_SERVICE) private readonly client: ClientProxy) {}

  async publishIngested(events: IngestedMessageEvent[]): Promise<void> {
    for (const event of events) {
      this.client.emit(INGESTED, event);
    }
  }
}
