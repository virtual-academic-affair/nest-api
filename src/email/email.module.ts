import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { User } from '@authentication/entities/user.entity';
import { GoogleapisService } from './services/googleapis.service';
import { LabelsService } from './services/labels.service';
import { GrantsService } from './services/grants.service';
import { EmailSyncScheduler } from './scheduler/email-sync.scheduler';
import { EmailSyncService } from './services/email-sync.service';
import { GrantsController } from './controllers/grants.controller';
import { LabelsController } from './controllers/labels.controller';
import { MessagesController } from './controllers/messages.controller';
import { MessageLabelsController } from './controllers/message-labels.controller';
import { MessagesService } from './services/messages.service';
import { MessageLabelsService } from './services/message-labels.service';

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
