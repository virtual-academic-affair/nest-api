import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';
import { differenceInDays } from 'date-fns';
import { IsBooleanQuery } from '@shared/decorators/is-boolean-query.decorator';

export class StatsDto {
  @IsOptional()
  @IsDateString()
  from: string;

  @IsOptional()
  @IsDateString()
  @Transform(({ obj, value }) => {
    const diff = differenceInDays(new Date(value), new Date(obj.from));
    throwIf(diff < 1 || diff > 30, new BadRequestException('Date range must be 1-30 days'));
    return value;
  })
  to: string;

  @IsOptional()
  @IsBooleanQuery()
  isDetail?: boolean;
}
