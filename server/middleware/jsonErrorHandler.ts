import { Request, Response, NextFunction } from 'express';

export function jsonErrorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
}
