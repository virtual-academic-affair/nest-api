import { ConfigService } from '@nestjs/config';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { EmailTemplateService } from './email-template.service';

export class InquiryTemplate extends EmailTemplateService {
  protected templatePath = 'inquiry.hbs';

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
    return {
      question: this.inquiry.question,
      answer: this.inquiry.answer,
    };
  }
}
