import { CompareField } from '@shared/decorators/compare-field.decorator';
import { IsDateString } from 'class-validator';

export class StatsDto {
  @IsDateString()
  from: string;

  @IsDateString()
  @CompareField<StatsDto>('>=', 'from')
  to: string;
}
