import { User } from '@authentication/entities/user.entity';
import { AllowedDomainsController } from '@email/controllers/allowed-domains.controller';
import { GrantsController } from '@email/controllers/grants.controller';
import { LabelsController } from '@email/controllers/labels.controller';
import { MessageLabelsController } from '@email/controllers/message-labels.controller';
import { MessagesController } from '@email/controllers/messages.controller';
import { Message } from '@email/entities/message.entity';
import { EmailSyncScheduler } from '@email/scheduler/email-sync.scheduler';
import { EmailSyncService } from '@email/services/email-sync.service';
import { GoogleapisService } from '@email/services/googleapis.service';
import { GrantsService } from '@email/services/grants.service';
import { LabelsService } from '@email/services/labels.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import googleConfig from '@shared/config/google.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    ConfigModule.forFeature(googleConfig),
  ],
  controllers: [
    AllowedDomainsController,
    GrantsController,
    LabelsController,
    MessagesController,
    MessageLabelsController,
  ],
  providers: [
    GoogleapisService,
    LabelsService,
    GrantsService,
    EmailSyncService,
    MessagesService,
    MessageLabelsService,
    EmailSyncScheduler,
  ],
  exports: [MessagesService],
})
export class EmailModule {}
