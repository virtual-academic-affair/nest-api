import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '@authentication/authentication.module';
import { User } from '@authentication/entities/user.entity';
import { GmailWebhookController } from '@email/controllers/gmail-webhook.controller';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { LabelsController } from '@email/controllers/labels.controller';
import { MessagesController } from '@email/controllers/messages.controller';
import { Message } from '@email/entities/message.entity';
import { EmailReplyService } from '@email/services/email-send/email-reply.service';
import { EmailSendService } from '@email/services/email-send/email-send.service';
import { GmailChangeSyncService } from '@email/services/gmail/gmail-change-sync.service';
import { GmailRabbitPublisherService } from '@email/services/gmail/gmail-rabbit-publisher.service';
import { GmailWatchService } from '@email/services/gmail/gmail-watch.service';
import { GmailWebhookService } from '@email/services/gmail/gmail-webhook.service';
import { GmailApiService } from '@email/services/gmail-api.service';
import { GmailLabelIdsService } from '@email/services/gmail-label-ids.service';
import { GrantsService } from '@email/services/grants.service';
import { LabelsService } from '@email/services/labels.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import gmailWatchConfig from '@shared/config/gmail-watch.config';
import googleConfig from '@shared/config/google.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    ConfigModule.forFeature(googleConfig),
    ConfigModule.forFeature(gmailWatchConfig),
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [LabelsController, MessagesController, GmailWebhookController],
  providers: [
    GmailApiService,
    GmailChangeSyncService,
    GmailRabbitPublisherService,
    GmailLabelIdsService,
    GmailWebhookService,
    GmailWebhookGuard,
    GmailWatchService,
    LabelsService,
    GrantsService,
    EmailSendService,
    EmailReplyService,
    MessagesService,
    MessageLabelsService,
  ],
  exports: [
    MessagesService,
    GmailApiService,
    GmailWebhookService,
    EmailSendService,
    EmailReplyService,
    MessageLabelsService,
    GrantsService,
  ],
})
export class EmailModule {}
