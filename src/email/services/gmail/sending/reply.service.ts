import { Injectable, Logger } from '@nestjs/common';
import * as parseMessage from 'gmail-api-parse-message';
import { Message } from '@email/entities/message.entity';
import { GmailApiService } from '@email/services/gmail-api.service';
import { compile } from '@email/templates/email-template.service';
import { GmailSendService } from './send.service';

@Injectable()
export class GmailReplyService {
  private readonly logger = new Logger(GmailReplyService.name);

  static instance: GmailReplyService;

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailSendService: GmailSendService,
  ) {
    GmailReplyService.instance = this;
  }

  async getContent(message: Message, newContent: string): Promise<string> {
    let originalContent = '';

    try {
      const gmail = await this.gmailApiService.getGmailClient();
      const { data } = await gmail.users.messages.get({ userId: 'me', id: message.gmailMessageId, format: 'full' });
      const parsedMessage = parseMessage(data);
      originalContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    } catch (error) {
      this.logger.error('Failed to fetch original content:', error);
    }

    const quotedInfo = `On ${message.sentAt
      .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      .replace(/,([^,]*)$/, '$1')} at ${message.sentAt
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      .replace(' ', ' ')} ${message.senderName.replace(/"/g, '')} <${message.senderEmail}> wrote:`;

    return compile('reply.hbs', { newContent, originalContent, quotedInfo });
  }

  getSubject(message: Message): string {
    const subject = message.subject?.trim() || '';
    return /^re:/i.test(subject) ? subject : `Re: ${subject}`.trim();
  }

  async reply(message: Message, content: string, senderName?: string): Promise<string> {
    throwUnless(message.senderEmail, new Error('Cannot reply: message does not have sender email'));
    throwUnless(message.threadId, new Error('Cannot reply: message does not have thread ID'));

    return this.gmailSendService.send({
      to: message.senderEmail,
      subject: this.getSubject(message),
      content: await this.getContent(message, content),
      senderName,
      threadId: message.threadId,
      messageId: message.headerMessageId,
    });
  }
}
