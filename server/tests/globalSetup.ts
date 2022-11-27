import { execSync } from 'child_process';

import { TEST_DATABASE_URL } from './env';

export default function globalSetup(): void {
  const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, NODE_ENV: 'test' };
  execSync('npx sequelize-cli db:migrate:undo:all && npx sequelize-cli db:migrate', {
    env,
    stdio: 'ignore',
  });
}
