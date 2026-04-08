import { Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { Repository } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { EmailSyncState } from '@email/interfaces/email-sync-state.type';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { GoogleapisService } from '@email/services/googleapis.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { RABBIT_SERVICE } from '@shared/config/constants';
import googleConfig from '@shared/config/google.config';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { SocketGateway } from 'src/socket/socket.gateway';

export const INGESTED = 'ingested';

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    @Inject(RABBIT_SERVICE) private readonly client: ClientProxy,
    @Inject(googleConfig.KEY) private readonly googleConfiguration: ConfigType<typeof googleConfig>,
    private readonly googleapisService: GoogleapisService,
    private readonly messageLabelsService: MessageLabelsService,
    private readonly settingService: SettingService,
    private readonly socketGateway: SocketGateway,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  async run(): Promise<void> {
    const [allowedDomains, gmail, superEmail, canSaveContent, syncState] = await Promise.all([
      this.settingService.get<string[]>(SettingKey.EmailAllowedDomains),
      this.googleapisService.getGmailClient(),
      this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail),
      this.settingService.get<boolean>(SettingKey.EmailCanSaveContent),
      this.settingService.get<EmailSyncState>(SettingKey.EmailSyncState),
    ]);
    throwUnless(superEmail?.email, new NotFoundException('Super email is not configured'));

    const normalizedAllowedDomains = (allowedDomains ?? [])
      .map((domain) => domain.trim().toLowerCase())
      .filter(Boolean);
    const currentSyncState = syncState ?? { historyId: null, watchExpirationAt: null };

    let messageIds: string[] = [];
    let nextHistoryId = currentSyncState.historyId;
    let addedLabels: { gmailMessageId: string; labelIds: string[] }[] = [];
    let removedLabels: { gmailMessageId: string; labelIds: string[] }[] = [];
    if (nextHistoryId) {
      try {
        const history = await this.fetchMessageIdsFromHistory(gmail, nextHistoryId);
        messageIds = history.messageIds;
        addedLabels = history.addedLabels;
        removedLabels = history.removedLabels;
        nextHistoryId = history.historyId;
      } catch (error: any) {
        const status = error?.response?.status ?? error?.code ?? error?.status;
        if (![404, 410].includes(status)) {
          throw error;
        }

        this.logger.warn(`History ${nextHistoryId} expired, falling back to recent scan.`);
        nextHistoryId = null;
      }
    }

    if (!nextHistoryId) {
      messageIds = await this.fetchRecentMessageIds(gmail, normalizedAllowedDomains);
      const profile = await gmail.users.getProfile({ userId: 'me' });
      nextHistoryId = profile.data.historyId ?? null;
    }

    if (messageIds.length) {
      const ingestedIds = await this.processMessageIds(
        gmail,
        messageIds,
        superEmail.email,
        !!canSaveContent,
        normalizedAllowedDomains,
      );
      await this.socketGateway.emitMessageIngested(ingestedIds);
    }

    if (addedLabels.length || removedLabels.length) {
      await this.messageLabelsService.syncFromGmail(addedLabels, removedLabels);
    }

    await this.setSyncState({ ...currentSyncState, historyId: nextHistoryId });
  }

  async watch(force = false): Promise<EmailSyncState | void> {
    const [superEmail, syncState] = await Promise.all([
      this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail),
      this.settingService.get<EmailSyncState>(SettingKey.EmailSyncState),
    ]);

    if (!superEmail?.email) {
      if (force) {
        throw new NotFoundException('Super email is not configured');
      }
      return;
    }

    const expiresAt = new Date(syncState?.watchExpirationAt ?? 0).getTime();
    const isExpiringSoon = expiresAt - Date.now() <= 24 * 60 * 60 * 1000;

    if (!force && !isExpiringSoon) {
      return syncState;
    }

    const topicName = this.googleConfiguration.pubsubTopic;
    throwUnless(topicName, new UnauthorizedException('GOOGLE_PUBSUB_TOPIC is not configured'));

    const gmail = await this.googleapisService.getGmailClient();
    const { data } = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName,
        labelIds: ['INBOX'],
        labelFilterBehavior: 'INCLUDE',
      },
    });

    return this.setSyncState({
      historyId: data.historyId ?? syncState?.historyId ?? null,
      watchExpirationAt: data.expiration ? new Date(Number(data.expiration)).toISOString() : null,
    });
  }

  private async fetchMessageIdsFromHistory(
    gmail: gmail_v1.Gmail,
    startHistoryId: string,
  ): Promise<{
    messageIds: string[];
    historyId: string | null;
    addedLabels: { gmailMessageId: string; labelIds: string[] }[];
    removedLabels: { gmailMessageId: string; labelIds: string[] }[];
  }> {
    const messageIds = new Set<string>();
    const addedLabels = new Map<string, Set<string>>();
    const removedLabels = new Map<string, Set<string>>();
    let pageToken: string | undefined;
    let latestHistoryId: string | null = startHistoryId;

    do {
      const { data } = await gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        pageToken,
        historyTypes: ['messageAdded', 'labelAdded', 'labelRemoved'],
      });

      if (data.historyId) {
        latestHistoryId = data.historyId;
      }

      for (const history of data.history ?? []) {
        for (const added of history.messagesAdded ?? []) {
          const gmailMessageId = added.message?.id;
          gmailMessageId && messageIds.add(gmailMessageId);
        }

        for (const added of history.labelsAdded ?? []) {
          const gmailMessageId = added.message?.id;
          if (!gmailMessageId) {
            continue;
          }

          const labelIds = addedLabels.get(gmailMessageId) ?? new Set<string>();
          for (const labelId of added.labelIds ?? []) {
            labelId && labelIds.add(labelId);
          }
          labelIds.size && addedLabels.set(gmailMessageId, labelIds);
        }

        for (const removed of history.labelsRemoved ?? []) {
          const gmailMessageId = removed.message?.id;
          if (!gmailMessageId) {
            continue;
          }

          const labelIds = removedLabels.get(gmailMessageId) ?? new Set<string>();
          for (const labelId of removed.labelIds ?? []) {
            labelId && labelIds.add(labelId);
          }
          labelIds.size && removedLabels.set(gmailMessageId, labelIds);
        }
      }

      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return {
      messageIds: [...messageIds],
      historyId: latestHistoryId,
      addedLabels: [...addedLabels.entries()].map(([gmailMessageId, labelIds]) => ({
        gmailMessageId,
        labelIds: [...labelIds],
      })),
      removedLabels: [...removedLabels.entries()].map(([gmailMessageId, labelIds]) => ({
        gmailMessageId,
        labelIds: [...labelIds],
      })),
    };
  }

  private async fetchRecentMessageIds(gmail: gmail_v1.Gmail, allowedDomains: string[]): Promise<string[]> {
    const afterTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    const messageIds: string[] = [];
    const query = [
      `after:${afterTimestamp}`,
      '-from:me',
      allowedDomains.length ? `(${allowedDomains.map((domain) => `from:*@${domain}`).join(' OR ')})` : '',
    ]
      .filter(Boolean)
      .join(' ');
    let pageToken: string | undefined;

    do {
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        q: query,
        includeSpamTrash: false,
        pageToken,
      });

      messageIds.push(...(data.messages?.map((message) => message.id).filter(Boolean) ?? []));
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return messageIds;
  }

  private async processMessageIds(
    gmail: gmail_v1.Gmail,
    messageIds: string[],
    superEmail: string,
    canSaveContent: boolean,
    allowedDomains: string[],
  ): Promise<number[]> {
    const ingestedIds: number[] = [];

    for (const gmailMessageId of messageIds) {
      try {
        this.logger.log(`Processing message ${gmailMessageId}`);
        const messageId = await this.processAndPublishMessage(
          gmail,
          gmailMessageId,
          superEmail,
          canSaveContent,
          allowedDomains,
        );
        messageId && ingestedIds.push(messageId);
      } catch (error) {
        this.logger.warn(`Skip message ${gmailMessageId}`, error);
      }
    }

    return ingestedIds;
  }

  private async processAndPublishMessage(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    superEmail: string,
    canSaveContent: boolean,
    allowedDomains: string[],
  ): Promise<number | null> {
    const exists = await this.messageRepository.findOne({ where: { gmailMessageId }, select: ['id'] });
    if (exists) {
      return null;
    }

    const { data: gmailMessage } = await gmail.users.messages.get({
      userId: 'me',
      id: gmailMessageId,
      format: 'full',
    });

    const parsedMessage = parseMessage(gmailMessage);
    const rawFrom = parsedMessage.headers.from ?? '';
    const senderEmail =
      rawFrom
        .match(/<([^>]+)>/)?.[1]
        ?.trim()
        .toLowerCase() ?? rawFrom.trim().toLowerCase();

    const domain = senderEmail.split('@')[1] ?? '';
    if (!domain || !allowedDomains.includes(domain)) {
      return null;
    }

    const textContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    const plainTextContent = htmlToText(textContent, { wordwrap: false });

    const message = await this.messageRepository.save({
      gmailMessageId,
      headerMessageId: parsedMessage.headers['message-id'],
      threadId: gmailMessage.threadId,
      subject: parsedMessage.headers.subject,
      labelIds: gmailMessage.labelIds ?? [],
      sentAt: parsedMessage.headers.date ? new Date(parsedMessage.headers.date) : undefined,
      senderEmail,
      senderName: rawFrom,
      superEmail,
      content: canSaveContent ? plainTextContent : undefined,
    });

    this.client.emit(INGESTED, {
      messageId: message.id,
      subject: message.subject,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      content: plainTextContent,
    });

    return message.id;
  }

  private async setSyncState(syncState: EmailSyncState): Promise<EmailSyncState> {
    await this.settingService.set(SettingKey.EmailSyncState, syncState);
    return syncState;
  }
}
