import { applyDecorators } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export function IsBooleanQuery() {
  return applyDecorators(
    Type(() => String),

    Transform(({ value }) => {
      if (value === 'true' || value === '1') {
        return true;
      }
      if (value === 'false' || value === '0') {
        return false;
      }
      return value;
    }),

    IsBoolean(),
  );
}
