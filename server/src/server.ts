import app from './app';
import { config } from './config';
import { sequelize } from './config/database';
import { logger } from './utils/logger';

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');
  } catch (err) {
    logger.error(`Unable to connect to the database: ${(err as Error).message}`);
    process.exit(1);
  }

  app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port} (${config.env})`);
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason instanceof Error ? reason.stack : reason}`);
});

start();
