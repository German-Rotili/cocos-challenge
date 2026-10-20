import { config } from 'dotenv';

config({ path: '.env.test', quiet: true, override: true });

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL is not set (check .env.test)');

const { hostname } = new URL(url);
if (!['localhost', '127.0.0.1'].includes(hostname)) {
  throw new Error(
    `Refusing to run tests against non-local database: ${hostname}`,
  );
}

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = url;
