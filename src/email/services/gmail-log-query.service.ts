import { access, readFile, readdir, rm, stat } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GmailLogFilesQueryDto } from '@email/dtos/logs/log-files-query.dto';
import { GmailStoredLogEntry } from '@email/types/gmail-log.types';

export type GmailLogFileSummary = {
  date: string;
  filename: string;
  entryCount: number;
  updatedAt: string;
};

export type GmailLogFilesPaginatedResult = {
  items: GmailLogFileSummary[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class GmailLogQueryService {
  private readonly logger = new Logger(GmailLogQueryService.name);
  private readonly logDirectory = join(process.cwd(), 'logs', 'gmail');

  async listFiles({ date, page = 1, limit = 20 }: GmailLogFilesQueryDto): Promise<GmailLogFilesPaginatedResult> {
    const currentPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);

    if (!(await this.exists(this.logDirectory))) {
      return {
        items: [],
        pagination: {
          total: 0,
          currentPage,
          limit: normalizedLimit,
          totalPages: 0,
        },
      };
    }

    const files = await readdir(this.logDirectory, { withFileTypes: true });
    const logFiles = files
      .filter((entry) => entry.isFile() && entry.name.endsWith('.log'))
      .map((entry) => entry.name)
      .filter((filename) => !date || filename.startsWith(date))
      .sort((a, b) => b.localeCompare(a));

    const total = logFiles.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / normalizedLimit);
    const offset = (currentPage - 1) * normalizedLimit;
    const pageFiles = logFiles.slice(offset, offset + normalizedLimit);

    const items = await Promise.all(
      pageFiles.map(async (filename) => {
        const filePath = join(this.logDirectory, filename);
        const [fileStat, content] = await Promise.all([stat(filePath), readFile(filePath, 'utf8')]);
        const entryCount = content
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean).length;

        return {
          date: filename.replace(/\.log$/i, ''),
          filename,
          entryCount,
          updatedAt: fileStat.mtime.toISOString(),
        };
      }),
    );

    return {
      items,
      pagination: {
        total,
        currentPage,
        limit: normalizedLimit,
        totalPages,
      },
    };
  }

  async getFile(date: string): Promise<GmailStoredLogEntry[]> {
    const filePath = this.resolveFilePath(date);
    if (!(await this.exists(filePath))) {
      throw new NotFoundException(`Log file not found for date ${date}`);
    }

    const content = await readFile(filePath, 'utf8');
    const entries: GmailStoredLogEntry[] = [];

    for (const [index, line] of content.split(/\r?\n/).entries()) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      try {
        const parsed = JSON.parse(trimmed) as GmailStoredLogEntry | { message?: GmailStoredLogEntry };
        const entry = this.normalizeEntry(parsed);
        entry && entries.push(entry);
      } catch (error: any) {
        this.logger.warn(`Skip malformed log line ${index + 1} in ${date}.log: ${error?.message ?? error}`);
      }
    }

    return entries;
  }

  async deleteFile(date: string): Promise<void> {
    const filePath = this.resolveFilePath(date);
    if (!(await this.exists(filePath))) {
      throw new NotFoundException(`Log file not found for date ${date}`);
    }

    await rm(filePath);
  }

  private resolveFilePath(date: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be in YYYY-MM-DD format');
    }

    return join(this.logDirectory, `${date}.log`);
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await access(path, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private normalizeEntry(value: unknown): GmailStoredLogEntry | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const source = 'message' in value && value.message && typeof value.message === 'object' ? value.message : value;
    if (!source || typeof source !== 'object') {
      return null;
    }

    const entry = source as Partial<GmailStoredLogEntry>;
    if (typeof entry.time !== 'string' || typeof entry.action !== 'string' || typeof entry.status !== 'string') {
      return null;
    }

    return {
      time: entry.time,
      accountEmail: entry.accountEmail ?? null,
      action: entry.action,
      status: entry.status as GmailStoredLogEntry['status'],
      from: entry.from ?? null,
      to: entry.to ?? null,
      detail: entry.detail ?? null,
      error: entry.error ?? null,
    };
  }
}
