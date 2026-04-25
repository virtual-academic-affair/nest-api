import { Injectable, Logger } from '@nestjs/common';
import { GmailApiService } from '@email/services/gmail-api.service';

export type LabelHistoryDelta = {
  addedMessageIds: string[];
  removedMessageIds: string[];
  latestHistoryId?: string;
};

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly gmailApiService: GmailApiService) {}

  async listLabelDelta(startHistoryId: string, parentLabelId: string): Promise<LabelHistoryDelta> {
    const gmail = await this.gmailApiService.getGmailClient();
    const added = new Set<string>();
    const removed = new Set<string>();
    let latestHistoryId: string | undefined = undefined;
    let pageToken: string | undefined;

    try {
      do {
        const { data } = await gmail.users.history.list({
          userId: 'me',
          startHistoryId,
          historyTypes: ['labelAdded', 'labelRemoved'],
          pageToken,
          maxResults: 500,
        });

        if (!data.history) {
          break;
        }

        latestHistoryId = data.historyId;

        for (const history of data.history) {
          history.labelsAdded?.forEach((item) => {
            if (item.message?.id && item.labelIds?.includes(parentLabelId)) {
              added.add(item.message.id);
              removed.delete(item.message.id);
            }
          });

          history.labelsRemoved?.forEach((item) => {
            if (item.message?.id && item.labelIds?.includes(parentLabelId)) {
              removed.add(item.message.id);
              added.delete(item.message.id);
            }
          });
        }

        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken);
    } catch (error: any) {
      // 404 Too Old HistoryId: https://developers.google.com/gmail/api/guides/sync#handling_expired_history_ids
      if (error?.code === 404) {
        this.logger.warn(`HistoryId ${startHistoryId} is expired or invalid. Full sync required.`);
        return { addedMessageIds: [], removedMessageIds: [] };
      }
      this.logger.error(`Error listing label delta: ${error.message}`);
      throw error;
    }

    return { addedMessageIds: Array.from(added), removedMessageIds: Array.from(removed), latestHistoryId };
  }
}
