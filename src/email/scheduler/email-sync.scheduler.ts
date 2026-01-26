import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailIngestedProducer } from '../messaging/producers/email-ingested.producer';

@Injectable()
export class EmailSyncScheduler {
  private readonly logger = new Logger(EmailSyncScheduler.name);

  constructor(private readonly emailIngestedProducer: EmailIngestedProducer) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  public async handleSyncJob() {
    this.logger.log('Email sync job started');

    try {
      await this.emailIngestedProducer.sync();
    } catch (error) {
      this.logger.error(
        'Email sync job failed',
        error instanceof Error ? error.stack : String(error)
      );
    } finally {
      this.logger.log('Email sync job finished');
    }
  }
}
