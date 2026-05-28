import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { Repository } from 'typeorm';
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import { Message } from '@email/entities/message.entity';
import { GmailApiService } from '@email/services/gmail-api.service';
import { MessagesService } from '@email/services/messages.service';
import { RABBIT_SERVICE } from '@shared/config/constants';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

export const INGESTED = 'ingested';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    @Inject(RABBIT_SERVICE) private readonly client: ClientProxy,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
    private readonly settingService: SettingService,
    private readonly gmailApiService: GmailApiService,
    private readonly messagesService: MessagesService,
  ) {}

  async ingestMessages(gmailMessageIds: string[]): Promise<void> {
    const superEmail = await this.settingService.get<SuperEmail>(SettingKey.EmailSuperEmail);
    throwUnless(superEmail?.email, new Error('Super email is not configured'));

    const gmail = await this.gmailApiService.getGmailClient();

    for (const gmailMessageId of gmailMessageIds) {
      try {
        await this.processSingleMessage(gmail, gmailMessageId, superEmail.email);
      } catch (error) {
        this.logger.warn(`Failed to ingest gmail message ${gmailMessageId}: ${error.message ?? error}`);
      }
    }
  }

  private async processSingleMessage(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    superEmail: string,
  ): Promise<number | null> {
    const isExisted = await this.messageRepository.exists({ where: { gmailMessageId } });
    if (isExisted) {
      return;
    }
    const { data: gmailMessage } = await gmail.users.messages.get({
      userId: 'me',
      id: gmailMessageId,
      format: 'full',
    });

    const parsedMessage = parseMessage(gmailMessage);
    const senderEmail = parsedMessage.headers.from?.match(/<(.+)>/)?.[1];
    const textContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    const plainTextContent = htmlToText(textContent, { wordwrap: false });

    const message = await this.messagesService.create({
      gmailMessageId,
      headerMessageId: parsedMessage.headers['message-id'],
      threadId: gmailMessage.threadId,
      subject: parsedMessage.headers.subject,
      labelIds: gmailMessage.labelIds ?? [],
      sentAt: parsedMessage.headers.date ? new Date(parsedMessage.headers.date) : undefined,
      senderEmail,
      senderName: parsedMessage.headers.from,
      superEmail,
      content: textContent,
    });

    this.client.emit(INGESTED, {
      messageId: message.id,
      threadId: message.threadId,
      gmailMessageId: message.gmailMessageId,
      subject: message.subject,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      content: plainTextContent,
      studentCode: message.studentCode,
      enrollmentYear: message.student?.enrollmentYear,
    });

    return message.id;
  }
}
