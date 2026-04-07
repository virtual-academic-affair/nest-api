import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailSyncService } from '@email/services/email-send/email-sync.service';

@Injectable()
export class EmailSyncScheduler {
  private readonly logger = new Logger(EmailSyncScheduler.name);

  constructor(private readonly emailSyncService: EmailSyncService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  public async handleSyncJob() {
    this.logger.log('Email watch job started');

    try {
      await this.emailSyncService.watch();
    } catch (error) {
      this.logger.error('Email watch job failed', error instanceof Error ? error.stack : String(error));
    } finally {
      this.logger.log('Email watch job finished');
    }
  }
}
