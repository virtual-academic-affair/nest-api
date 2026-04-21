import { CompareField } from '@shared/decorators/compare-field.decorator';
import { IsDateString } from 'class-validator';

export class StatsQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  @CompareField<StatsQueryDto>('from', '>=')
  to: string;
}
