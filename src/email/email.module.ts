import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Email } from './entities/email.entity';
import { User } from '@authentication/entities/user.entity';
import { GoogleapisService } from './services/googleapis.service';
import { LabelsService } from './services/labels.service';
import { GrantsService } from './services/grants.service';
import { EmailSyncScheduler } from './scheduler/email-sync.scheduler';
import { NlpLabeledConsumer } from './messaging/consumers/nlp-labeled.consumer';
import { EmailIngestedProducer } from './messaging/producers/email-ingested.producer';
import { GrantsController } from './controllers/grants.controller';
import { LabelsController } from './controllers/labels.controller';
import { MessagesController } from './controllers/messages.controller';
import { MessageLabelsController } from './controllers/message-labels.controller';
import { MessagesService } from './services/messages.service';
import { MessageLabelsService } from './services/message-labels.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Email, User]),
  ],
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
    NlpLabeledConsumer,
    EmailIngestedProducer,
    MessagesService,
    MessageLabelsService,
    EmailSyncScheduler,
  ],
  exports: [
    GoogleapisService,
    LabelsService,
    GrantsService,
    NlpLabeledConsumer,
    EmailIngestedProducer,
    MessagesService,
    MessageLabelsService,
  ],
})
export class EmailModule {}
