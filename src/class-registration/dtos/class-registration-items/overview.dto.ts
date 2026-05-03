import { PickType } from '@nestjs/mapped-types';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { BelongsToMessageQueryDto } from '@email/dtos/messages/belongs-to-message.dto';

export class OverviewQueryDto extends PickType(BelongsToMessageQueryDto, [
  'messageStatuses',
  'sentFrom',
  'sentTo',
] as const) {}

export interface OverviewClassBucket {
  className: string | null;
  byStatus: Record<RegistrationStatus, number>;
  byAction: Record<RegistrationAction, number>;
}

export interface OverviewSubjectGroup {
  subjectName: string;
  subjectCode: string | null;
  classes: OverviewClassBucket[];
}
