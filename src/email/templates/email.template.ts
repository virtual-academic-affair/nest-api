import { ConfigService } from '@nestjs/config';
import { baseTemplate } from './email-base.template';

export interface EmailTemplateConfig {
  appUrl: string;
  appName: string;
  emailLogoUrl: string;
}

export abstract class EmailTemplate {
  protected readonly config: EmailTemplateConfig;

  protected constructor(configService: ConfigService) {
    this.config = {
      appUrl: configService.get<string>('app.url'),
      appName: configService.get<string>('app.name'),
      emailLogoUrl: configService.get<string>('app.emailLogoUrl'),
    };
  }

  protected getConfig(): EmailTemplateConfig {
    return this.config;
  }

  generate(): string {
    const config = this.getConfig();
    const title = this.getTitle();
    const content = this.getContent();
    console.log(title);
    return baseTemplate
      .replace(/{{TITLE}}/g, title)
      .replace(/{{CONTENT}}/g, content)
      .replace(/{{APP_URL}}/g, config.appUrl)
      .replace(/{{APP_NAME}}/g, config.appName)
      .replace(/{{EMAIL_LOGO_URL}}/g, config.emailLogoUrl)
      .replace(/{{YEAR}}/g, new Date().getFullYear().toString());
  }

  protected abstract getTitle(): string;

  protected abstract getContent(): string;
}
