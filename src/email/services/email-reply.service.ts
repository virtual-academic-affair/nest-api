import { Injectable, Logger } from '@nestjs/common';
import * as parseMessage from 'gmail-api-parse-message';
import { Message } from '@email/entities/message.entity';
import { EmailSendService } from '@email/services/email-send.service';
import { GoogleapisService } from '@email/services/googleapis.service';

@Injectable()
export class EmailReplyService {
  private readonly logger = new Logger(EmailReplyService.name);
  static instance: EmailReplyService;

  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly emailSendService: EmailSendService,
  ) {
    EmailReplyService.instance = this;
  }

  async getContent(message: Message, newContent: string): Promise<string> {
    let originalContent = '';

    try {
      const gmail = await this.googleapisService.getGmailClient();
      const { data } = await gmail.users.messages.get({ userId: 'me', id: message.gmailMessageId, format: 'full' });
      const parsedMessage = parseMessage(data);
      originalContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    } catch (error) {
      this.logger.error('Failed to fetch original content:', error);
    }

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${newContent}
        <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
        <div style="color: #666; font-size: 12px;">
          <p>
            <strong>On ${message.sentAt?.toLocaleString()}, ${message.senderName || message.senderEmail} wrote:</strong>
          </p>
          <blockquote style="margin: 0; padding-left: 10px; border-left: 3px solid #ccc; color: #666;">
            ${originalContent}
          </blockquote>
        </div>
      </div>
    `.trim();
  }

  getSubject(message: Message): string {
    const subject = message.subject?.trim() || '';
    return /^re:/i.test(subject) ? subject : `Re: ${subject}`.trim();
  }

  async reply(message: Message, content: string, senderName?: string): Promise<string> {
    throwUnless(message.senderEmail, new Error('Cannot reply: message does not have sender email'));
    throwUnless(message.threadId, new Error('Cannot reply: message does not have thread ID'));

    return this.emailSendService.send({
      to: message.senderEmail,
      subject: this.getSubject(message),
      content: await this.getContent(message, content),
      senderName,
      threadId: message.threadId,
      messageId: message.headerMessageId,
    });
  }
}
