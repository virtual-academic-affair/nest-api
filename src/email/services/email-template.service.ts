import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

export interface EmailTemplateConfig {
  appUrl: string;
  appName: string;
  emailLogoUrl: string;
}

export abstract class EmailTemplate {
  private baseTemplate: string;
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

  protected getBaseTemplate(): string {
    if (!this.baseTemplate) {
      this.baseTemplate = readFileSync(join(process.cwd(), 'public', 'email-base.template.html'), 'utf-8');
    }
    return this.baseTemplate;
  }

  protected getIcon(name: string): string {
    return `<span class="material-icons text-[12px] align-middle mr-1">${name}</span>`;
  }

  generate(): string {
    const config = this.getConfig();
    const title = this.getTitle();
    const content = this.getContent();
    console.log(title);
    return this.getBaseTemplate()
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
