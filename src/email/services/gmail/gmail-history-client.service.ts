import { Injectable, Logger } from '@nestjs/common';
import { gmail_v1 } from 'googleapis';
import { GmailApiService } from '@email/services/gmail-api.service';

const GMAIL_USER_ID = 'me';

export type LabelHistoryDelta = {
  addedMessageIds: string[];
  removedMessageIds: string[];
  latestHistoryId?: string;
};

@Injectable()
export class GmailHistoryClientService {
  private readonly logger = new Logger(GmailHistoryClientService.name);

  constructor(private readonly gmailApiService: GmailApiService) {}

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    return await this.gmailApiService.getGmailClient();
  }

  async listLabelDelta(startHistoryId: string, labelId: string): Promise<LabelHistoryDelta> {
    const gmail = await this.getGmailClient();
    const addedMessageIds = new Set<string>();
    const removedMessageIds = new Set<string>();
    let pageToken: string | undefined;
    let latestHistoryId: string | undefined;

    try {
      do {
        const { data } = await gmail.users.history.list({
          userId: GMAIL_USER_ID,
          startHistoryId,
          historyTypes: ['labelAdded', 'labelRemoved'],
          pageToken,
        });

        latestHistoryId = data.historyId ?? latestHistoryId;

        for (const history of data.history ?? []) {
          for (const added of history.labelsAdded ?? []) {
            if (added.message?.id && added.labelIds?.includes(labelId)) {
              addedMessageIds.add(added.message.id);
            }
          }

          for (const removed of history.labelsRemoved ?? []) {
            if (removed.message?.id && removed.labelIds?.includes(labelId)) {
              removedMessageIds.add(removed.message.id);
            }
          }
        }

        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken);
    } catch (error: any) {
      if (error?.code === 404) {
        this.logger.warn(`historyId too old/invalid, skipping diff from ${startHistoryId}`);
        return { addedMessageIds: [], removedMessageIds: [] };
      }
      throw error;
    }

    return {
      addedMessageIds: [...addedMessageIds],
      removedMessageIds: [...removedMessageIds],
      latestHistoryId,
    };
  }
}
