process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgres://healthcare:healthcare@localhost:5432/healthcare_dashboard_test';
process.env.JWT_SECRET = 'test-secret';
