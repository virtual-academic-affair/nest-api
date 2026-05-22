import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { gmail_v1 } from 'googleapis';
import { Repository } from 'typeorm';
import { GMAIL_ACTION_TRIGGERED_EVENT } from '@email/constants/gmail-log.constants';
import { Message } from '@email/entities/message.entity';
import { LabelLang } from '@email/enums/label.enum';
import { GmailApiService } from '@email/services/gmail-api.service';
import { LabelsDto } from '@shared/setting/dtos/email-labels.dto';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

export type LabelHistoryDelta = {
  addedMessageIds: string[];
  removedMessageIds: string[];
  latestHistoryId?: string;
};

type MessageContext = {
  from: string | null;
  to: string | null;
};

type OutboundReplyDetails = MessageContext & {
  threadId: string | null;
  isReply: boolean;
};

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly settingService: SettingService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  async listLabelDelta(
    startHistoryId: string,
    parentLabelId: string,
    accountEmail: string,
  ): Promise<LabelHistoryDelta> {
    const gmail = await this.gmailApiService.getGmailClient();
    const added = new Set<string>();
    const removed = new Set<string>();
    const messageContextCache = new Map<string, Promise<MessageContext>>();
    const outboundReplyCache = new Map<string, Promise<OutboundReplyDetails | null>>();
    const labelNameMap = await this.buildLabelNameMap(gmail, parentLabelId);
    let latestHistoryId: string | undefined = undefined;
    let pageToken: string | undefined;

    try {
      do {
        const { data } = await gmail.users.history.list({
          userId: 'me',
          startHistoryId,
          historyTypes: ['labelAdded', 'labelRemoved', 'messageAdded', 'messageDeleted'],
          pageToken,
          maxResults: 500,
        });

        this.logger.log(`Fetched history page. HistoryId: ${data.historyId}, Records: ${JSON.stringify(data)}`);

        latestHistoryId = data.historyId;
        if (!data.history) {
          break;
        }

        for (const history of data.history) {
          await this.emitOutboundReplyEvents(gmail, history.messagesAdded ?? [], accountEmail, outboundReplyCache);

          history.messagesAdded?.forEach((item) => {
            if (
              item.message?.id &&
              item.message?.labelIds?.includes(parentLabelId) &&
              !item.message?.labelIds?.includes('SENT')
            ) {
              added.add(item.message.id);
              removed.delete(item.message.id);
            }
          });

          await this.emitOutboundReplyEvents(gmail, history.labelsAdded ?? [], accountEmail, outboundReplyCache);

          history.labelsAdded?.forEach((item) => {
            if (
              item.message?.id &&
              item.labelIds?.includes(parentLabelId) &&
              !item.message?.labelIds?.includes('SENT')
            ) {
              added.add(item.message.id);
              removed.delete(item.message.id);
            }
          });

          await this.emitLabelEvents(
            gmail,
            history.labelsAdded ?? [],
            'added',
            parentLabelId,
            accountEmail,
            labelNameMap,
            messageContextCache,
          );

          history.labelsRemoved?.forEach((item) => {
            if (item.message?.id && item.labelIds?.includes(parentLabelId)) {
              removed.add(item.message.id);
              added.delete(item.message.id);
            }
          });

          await this.emitLabelEvents(
            gmail,
            history.labelsRemoved ?? [],
            'removed',
            parentLabelId,
            accountEmail,
            labelNameMap,
            messageContextCache,
          );

          history.messagesDeleted?.forEach((item) => {
            if (item.message?.id && item.message?.labelIds.includes(parentLabelId)) {
              removed.add(item.message.id);
              added.delete(item.message.id);
            }
          });

          await this.emitDeletedEvents(
            gmail,
            history.messagesDeleted ?? [],
            parentLabelId,
            accountEmail,
            messageContextCache,
          );
        }

        this.logger.log(
          `Page processed. Added: ${added.size}, Removed: ${removed.size}, LatestHistoryId: ${latestHistoryId}`,
        );

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

  private async emitLabelEvents(
    gmail: gmail_v1.Gmail,
    events: gmail_v1.Schema$HistoryLabelAdded[] | gmail_v1.Schema$HistoryLabelRemoved[],
    mode: 'added' | 'removed',
    parentLabelId: string,
    accountEmail: string,
    labelNameMap: Record<string, string>,
    cache: Map<string, Promise<MessageContext>>,
  ): Promise<void> {
    for (const event of events) {
      const gmailMessageId = event.message?.id;
      if (!gmailMessageId) {
        continue;
      }

      const labels = (event.labelIds ?? []).filter((labelId) => {
        if (labelId === 'SENT') {
          return false;
        }

        if (mode === 'added' && labelId === parentLabelId) {
          return false;
        }

        return true;
      });

      if (labels.length === 0) {
        continue;
      }

      const context = await this.getMessageContext(gmail, gmailMessageId, accountEmail, cache);
      for (const labelId of labels) {
        const { action, suppressDetailLink } = this.resolveAction(mode, labelId, parentLabelId, labelNameMap);
        this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
          accountEmail,
          action,
          status: 'success',
          from: context.from,
          to: context.to,
          gmailMessageId,
          suppressDetailLink,
          dedupeKey: this.buildDedupeKey(mode, gmailMessageId, labelId),
        });
      }
    }
  }

  private async emitOutboundReplyEvents(
    gmail: gmail_v1.Gmail,
    events: Array<gmail_v1.Schema$HistoryMessageAdded | gmail_v1.Schema$HistoryLabelAdded>,
    accountEmail: string,
    cache: Map<string, Promise<OutboundReplyDetails | null>>,
  ): Promise<void> {
    for (const event of events) {
      const gmailMessageId = event.message?.id;
      if (!gmailMessageId || !event.message?.labelIds?.includes('SENT')) {
        continue;
      }

      const details = await this.getOutboundReplyDetails(gmail, gmailMessageId, accountEmail, cache);
      if (!details?.isReply || !details.threadId) {
        continue;
      }

      const belongsToTrackedThread = await this.messageRepository.exists({ where: { threadId: details.threadId } });
      if (!belongsToTrackedThread) {
        continue;
      }

      this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
        accountEmail,
        action: 'Gửi phản hồi',
        status: 'success',
        from: details.from,
        to: details.to,
        gmailMessageId,
        dedupeKey: `outbound:reply:${gmailMessageId}`,
      });
    }
  }

  private async emitDeletedEvents(
    gmail: gmail_v1.Gmail,
    events: gmail_v1.Schema$HistoryMessageDeleted[],
    parentLabelId: string,
    accountEmail: string,
    cache: Map<string, Promise<MessageContext>>,
  ): Promise<void> {
    for (const event of events) {
      const gmailMessageId = event.message?.id;
      if (!gmailMessageId || !event.message?.labelIds?.includes(parentLabelId)) {
        continue;
      }

      const context = await this.getMessageContext(gmail, gmailMessageId, accountEmail, cache);
      this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
        accountEmail,
        action: 'Xóa email',
        status: 'success',
        from: context.from,
        to: context.to,
        gmailMessageId,
        suppressDetailLink: true,
        dedupeKey: `message:delete:${gmailMessageId}`,
      });
    }
  }

  private resolveAction(
    mode: 'added' | 'removed',
    labelId: string,
    parentLabelId: string,
    labelNameMap: Record<string, string>,
  ): { action: string; suppressDetailLink: boolean } {
    if (labelId === 'UNREAD') {
      return { action: mode === 'added' ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc', suppressDetailLink: false };
    }

    if (labelId === parentLabelId) {
      return { action: `Xóa nhãn: ${labelNameMap[labelId] ?? LabelLang.parent.name}`, suppressDetailLink: false };
    }

    const labelName = labelNameMap[labelId] ?? labelId;
    return {
      action: `${mode === 'added' ? 'Gắn nhãn' : 'Xóa nhãn'}: ${labelName}`,
      suppressDetailLink: false,
    };
  }

  private buildDedupeKey(mode: 'added' | 'removed', gmailMessageId: string, labelId: string): string {
    if (labelId === 'UNREAD') {
      return `message:${mode === 'added' ? 'unread' : 'read'}:${gmailMessageId}`;
    }

    return `label:${mode}:${gmailMessageId}:${labelId}`;
  }

  private async buildLabelNameMap(gmail: gmail_v1.Gmail, parentLabelId: string): Promise<Record<string, string>> {
    const storedLabels = (await this.settingService.get<LabelsDto>(SettingKey.EmailLabels)) ?? {};
    const { data } = await gmail.users.labels.list({ userId: 'me' });

    const map = Object.entries(storedLabels).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[value] = LabelLang[key]?.name ?? key;
      return acc;
    }, {});

    for (const label of data.labels ?? []) {
      if (label.id && label.name) {
        map[label.id] = label.name;
      }
    }

    map[parentLabelId] = LabelLang.parent.name;
    return map;
  }

  private async getMessageContext(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    accountEmail: string,
    cache: Map<string, Promise<MessageContext>>,
  ): Promise<MessageContext> {
    let contextPromise = cache.get(gmailMessageId);
    if (!contextPromise) {
      contextPromise = this.loadMessageContext(gmail, gmailMessageId, accountEmail);
      cache.set(gmailMessageId, contextPromise);
    }

    return await contextPromise;
  }

  private async loadMessageContext(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    accountEmail: string,
  ): Promise<MessageContext> {
    const message = await this.messageRepository.findOne({ where: { gmailMessageId } });
    if (message) {
      return {
        from: message.senderName ?? message.senderEmail ?? null,
        to: message.superEmail ?? accountEmail ?? null,
      };
    }

    try {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id: gmailMessageId,
        format: 'metadata',
        metadataHeaders: ['From', 'To'],
      });
      const headers = data.payload?.headers ?? [];
      const getHeader = (name: string) =>
        headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value;

      return {
        from: getHeader('From') ?? null,
        to: getHeader('To') ?? accountEmail ?? null,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to load message context for ${gmailMessageId}: ${error?.message ?? error}`);
      return { from: null, to: accountEmail ?? null };
    }
  }

  private async getOutboundReplyDetails(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    accountEmail: string,
    cache: Map<string, Promise<OutboundReplyDetails | null>>,
  ): Promise<OutboundReplyDetails | null> {
    let detailsPromise = cache.get(gmailMessageId);
    if (!detailsPromise) {
      detailsPromise = this.loadOutboundReplyDetails(gmail, gmailMessageId, accountEmail);
      cache.set(gmailMessageId, detailsPromise);
    }

    return await detailsPromise;
  }

  private async loadOutboundReplyDetails(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    accountEmail: string,
  ): Promise<OutboundReplyDetails | null> {
    try {
      const { data } = await gmail.users.messages.get({
        userId: 'me',
        id: gmailMessageId,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'In-Reply-To', 'References'],
      });
      const headers = data.payload?.headers ?? [];
      const getHeader = (name: string) =>
        headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value;

      return {
        from: getHeader('From') ?? accountEmail ?? null,
        to: getHeader('To') ?? null,
        threadId: data.threadId ?? null,
        isReply: !!(getHeader('In-Reply-To') || getHeader('References')),
      };
    } catch (error: any) {
      this.logger.warn(`Failed to load outbound reply details for ${gmailMessageId}: ${error?.message ?? error}`);
      return null;
    }
  }
}
