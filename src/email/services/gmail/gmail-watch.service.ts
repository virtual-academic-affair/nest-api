import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import gmailWatchConfig from '@shared/config/gmail-watch.config';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { GmailApiService } from '../gmail-api.service';
import { GmailLabelIdsService } from '../gmail-label-ids.service';

const GMAIL_USER_ID = 'me';

@Injectable()
export class GmailWatchService {
  private readonly logger = new Logger(GmailWatchService.name);

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailLabelIdsService: GmailLabelIdsService,
    private readonly settingService: SettingService,
    @Inject(gmailWatchConfig.KEY)
    private readonly gmailWatchConfiguration: ConfigType<typeof gmailWatchConfig>,
  ) {}

  @Cron('0 */6 * * *')
  async refreshWatchBySchedule(): Promise<void> {
    try {
      await this.refreshWatch('schedule');
    } catch (error) {
      this.logger.warn(`Skip schedule watch refresh: ${toMessage(error)}`);
    }
  }

  async refreshWatch(reason: 'grant' | 'schedule' | 'manual' = 'manual'): Promise<void> {
    const topicName = this.gmailWatchConfiguration.topicName;
    throwUnless(topicName, new Error('GOOGLE_WATCH_TOPIC_NAME is required'));

    const gmail = await this.gmailApiService.getGmailClient();
    const vaaLabelId = await this.gmailLabelIdsService.ensureParentId();
    const { data } = await gmail.users.watch({
      userId: GMAIL_USER_ID,
      requestBody: {
        topicName,
        labelIds: [vaaLabelId],
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
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
