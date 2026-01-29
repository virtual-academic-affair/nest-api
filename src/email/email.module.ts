import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '@email/entities/message.entity';
import { User } from '@authentication/entities/user.entity';
import { GoogleapisService } from '@email/services/googleapis.service';
import { LabelsService } from '@email/services/labels.service';
import { GrantsService } from '@email/services/grants.service';
import { EmailSyncScheduler } from '@email/scheduler/email-sync.scheduler';
import { EmailSyncService } from '@email/services/email-sync.service';
import { GrantsController } from '@email/controllers/grants.controller';
import { LabelsController } from '@email/controllers/labels.controller';
import { MessagesController } from '@email/controllers/messages.controller';
import { MessageLabelsController } from '@email/controllers/message-labels.controller';
import { MessagesService } from '@email/services/messages.service';
import { MessageLabelsService } from '@email/services/message-labels.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Message, User])],
  controllers: [
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
