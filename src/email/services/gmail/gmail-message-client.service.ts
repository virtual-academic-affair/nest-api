import { Injectable } from '@nestjs/common';
import { gmail_v1 } from 'googleapis';
import { GmailHistoryClientService } from './gmail-history-client.service';

const GMAIL_USER_ID = 'me';

@Injectable()
export class GmailMessageClientService {
  constructor(private readonly gmailHistoryClientService: GmailHistoryClientService) {}

  async listMessageIdsByLabel(labelId: string): Promise<string[]> {
    const gmail = await this.gmailHistoryClientService.getGmailClient();
    const ids: string[] = [];
    let pageToken: string | undefined;

    do {
      const { data } = await gmail.users.messages.list({
        userId: GMAIL_USER_ID,
        labelIds: [labelId],
        pageToken,
      });
      ids.push(...(data.messages?.map((message) => message.id).filter(Boolean) as string[]));
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return ids;
  }

  async getMessageById(id: string): Promise<gmail_v1.Schema$Message> {
    const gmail = await this.gmailHistoryClientService.getGmailClient();
    const { data } = await gmail.users.messages.get({
      userId: GMAIL_USER_ID,
      id,
      format: 'full',
    });
    return data;
  }

  async addLabel(messageId: string, labelId: string): Promise<void> {
    const gmail = await this.gmailHistoryClientService.getGmailClient();
    await gmail.users.messages.modify({
      userId: GMAIL_USER_ID,
      id: messageId,
      requestBody: { addLabelIds: [labelId] },
    });
  }
}
