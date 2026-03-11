import { ConfigService } from '@nestjs/config';
import { EmailTemplateService } from '@email/services/email-send/email-template.service';
import { Inquiry } from '@inquiry/entities/inquiry.entity';

export class InquiryTemplate extends EmailTemplateService {
  constructor(
    configService: ConfigService,
    private readonly inquiry: Inquiry,
  ) {
    super(configService);
  }

  protected getTitle(): string {
    return 'Phản hồi thắc mắc';
  }

  protected getTemplateData(): Record<string, unknown> {
    throwUnless(this.inquiry.answer, new Error('Inquiry answer is required to generate template data'));
    return { content: this.inquiry.answer ?? '' };
  }
}
