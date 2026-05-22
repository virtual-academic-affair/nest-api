export type GmailLogStatus = 'success' | 'failed';

export type GmailStoredLogEntry = {
  time: string;
  accountEmail: string | null;
  action: string;
  status: GmailLogStatus;
  from: string | null;
  to: string | null;
  detail: string | null;
  error: string | null;
};

export type GmailActionTriggeredEvent = Partial<GmailStoredLogEntry> & {
  time?: string | Date;
  gmailMessageId?: string | null;
  detailGmailMessageId?: string | null;
  threadId?: string | null;
  suppressDetailLink?: boolean;
  dedupeKey?: string | null;
};
