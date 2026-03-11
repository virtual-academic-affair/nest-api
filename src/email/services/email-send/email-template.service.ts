import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';

export interface EmailTemplateConfig {
  appUrl: string;
  appName: string;
  emailLogoUrl: string;
}

export function compile(path: string, data: Record<string, unknown>): string {
  const templateFullPath = join(process.cwd(), 'dist/templates/email', path);
  const template = readFileSync(templateFullPath, 'utf-8');
  return Handlebars.compile(template)(data);
}

export abstract class EmailTemplateService {
  protected readonly config: EmailTemplateConfig;
  protected baseTemplatePath: string = 'base.hbs';
  protected templatePath: string | null = null;

  protected constructor(configService: ConfigService) {
    this.config = {
      appUrl: configService.get<string>('app.url'),
      appName: configService.get<string>('app.name'),
      emailLogoUrl: configService.get<string>('app.emailLogoUrl'),
    };
  }

  generate(): string {
    const templateData = this.getTemplateData();
    const content = this.templatePath ? compile(this.templatePath, templateData) : templateData?.content;

    return compile(this.baseTemplatePath, {
      title: this.getTitle(),
      content,
      ...this.config,
    });
  }

  protected abstract getTitle(): string;

  protected abstract getTemplateData(): Record<string, unknown>;
}
