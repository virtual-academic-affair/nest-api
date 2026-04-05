import { Column, Entity } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { CitationDto } from '@inquiry/dtos/inquiries/citation.dto';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';

@Entity()
export class Inquiry extends BelongsToMessage {
  @Column({ type: 'enum', enum: InquiryType, array: true, nullable: true })
  types: InquiryType[];

  @Column('text')
  question: string;

  @Column('text', { nullable: true })
  answer: string | null = null;

  @Column({ type: 'jsonb', nullable: true })
  citations: CitationDto[];
}
