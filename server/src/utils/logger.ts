import winston from 'winston';

import { config } from '../config';

const format =
  config.env === 'production'
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level} ${message}`)
      );

export const logger = winston.createLogger({
  level: config.logLevel,
  format,
  transports: [new winston.transports.Console()],
  silent: config.env === 'test',
});
