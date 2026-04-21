import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { gmail_v1 } from 'googleapis';
import { EmailLabel } from '@email/enums/email-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
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
const GMAIL_USER_ID = 'me';

@Injectable()
export class GmailWebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailWebhookService.name);
  private renewWatchTimer?: NodeJS.Timeout;

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailChangeSyncService: GmailChangeSyncService,
    private readonly gmailRabbitPublisherService: GmailRabbitPublisherService,
    private readonly settingService: SettingService,
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
    const topicName = this.resolveWatchTopicName();
    if (!topicName) return;

    const gmail = await this.gmailApiService.getGmailClient();
    const labelIds = await this.getWatchLabelIds();
    const { data } = await gmail.users.watch({
      userId: GMAIL_USER_ID,
      requestBody: { topicName, labelIds, labelFilterAction: 'include' },
    });

    if (!data.historyId) {
      this.logger.warn('Gmail watch registered but missing historyId');
      return;
    }

    this.logger.log(`Gmail watch registered. historyId=${data.historyId}`);
    await this.settingService.set(SettingKey.EmailGmailHistoryId, data.historyId);
  }

  async handleWebhook(payload: GmailPushPayload): Promise<void> {
    const pushData = this.decodePushData(payload);
    const incomingHistoryId = pushData?.historyId;
    if (!incomingHistoryId) return;

    const previousHistoryId = await this.settingService.get<string>(SettingKey.EmailGmailHistoryId);
    if (!previousHistoryId) {
      await this.settingService.set(SettingKey.EmailGmailHistoryId, incomingHistoryId);
      return;
    }

    const gmail = await this.gmailApiService.getGmailClient();
    const { messageIds, labelChanges, latestHistoryId } = await this.diffHistoryFrom(gmail, previousHistoryId);

    const { ingestedEvents } = await this.gmailChangeSyncService.applyHistoryChanges(gmail, messageIds, labelChanges);
    await this.gmailRabbitPublisherService.publishIngested(ingestedEvents);

    await this.settingService.set(SettingKey.EmailGmailHistoryId, latestHistoryId ?? incomingHistoryId);
  }

  private decodePushData(payload: GmailPushPayload): GmailPushData | null {
    const encoded = payload?.message?.data?.trim();
    if (!encoded) {
      this.logger.warn('Skip webhook: missing message.data');
      return null;
    }

    try {
      const json = Buffer.from(encoded, 'base64').toString('utf-8');
      return JSON.parse(json) as GmailPushData;
    } catch (error) {
      this.logger.warn(`Skip webhook: invalid message.data (${error instanceof Error ? error.message : String(error)})`);
      return null;
    }
  }

  private async diffHistoryFrom(
    gmail: gmail_v1.Gmail,
    startHistoryId: string,
  ): Promise<{ messageIds: string[]; labelChanges: LabelChangeEvent[]; latestHistoryId?: string }> {
    let pageToken: string | undefined;
    let latestHistoryId: string | undefined;
    const messageIds = new Set<string>();
    const labelChanges: LabelChangeEvent[] = [];

    try {
      do {
        const { data } = await gmail.users.history.list({
          userId: GMAIL_USER_ID,
          startHistoryId,
          historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved'],
          pageToken,
        });

        latestHistoryId = data.historyId ?? latestHistoryId;
        for (const history of data.history ?? []) {
          for (const added of history.messagesAdded ?? []) {
            if (added.message?.id) messageIds.add(added.message.id);
          }

          for (const labelsAdded of history.labelsAdded ?? []) {
            const id = labelsAdded.message?.id;
            if (!id) continue;
            labelChanges.push({ gmailMessageId: id, addLabelIds: labelsAdded.labelIds ?? [], removeLabelIds: [] });
          }

          for (const labelsRemoved of history.labelsRemoved ?? []) {
            const id = labelsRemoved.message?.id;
            if (!id) continue;
            labelChanges.push({ gmailMessageId: id, addLabelIds: [], removeLabelIds: labelsRemoved.labelIds ?? [] });
          }
        }

        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken);
    } catch (error: any) {
      const status = typeof error?.code === 'number' ? error.code : undefined;
      if (status === 404) {
        this.logger.warn(`Gmail historyId is too old/invalid, skipping diff from ${startHistoryId}`);
        return { messageIds: [], labelChanges: [], latestHistoryId: undefined };
      }
      throw error;
    }

    return { messageIds: [...messageIds], labelChanges, latestHistoryId };
  }

  private resolveWatchTopicName(): string | null {
    const topic = process.env.GMAIL_WATCH_TOPIC_NAME?.trim();
    if (!topic) {
      this.logger.warn('Skip Gmail watch setup: missing GMAIL_WATCH_TOPIC_NAME');
      return null;
    }
    if (topic.startsWith('projects/')) return topic;

    const projectId = process.env.GMAIL_WATCH_PROJECT_ID?.trim();
    if (!projectId) {
      this.logger.warn('Skip Gmail watch setup: missing GMAIL_WATCH_PROJECT_ID');
      return null;
    }

    return `projects/${projectId}/topics/${topic}`;
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
