import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';

export async function validateDto<T>(DtoClass: new () => T, data: any, forbidNonWhitelisted = false): Promise<T> {
  const dto = plainToInstance(DtoClass, data, { enableImplicitConversion: true });

  try {
    await validateOrReject(dto as object, { whitelist: true, forbidNonWhitelisted });
  } catch (errors) {
    const messages = errors.map((err: { constraints: any }) => Object.values(err.constraints ?? {})).flat();
    throwIf(messages.length > 0, new BadRequestException(messages));
  }

  return dto;
}
