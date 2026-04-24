import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GmailApiService } from '@email/services/gmail-api.service';

@Injectable()
export class GmailLabelingService {
  constructor(private readonly gmailApiService: GmailApiService) {}

  async list() {
    const gmail = await this.gmailApiService.getGmailClient();
    const { data } = await gmail.users.labels.list({ userId: 'me' });
    return (data.labels ?? [])
      .filter((label) => label.type !== 'system')
      .map((label) => ({ label: label.name, value: label.id }));
  }

  async create({ name, color }: { name: string; color: string }): Promise<string> {
    const gmail = await this.gmailApiService.getGmailClient();

    try {
      const { data } = await gmail.users.labels.create({
        userId: 'me',
        requestBody: { name, color: { textColor: '#ffffff', backgroundColor: color } },
      });

      return data.id;
    } catch (error: any) {
      if (error?.status === 409 || error?.code === 409) {
        const labels = await this.list();
        const existing = labels.find((label) => label.label === name);
        if (existing) {
          return existing.value;
        }
      }

      throw new InternalServerErrorException(`Failed to create or find label: ${name}. Error: ${error?.message}`);
    }
  }

  async label(gmailMessageId: string, toAdds: string[], toRemoves: string[]): Promise<void> {
    if (toAdds.length === 0 && toRemoves.length === 0) {
      return;
    }

    const gmail = await this.gmailApiService.getGmailClient();
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: { addLabelIds: toAdds, removeLabelIds: toRemoves },
    });
  }
}
