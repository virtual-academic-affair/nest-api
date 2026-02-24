import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailSyncService } from '@email/services/email-sync.service';

@Injectable()
export class EmailSyncScheduler {
  private readonly logger = new Logger(EmailSyncScheduler.name);

  constructor(private readonly emailSyncService: EmailSyncService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  public async handleSyncJob() {
    this.logger.log('Email sync job started');

    try {
      await this.emailSyncService.run();
    } catch (error) {
      this.logger.error('Email sync job failed', error instanceof Error ? error.stack : String(error));
    } finally {
      this.logger.log('Email sync job finished');
    }
  }
}
