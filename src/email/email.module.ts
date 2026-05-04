import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from '@authentication/authentication.module';
import { ClassRegistrationModule } from '@class-registration/class-registration.module';
import { User } from '@authentication/entities/user.entity';
import { LabelsController } from '@email/controllers/labels.controller';
import { MessagesController } from '@email/controllers/messages.controller';
import { WebhookController } from '@email/controllers/webhook.controller';
import { Message } from '@email/entities/message.entity';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { GmailLabelingService } from '@email/services/gmail/labeling/labeling.service';
import { GmailReplyService } from '@email/services/gmail/sending/reply.service';
import { GmailSendService } from '@email/services/gmail/sending/send.service';
import { HistoryService } from '@email/services/gmail/webhook/history.service';
import { IngestService } from '@email/services/gmail/webhook/ingest.service';
import { WatchService } from '@email/services/gmail/webhook/watch.service';
import { WebhookService } from '@email/services/gmail/webhook/webhook.service';
import { GmailApiService } from '@email/services/gmail-api.service';
import { LabelsService } from '@email/services/labels.service';
import { MessagesService } from '@email/services/messages.service';
import { InquiryModule } from '@inquiry/inquiry.module';
import gmailWatchConfig from '@shared/config/gmail-watch.config';
import googleConfig from '@shared/config/google.config';
import { SettingService } from '@shared/setting/services/setting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    ConfigModule.forFeature(googleConfig),
    ConfigModule.forFeature(gmailWatchConfig),
    forwardRef(() => AuthenticationModule),
    forwardRef(() => InquiryModule),
    forwardRef(() => ClassRegistrationModule),
  ],
  controllers: [LabelsController, MessagesController, WebhookController],
  providers: [
    GmailApiService,
    HistoryService,
    WebhookService,
    GmailWebhookGuard,
    WatchService,
    GmailLabelingService,
    LabelsService,
    GmailSendService,
    GmailReplyService,
    MessagesService,
    IngestService,
    SettingService,
  ],
  exports: [
    MessagesService,
    GmailApiService,
    LabelsService,
    WatchService,
    WebhookService,
    GmailSendService,
    GmailReplyService,
  ],
})
export class EmailModule {}
