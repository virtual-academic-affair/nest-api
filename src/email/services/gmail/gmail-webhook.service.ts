import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { gmail_v1 } from 'googleapis';
import { EmailLabel } from '@email/enums/email-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { SocketGateway } from 'src/app/socket/socket.gateway';
import { GmailApiService } from './gmail-api.service';
import { GmailChangeSyncService, LabelChangeEvent } from './gmail-change-sync.service';
import { GmailRabbitPublisherService } from './gmail-rabbit-publisher.service';

type GmailPushPayload = {
  message?: {
    data?: string;
  };
};

type GmailPushData = {
  historyId?: string;
};

const WATCH_RENEW_INTERVAL_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class GmailWebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailWebhookService.name);
  private renewWatchTimer?: NodeJS.Timeout;

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailChangeSyncService: GmailChangeSyncService,
    private readonly gmailRabbitPublisherService: GmailRabbitPublisherService,
    private readonly settingService: SettingService,
    private readonly socketGateway: SocketGateway,
  ) {}

  onModuleInit(): void {
    this.setupAndWatch().catch((error: unknown) =>
      this.logger.warn(`Skip initial Gmail watch setup: ${error instanceof Error ? error.message : String(error)}`),
    );
    this.renewWatchTimer = setInterval(() => {
      this.setupAndWatch().catch((error: unknown) =>
        this.logger.warn(`Skip Gmail watch renewal: ${error instanceof Error ? error.message : String(error)}`),
      );
    }, WATCH_RENEW_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    this.renewWatchTimer && clearInterval(this.renewWatchTimer);
  }

  async setupAndWatch(): Promise<void> {
    const topicName = this.getWatchTopicName();
    if (!topicName) {
      this.logger.warn('Skip Gmail watch setup: missing GMAIL_WATCH_TOPIC_NAME');
      return;
    }

    const labelIds = await this.getWatchLabelIds();
    const gmail = await this.gmailApiService.getGmailClient();
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds,
        labelFilterAction: 'include',
      },
    });
    this.logger.log(`Gmail watch registered. historyId=${response.data.historyId}`);
    response.data.historyId && (await this.settingService.set(SettingKey.EmailGmailHistoryId, response.data.historyId));
  }

  async handleWebhook(payload: GmailPushPayload): Promise<void> {
    const data = this.parsePayload(payload);
    if (!data?.historyId) {
      this.logger.warn('Skip webhook without historyId');
      return;
    }

    const previousHistoryId = await this.settingService.get<string>(SettingKey.EmailGmailHistoryId);
    if (!previousHistoryId) {
      await this.settingService.set(SettingKey.EmailGmailHistoryId, data.historyId);
      return;
    }

    const gmail = await this.gmailApiService.getGmailClient();
    const { messageIds, labelChanges, latestHistoryId } = await this.fetchHistoryDiff(gmail, previousHistoryId);
    const { ingestedIds, ingestedEvents } = await this.gmailChangeSyncService.applyHistoryChanges(
      gmail,
      messageIds,
      labelChanges,
    );
    await this.gmailRabbitPublisherService.publishIngested(ingestedEvents);
    await this.socketGateway.emitMessageIngested(ingestedIds);
    await this.settingService.set(SettingKey.EmailGmailHistoryId, latestHistoryId ?? data.historyId);
  }

  private parsePayload(payload: GmailPushPayload): GmailPushData | null {
    const encoded = payload?.message?.data;
    if (!encoded) {
      return null;
    }

    try {
      return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8')) as GmailPushData;
    } catch {
      return null;
    }
  }

  private async fetchHistoryDiff(
    gmail: gmail_v1.Gmail,
    startHistoryId: string,
  ): Promise<{ messageIds: string[]; labelChanges: LabelChangeEvent[]; latestHistoryId?: string }> {
    let pageToken: string | undefined;
    let latestHistoryId: string | undefined;
    const messageIds = new Set<string>();
    const labelChanges: LabelChangeEvent[] = [];

    do {
      const { data } = await gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved'],
        pageToken,
      });

      latestHistoryId = data.historyId ?? latestHistoryId;
      for (const history of data.history ?? []) {
        for (const added of history.messagesAdded ?? []) {
          added.message?.id && messageIds.add(added.message.id);
        }

        for (const labelsAdded of history.labelsAdded ?? []) {
          if (!labelsAdded.message?.id) {
            continue;
          }

          labelChanges.push({
            gmailMessageId: labelsAdded.message.id,
            addLabelIds: labelsAdded.labelIds ?? [],
            removeLabelIds: [],
          });
        }

        for (const labelsRemoved of history.labelsRemoved ?? []) {
          if (!labelsRemoved.message?.id) {
            continue;
          }

          labelChanges.push({
            gmailMessageId: labelsRemoved.message.id,
            addLabelIds: [],
            removeLabelIds: labelsRemoved.labelIds ?? [],
          });
        }
      }
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return { messageIds: [...messageIds], labelChanges, latestHistoryId };
  }

  private getWatchTopicName(): string | null {
    const directTopicName = process.env.GMAIL_WATCH_TOPIC_NAME?.trim();
    if (directTopicName?.startsWith('projects/')) {
      return directTopicName;
    }

    const projectId = process.env.GMAIL_WATCH_PROJECT_ID?.trim();
    const topicName = directTopicName;
    if (!projectId || !topicName) {
      return null;
    }

    return `projects/${projectId}/topics/${topicName}`;
  }

  private async getWatchLabelIds(): Promise<string[]> {
    const configuredLabels = (await this.settingService.get<Record<EmailLabel, string>>(SettingKey.EmailLabels)) ?? {};
    const systemLabelIds = [
      configuredLabels[EmailLabel.ClassRegistration],
      configuredLabels[EmailLabel.Training],
      configuredLabels[EmailLabel.Graduation],
      configuredLabels[EmailLabel.Pending],
    ].filter((labelId): labelId is string => Boolean(labelId));

    return [...new Set([...systemLabelIds, 'INBOX'])];
  }
}
