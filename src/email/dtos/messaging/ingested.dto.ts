import { NlpDto } from '@email/dtos/messaging/nlp.dto';

export class IngestedDto extends NlpDto {
  subject?: string;
  senderEmail?: string;
  senderName?: string;
  content: string;
}
