import { CookieOptions } from 'express';

export const REFRESH_COOKIE = 'refresh_token';

const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  partitioned: true,
};

export function getRefreshCookieOptions(ttlSeconds: number): CookieOptions {
  return { ...BASE_COOKIE_OPTIONS, maxAge: ttlSeconds * 1000 };
}

export const getClearCookieOptions = (): CookieOptions => BASE_COOKIE_OPTIONS;
