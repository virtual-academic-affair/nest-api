import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { gmail_v1 } from 'googleapis';
import { Role } from '@authentication/decorators/roles.decorator';
import { DomainsService } from '@authentication/services/domains.service';
import { LabelsService } from '@email/services/labels.service';
import gmailWatchConfig from '@shared/config/gmail-watch.config';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { GmailApiService } from '../../gmail-api.service';

@Injectable()
export class WatchService {
  private readonly logger = new Logger(WatchService.name);

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly domainsService: DomainsService,
    private readonly labelsService: LabelsService,
    private readonly settingService: SettingService,
    @Inject(gmailWatchConfig.KEY) private readonly watchConfiguration: ConfigType<typeof gmailWatchConfig>,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS) async refreshWatchBySchedule(): Promise<void> {
    try {
      await this.sync('schedule');
    } catch (error) {
      this.logger.warn(`Skip schedule watch sync: ${error.message || error}`);
    }
  }

  async sync(reason: 'grant' | 'schedule' | 'manual' = 'manual'): Promise<void> {
    const [gmail, parentLabelId, studentDomains] = await Promise.all([
      this.gmailApiService.getGmailClient(),
      this.labelsService.getId('parent', true),
      this.domainsService.getDomains(Role.Student),
    ]);

    if (reason !== 'schedule') {
      await this.syncDomainFilters(gmail, studentDomains, parentLabelId);
    }

    const { data } = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: this.watchConfiguration.topicName,
        labelIds: [parentLabelId],
        labelFilterAction: 'include',
      },
    });

    if (!data.historyId) {
      this.logger.warn(`Watch refreshed (${reason}) but missing historyId`);
      return;
    }

    await this.settingService.set(SettingKey.EmailGmailHistoryId, data.historyId);
    this.logger.log(`Watch refreshed (${reason}). historyId=${data.historyId}`);
  }

  private async syncDomainFilters(gmail: gmail_v1.Gmail, domains: string[], labelId: string): Promise<void> {
    await Promise.all(
      domains.map(async (domain) => {
        try {
          await gmail.users.settings.filters.create({
            userId: 'me',
            requestBody: { criteria: { from: `@${domain}` }, action: { addLabelIds: [labelId] } },
          });
        } catch (error: any) {
          // 409 Conflict: Filter already exists
          if (error?.code !== 409) {
            this.logger.warn(`Failed to create filter for domain ${domain}: ${error.message}`);
          }
        }
      }),
    );
  }
}
