import { mkdirSync } from 'fs';
import { join } from 'path';
import { Provider } from '@nestjs/common';
import { createLogger, format } from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import { GMAIL_AUDIT_LOGGER } from '@email/constants/gmail-log.constants';

const stripLevel = format((info) => {
  delete info.level;
  return info;
});

export const gmailAuditLoggerProvider: Provider = {
  provide: GMAIL_AUDIT_LOGGER,
  useFactory: () => {
    const logDirectory = join(process.cwd(), 'logs', 'gmail');
    mkdirSync(logDirectory, { recursive: true });

    return createLogger({
      level: 'info',
      format: format.combine(
        stripLevel(),
        format.printf((info) => JSON.stringify(info)),
      ),
      transports: [
        new DailyRotateFile({
          dirname: logDirectory,
          filename: '%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          options: { flags: 'a', encoding: 'utf8' },
        }),
      ],
    });
  },
};
