import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger as WinstonLogger } from 'winston';
import { GMAIL_ACTION_TRIGGERED_EVENT, GMAIL_AUDIT_LOGGER } from '@email/constants/gmail-log.constants';
import { GmailActionTriggeredEvent, GmailStoredLogEntry } from '@email/types/gmail-log.types';

@Injectable()
export class GmailLogListener {
  private readonly logger = new Logger(GmailLogListener.name);
  private readonly dedupeWindowMs = 5000;
  private readonly recentEvents = new Map<string, number>();

  constructor(@Inject(GMAIL_AUDIT_LOGGER) private readonly gmailAuditLogger: WinstonLogger) {}

  @OnEvent(GMAIL_ACTION_TRIGGERED_EVENT, { async: true })
  async handle(event: GmailActionTriggeredEvent): Promise<void> {
    try {
      if (this.isDuplicate(event)) {
        return;
      }

      (this.gmailAuditLogger as WinstonLogger & { write: (entry: Record<string, unknown>) => void }).write({
        level: 'info',
        ...this.normalize(event),
      });
    } catch (error: any) {
      this.logger.error(`Failed to write Gmail audit log: ${error?.message ?? error}`, error?.stack);
    }
  }

  private normalize(event: GmailActionTriggeredEvent): GmailStoredLogEntry {
    return {
      time: this.resolveTime(event.time),
      accountEmail: event.accountEmail ?? null,
      action: event.action ?? 'Unknown action',
      status: event.status ?? 'success',
      from: event.from ?? null,
      to: event.to ?? null,
      detail:
        event.detail ??
        (event.suppressDetailLink
          ? null
          : this.buildMessageLink(event.accountEmail, event.detailGmailMessageId ?? event.gmailMessageId)),
      error: event.error ?? null,
    };
  }

  private resolveTime(value?: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    return new Date().toISOString();
  }

  private buildMessageLink(accountEmail?: string | null, gmailMessageId?: string | null): string | null {
    if (!accountEmail || !gmailMessageId) {
      return null;
    }

    return `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(accountEmail)}#inbox/${gmailMessageId}`;
  }

  private isDuplicate(event: GmailActionTriggeredEvent): boolean {
    const dedupeKey = event.dedupeKey?.trim();
    if (!dedupeKey) {
      return false;
    }

    const now = Date.now();
    for (const [key, timestamp] of this.recentEvents) {
      if (now - timestamp > this.dedupeWindowMs) {
        this.recentEvents.delete(key);
      }
    }

    const previous = this.recentEvents.get(dedupeKey);
    if (previous && now - previous <= this.dedupeWindowMs) {
      return true;
    }

    this.recentEvents.set(dedupeKey, now);
    return false;
  }
}
