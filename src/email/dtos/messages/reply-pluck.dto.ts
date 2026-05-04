import { PickType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { BelongsToMessageQueryDto } from '@email/dtos/messages/belongs-to-message.dto';

export const ReplyPluckEntity = {
  Inquiry: 'inquiry',
  ClassRegistration: 'classRegistration',
} as const;

export type ReplyPluckEntity = (typeof ReplyPluckEntity)[keyof typeof ReplyPluckEntity];

export class ReplyPluckDto extends PickType(BelongsToMessageQueryDto, ['sentFrom', 'sentTo'] as const) {
  @IsOptional()
  @IsEnum(ReplyPluckEntity, { each: true })
  entities?: ReplyPluckEntity[];
}
