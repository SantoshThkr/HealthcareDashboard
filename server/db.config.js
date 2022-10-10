require('dotenv').config();

const config = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  seederStorage: 'sequelize',
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
