import { ConfigService } from '@nestjs/config';
import { EmailTemplateService } from '@email/services/email-send/email-template.service';
import { CitationDto } from '@inquiry/dtos/inquiries/citation.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';

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
      citations: (this.inquiry.citations ?? []).map((c: CitationDto) => ({
        displayName: c.displayName,
        url: `${this.config.appUrl}/user/documents?id=${encodeURIComponent(c.fileId)}&preview=true&text=${encodeURIComponent(c.text)}`,
      })),
    };
  }
}
