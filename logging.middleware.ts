import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import pinoHttp from 'pino-http';
import { logger } from '../config/logger';

// Attach a unique request ID to every request
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) ?? uuid();
  (req as Request & { requestId: string }).requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

// HTTP request logger using pino-http
export const httpLogger = pinoHttp({
  logger,
  // Assign request ID to pino child logger
  genReqId: (req) => (req as Request & { requestId?: string }).requestId ?? uuid(),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (_req, _res, err) => `Request failed: ${err.message}`,
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        // Attach user id when available
        userId: (req.raw as Request & { user?: { id: string } }).user?.id,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
        responseTime: res.responseTime,
      };
    },
  },
  // Log format example:
  // {"level":"info","time":"12:34:56.789","requestId":"abc-123",
  //  "req":{"id":"abc-123","method":"GET","url":"/api/v1/posts","userId":"u-1"},
  //  "res":{"statusCode":200,"responseTime":42},"msg":"GET /api/v1/posts 200"}
});
