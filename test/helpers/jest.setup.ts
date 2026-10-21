import { loadEnvFiles } from '../../src/shared/config/environment';

// Always test, whatever the shell says; override so the files beat exported variables.
loadEnvFiles({ appEnv: 'test', override: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (check .env.test)');

const { hostname } = new URL(url);
if (!['localhost', '127.0.0.1'].includes(hostname)) {
  throw new Error(
    `Refusing to run tests against non-local database: ${hostname}`,
  );
}

process.env.NODE_ENV = 'test';
