import cors from 'cors';
import express, { Request } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.clientUrl }));
app.use(express.json({ limit: '100kb' }));

if (config.env !== 'test') {
  morgan.token('path', (req: Request) => req.originalUrl.split('?')[0]);
  app.use(
    morgan(':method :path :status :response-time ms', {
      stream: { write: (line) => logger.info(line.trim()) },
    })
  );
}

app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
