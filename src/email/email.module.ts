import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '@authentication/authentication.module';
import { User } from '@authentication/entities/user.entity';
import { LabelsController } from '@email/controllers/labels.controller';
import { MessagesController } from '@email/controllers/messages.controller';
import { WebhookController } from '@email/controllers/webhook.controller';
import { Message } from '@email/entities/message.entity';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { GmailChangeSyncService } from '@email/services/gmail/gmail-change-sync.service';
import { GmailHistoryClientService } from '@email/services/gmail/gmail-history-client.service';
import { GmailMessageClientService } from '@email/services/gmail/gmail-message-client.service';
import { GmailRabbitPublisherService } from '@email/services/gmail/gmail-rabbit-publisher.service';
import { GmailWatchService } from '@email/services/gmail/gmail-watch.service';
import { GmailWebhookService } from '@email/services/gmail/gmail-webhook.service';
import { GmailLabelingService } from '@email/services/gmail/labeling/labeling.service';
import { GmailReplyService } from '@email/services/gmail/sending/reply.service';
import { GmailSendService } from '@email/services/gmail/sending/send.service';
import { GmailApiService } from '@email/services/gmail-api.service';
import { GmailLabelIdsService } from '@email/services/gmail-label-ids.service';
import { LabelsService } from '@email/services/labels.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import { WebhookService } from '@email/services/webhook.service';
import gmailWatchConfig from '@shared/config/gmail-watch.config';
import googleConfig from '@shared/config/google.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    ConfigModule.forFeature(googleConfig),
    ConfigModule.forFeature(gmailWatchConfig),
    forwardRef(() => AuthenticationModule),
  ],
  controllers: [LabelsController, MessagesController, WebhookController],
  providers: [
    GmailApiService,
    GmailHistoryClientService,
    GmailMessageClientService,
    GmailChangeSyncService,
    GmailRabbitPublisherService,
    GmailLabelIdsService,
    GmailWebhookService,
    WebhookService,
    GmailWebhookGuard,
    GmailWatchService,
    GmailLabelingService,
    LabelsService,
    GmailSendService,
    GmailReplyService,
    MessagesService,
    MessageLabelsService,
  ],
  exports: [
    MessagesService,
    GmailApiService,
    GmailWatchService,
    WebhookService,
    GmailSendService,
    GmailReplyService,
    MessageLabelsService,
  ],
})
export class EmailModule {}
