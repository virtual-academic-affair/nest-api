import { SetMetadata } from '@nestjs/common';

export enum AuthType {
  Jwt = 'jwt',
  Grpc = 'grpc',
}

export const AUTHS_KEY = 'auths';
export const Auth = (...types: AuthType[]) => SetMetadata(AUTHS_KEY, types.length ? types : [AuthType.Jwt]);

export const Public = () => SetMetadata(AUTHS_KEY, []);
