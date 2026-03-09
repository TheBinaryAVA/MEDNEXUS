import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logging.level,
  ...(config.app.isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '[{requestId}] {msg}',
      },
    },
  }),
  base: {
    env: config.app.env,
    version: process.env.npm_package_version,
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});

export type Logger = typeof logger;
