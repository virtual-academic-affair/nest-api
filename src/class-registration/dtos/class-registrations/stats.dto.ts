import { IsDateString } from 'class-validator';
import { CompareField } from '@shared/decorators/compare-field.decorator';

export class StatsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  @CompareField<StatsDto>('>=', 'from')
  to: string;
}
