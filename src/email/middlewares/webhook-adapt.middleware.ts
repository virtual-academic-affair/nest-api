import { NextFunction, Request, Response } from 'express';

export function webhookAdaptMiddleware(request: Request, _response: Response, next: NextFunction): void {
  const path = (request.originalUrl ?? request.url ?? '').split('?')[0];
  if (/\/email\/webhook\/?$/.test(path) && !request.headers['content-type']) {
    request.headers['content-type'] = 'application/json';
  }

  next();
}
